import { NextResponse } from "next/server";

import {
  extractTelegramStartPayload,
  getTelegramWebhookSecret,
  markTelegramVerificationComplete,
  sendTelegramMessage,
  type TelegramUpdate,
} from "@/lib/telegram";

function isWebhookAuthorized(request: Request) {
  const secret = getTelegramWebhookSecret();

  if (!secret) {
    return true;
  }

  return request.headers.get("x-telegram-bot-api-secret-token") === secret;
}

export async function POST(request: Request) {
  if (!isWebhookAuthorized(request)) {
    return NextResponse.json({ ok: false }, { status: 401 });
  }

  const update = (await request.json()) as TelegramUpdate;
  const message = update.message;

  if (!message?.text || message.chat.type !== "private") {
    return NextResponse.json({ ok: true });
  }

  const payload = extractTelegramStartPayload(message.text);

  if (payload === "") {
    await sendTelegramMessage(
      message.chat.id,
      "Привет. Откройте ссылку подтверждения с сайта Endfield Cups и вернитесь сюда через кнопку верификации.",
    );

    return NextResponse.json({ ok: true });
  }

  if (!payload?.startsWith("verify_")) {
    return NextResponse.json({ ok: true });
  }

  const token = payload.slice("verify_".length);
  const result = await markTelegramVerificationComplete({
    token,
    telegramId: message.from?.id ?? message.chat.id,
    telegramUsername: message.from?.username ?? null,
  });

  if (!result.ok) {
    if (result.reason === "expired") {
      await sendTelegramMessage(
        message.chat.id,
        "Этот код подтверждения уже истек. Вернитесь на сайт и запросите новый.",
      );
      return NextResponse.json({ ok: true });
    }

    if (result.reason === "telegram-linked") {
      await sendTelegramMessage(
        message.chat.id,
        "Этот Telegram уже привязан к другому аккаунту Endfield Cups.",
      );
      return NextResponse.json({ ok: true });
    }

    await sendTelegramMessage(
      message.chat.id,
      "Код подтверждения не найден или уже использован.",
    );

    return NextResponse.json({ ok: true });
  }

  await sendTelegramMessage(
    message.chat.id,
    `Аккаунт ${result.user.nickname} подтвержден. Вернитесь на сайт, вход будет открыт автоматически.`,
  );

  return NextResponse.json({ ok: true });
}

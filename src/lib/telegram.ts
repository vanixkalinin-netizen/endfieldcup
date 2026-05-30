import { VerificationPurpose } from "@prisma/client";

import { prisma } from "@/lib/prisma";

const TELEGRAM_TOKEN = process.env.TELEGRAM_BOT_TOKEN;
const TELEGRAM_USERNAME = process.env.TELEGRAM_BOT_USERNAME;
const TELEGRAM_WEBHOOK_SECRET = process.env.TELEGRAM_WEBHOOK_SECRET;
const VERIFICATION_WINDOW_MS = 1000 * 60 * 15;

type TelegramChat = {
  id: number;
  type: string;
};

type TelegramUser = {
  id: number;
  username?: string;
  first_name?: string;
};

export type TelegramUpdate = {
  message?: {
    chat: TelegramChat;
    from?: TelegramUser;
    text?: string;
  };
};

export type TelegramVerificationStatus =
  | {
      status: "missing";
    }
  | {
      status: "invalid";
    }
  | {
      status: "expired";
      email: string;
      nickname: string;
    }
  | {
      status: "pending";
      email: string;
      nickname: string;
      botLink: string | null;
    }
  | {
      status: "verified";
      email: string;
      nickname: string;
      telegramUsername: string | null;
    };

function buildTelegramToken() {
  return crypto.randomUUID().replace(/-/g, "");
}

export function getTelegramBotUsername() {
  return TELEGRAM_USERNAME ?? null;
}

export function isTelegramConfigured() {
  return Boolean(TELEGRAM_TOKEN && TELEGRAM_USERNAME);
}

export function getTelegramWebhookSecret() {
  return TELEGRAM_WEBHOOK_SECRET ?? null;
}

export function buildTelegramVerificationLink(token: string) {
  if (!TELEGRAM_USERNAME) {
    return null;
  }

  return `https://t.me/${TELEGRAM_USERNAME}?start=verify_${token}`;
}

export async function telegramApiRequest<T>(
  method: string,
  payload: Record<string, unknown>,
) {
  if (!TELEGRAM_TOKEN) {
    throw new Error("Telegram bot token is not configured.");
  }

  const response = await fetch(
    `https://api.telegram.org/bot${TELEGRAM_TOKEN}/${method}`,
    {
      method: "POST",
      headers: {
        "content-type": "application/json",
      },
      body: JSON.stringify(payload),
      cache: "no-store",
    },
  );

  const data = (await response.json()) as {
    ok: boolean;
    result?: T;
    description?: string;
  };

  if (!response.ok || !data.ok) {
    throw new Error(data.description || `Telegram API ${method} failed.`);
  }

  return data.result as T;
}

export async function sendTelegramMessage(chatId: number | string, text: string) {
  return telegramApiRequest("sendMessage", {
    chat_id: chatId,
    text,
  });
}

export async function issueTelegramVerificationToken(user: {
  id: string;
  email: string;
  nickname: string;
}) {
  const existingToken = await prisma.verificationCode.findFirst({
    where: {
      userId: user.id,
      purpose: VerificationPurpose.TELEGRAM_CONFIRMATION,
      consumedAt: null,
      expiresAt: {
        gt: new Date(),
      },
    },
    orderBy: {
      createdAt: "desc",
    },
  });

  if (existingToken) {
    return existingToken.code;
  }

  await prisma.verificationCode.deleteMany({
    where: {
      userId: user.id,
      purpose: VerificationPurpose.TELEGRAM_CONFIRMATION,
      consumedAt: null,
    },
  });

  const token = buildTelegramToken();

  await prisma.verificationCode.create({
    data: {
      email: user.email,
      code: token,
      purpose: VerificationPurpose.TELEGRAM_CONFIRMATION,
      userId: user.id,
      expiresAt: new Date(Date.now() + VERIFICATION_WINDOW_MS),
    },
  });

  return token;
}

export async function refreshTelegramVerificationToken(token: string) {
  const verification = await prisma.verificationCode.findUnique({
    where: {
      purpose_code: {
        purpose: VerificationPurpose.TELEGRAM_CONFIRMATION,
        code: token,
      },
    },
    include: {
      user: true,
    },
  });

  if (!verification?.user) {
    return null;
  }

  return issueTelegramVerificationToken({
    id: verification.user.id,
    email: verification.user.email,
    nickname: verification.user.nickname,
  });
}

export async function getTelegramVerificationStatus(
  token: string | null | undefined,
): Promise<TelegramVerificationStatus> {
  if (!token?.trim()) {
    return {
      status: "missing",
    };
  }

  const verification = await prisma.verificationCode.findUnique({
    where: {
      purpose_code: {
        purpose: VerificationPurpose.TELEGRAM_CONFIRMATION,
        code: token,
      },
    },
    include: {
      user: true,
    },
  });

  if (!verification?.user) {
    return {
      status: "invalid",
    };
  }

  if (verification.user.isVerified) {
    return {
      status: "verified",
      email: verification.user.email,
      nickname: verification.user.nickname,
      telegramUsername: verification.user.telegramUsername ?? null,
    };
  }

  if (verification.expiresAt <= new Date()) {
    return {
      status: "expired",
      email: verification.user.email,
      nickname: verification.user.nickname,
    };
  }

  return {
    status: "pending",
    email: verification.user.email,
    nickname: verification.user.nickname,
    botLink: buildTelegramVerificationLink(verification.code),
  };
}

export async function markTelegramVerificationComplete(input: {
  token: string;
  telegramId: number;
  telegramUsername?: string | null;
}) {
  const verification = await prisma.verificationCode.findUnique({
    where: {
      purpose_code: {
        purpose: VerificationPurpose.TELEGRAM_CONFIRMATION,
        code: input.token,
      },
    },
    include: {
      user: true,
    },
  });

  if (!verification?.user) {
    return { ok: false as const, reason: "invalid" as const };
  }

  if (verification.expiresAt <= new Date()) {
    return { ok: false as const, reason: "expired" as const, user: verification.user };
  }

  const existingTelegramUser = await prisma.user.findFirst({
    where: {
      telegramId: String(input.telegramId),
      id: {
        not: verification.user.id,
      },
    },
  });

  if (existingTelegramUser) {
    return { ok: false as const, reason: "telegram-linked" as const };
  }

  await prisma.$transaction([
    prisma.user.update({
      where: { id: verification.user.id },
      data: {
        isVerified: true,
        telegramId: String(input.telegramId),
        telegramUsername: input.telegramUsername ?? null,
        telegramLinkedAt: new Date(),
      },
    }),
    prisma.verificationCode.update({
      where: { id: verification.id },
      data: {
        consumedAt: new Date(),
      },
    }),
    prisma.verificationCode.deleteMany({
      where: {
        userId: verification.user.id,
        purpose: VerificationPurpose.TELEGRAM_CONFIRMATION,
        consumedAt: null,
        id: {
          not: verification.id,
        },
      },
    }),
  ]);

  return {
    ok: true as const,
    user: verification.user,
  };
}

export function extractTelegramStartPayload(text: string | undefined) {
  if (!text) {
    return null;
  }

  const trimmed = text.trim();

  if (trimmed === "/start") {
    return "";
  }

  const match = trimmed.match(/^\/start(?:@\w+)?\s+(.+)$/);
  return match ? match[1].trim() : null;
}

"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

type VerifyStatus =
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

type TelegramVerifyPanelProps = {
  token: string;
  initialStatus: VerifyStatus;
};

export function TelegramVerifyPanel({
  token,
  initialStatus,
}: TelegramVerifyPanelProps) {
  const [status, setStatus] = useState(initialStatus);

  useEffect(() => {
    if (status.status !== "pending") {
      return;
    }

    let isActive = true;
    const intervalId = window.setInterval(async () => {
      const response = await fetch(
        `/api/auth/verification-status?token=${encodeURIComponent(token)}`,
        {
          cache: "no-store",
        },
      );

      if (!response.ok || !isActive) {
        return;
      }

      const nextStatus = (await response.json()) as VerifyStatus;
      setStatus(nextStatus);

      if (nextStatus.status === "verified") {
        window.location.href = `/verify/complete?token=${encodeURIComponent(token)}`;
      }
    }, 4000);

    return () => {
      isActive = false;
      window.clearInterval(intervalId);
    };
  }, [status.status, token]);

  if (status.status === "missing") {
    return (
      <div className="space-y-5">
        <div className="rounded-[22px] border border-[#ff6d7a]/20 bg-[#2a1116] p-5 text-sm text-[#ffb0b8]">
          Ссылка подтверждения не найдена. Вернитесь к регистрации или входу и
          запросите новое подтверждение.
        </div>
        <div className="flex gap-3">
          <Link href="/register" className="primary-button">
            К регистрации
          </Link>
          <Link href="/login" className="ghost-button">
            Ко входу
          </Link>
        </div>
      </div>
    );
  }

  if (status.status === "invalid") {
    return (
      <div className="space-y-5">
        <div className="rounded-[22px] border border-[#ff6d7a]/20 bg-[#2a1116] p-5 text-sm text-[#ffb0b8]">
          Этот запрос подтверждения больше не действует. Создайте новый через
          регистрацию или повторный вход.
        </div>
        <div className="flex gap-3">
          <Link href="/register" className="primary-button">
            Регистрация
          </Link>
          <Link href="/login" className="ghost-button">
            Вход
          </Link>
        </div>
      </div>
    );
  }

  if (status.status === "expired") {
    return (
      <div className="space-y-5">
        <div className="rounded-[22px] border border-[#ffb36d]/20 bg-[#2a1b11] p-5 text-sm text-[#ffd0a7]">
          Время подтверждения для {status.nickname} истекло. Создайте новый код
          и снова откройте бота.
        </div>
        <div className="flex gap-3">
          <Link
            href={`/verify/refresh?token=${encodeURIComponent(token)}`}
            className="primary-button"
          >
            Создать новый код
          </Link>
          <Link href="/login" className="ghost-button">
            Назад ко входу
          </Link>
        </div>
      </div>
    );
  }

  if (status.status === "verified") {
    return (
      <div className="space-y-5">
        <div className="rounded-[22px] border border-[#68d89d]/22 bg-[#0f2217] p-5 text-sm text-[#b9f3d0]">
          Аккаунт подтвержден
          {status.telegramUsername ? ` через @${status.telegramUsername}` : ""}.
          Сейчас откроем вход в систему.
        </div>
        <Link
          href={`/verify/complete?token=${encodeURIComponent(token)}`}
          className="primary-button inline-flex"
        >
          Продолжить
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="rounded-[24px] border border-white/10 bg-white/[0.04] p-5">
        <p className="text-xs uppercase tracking-[0.34em] text-[#9ca5ff]">
          Telegram verification
        </p>
        <h3 className="mt-3 font-heading text-2xl font-bold uppercase tracking-[0.08em] text-white">
          Подтвердите аккаунт
        </h3>
        <p className="mt-3 text-sm leading-7 text-white/60">
          Мы ждем подтверждение для{" "}
          <span className="text-white">{status.nickname}</span>. Откройте бота,
          нажмите старт по ссылке ниже и вернитесь на сайт.
        </p>
      </div>

      <div className="grid gap-3">
        <div className="rounded-[20px] border border-white/8 bg-[#0e121a] p-4 text-sm text-white/62">
          1. Откройте Telegram-бота Endfield Cups.
        </div>
        <div className="rounded-[20px] border border-white/8 bg-[#0e121a] p-4 text-sm text-white/62">
          2. Запустите подтверждение через кнопку ниже.
        </div>
        <div className="rounded-[20px] border border-white/8 bg-[#0e121a] p-4 text-sm text-white/62">
          3. После ответа бота эта страница продолжит вход автоматически.
        </div>
      </div>

      <div className="flex flex-wrap gap-3">
        {status.botLink ? (
          <a
            href={status.botLink}
            target="_blank"
            rel="noreferrer"
            className="primary-button inline-flex"
          >
            Открыть Telegram-бота
          </a>
        ) : (
          <div className="rounded-[18px] border border-[#ffb36d]/20 bg-[#2a1b11] px-4 py-3 text-sm text-[#ffd0a7]">
            Ссылка на бота пока не настроена. Добавьте TELEGRAM_BOT_USERNAME на
            сервере.
          </div>
        )}

        <Link href="/login" className="ghost-button inline-flex">
          Назад ко входу
        </Link>
      </div>
    </div>
  );
}

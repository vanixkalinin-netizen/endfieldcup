"use client";

import { useEffect, useRef, useState } from "react";

import {
  markAllNotificationsReadAction,
  openNotificationAction,
} from "@/actions/notifications";
import { cn } from "@/lib/utils";

type NotificationBellProps = {
  notifications: Array<{
    id: string;
    title: string;
    message: string;
    href: string | null;
    isRead: boolean;
    createdAtLabel: string;
  }>;
  unreadCount: number;
};

export function NotificationBell({
  notifications,
  unreadCount,
}: NotificationBellProps) {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (!isOpen) {
      return;
    }

    function handlePointerDown(event: PointerEvent) {
      if (!containerRef.current?.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }

    document.addEventListener("pointerdown", handlePointerDown);

    return () => {
      document.removeEventListener("pointerdown", handlePointerDown);
    };
  }, [isOpen]);

  return (
    <div ref={containerRef} className="relative">
      <button
        type="button"
        aria-label="Уведомления"
        onClick={() => setIsOpen((currentValue) => !currentValue)}
        className="relative flex h-12 w-12 items-center justify-center rounded-full border border-white/10 bg-white/[0.04] text-white/82 transition-colors hover:[border-color:rgba(var(--accent-start-rgb),0.4)] hover:text-white"
      >
        <svg
          aria-hidden="true"
          viewBox="0 0 24 24"
          className="h-5 w-5"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.8"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <path d="M15 17h5l-1.4-1.4A2 2 0 0 1 18 14.2V11a6 6 0 1 0-12 0v3.2a2 2 0 0 1-.6 1.4L4 17h5" />
          <path d="M10 20a2 2 0 0 0 4 0" />
        </svg>

        {unreadCount ? (
          <span className="absolute right-0.5 top-0.5 flex min-h-5 min-w-5 items-center justify-center rounded-full bg-[#4aa86d] px-1.5 text-[10px] font-bold text-white shadow-[0_0_20px_rgba(74,168,109,0.35)]">
            {unreadCount > 9 ? "9+" : unreadCount}
          </span>
        ) : null}
      </button>

      {isOpen ? (
        <div className="absolute right-0 top-[calc(100%+12px)] z-40 w-[min(360px,calc(100vw-2rem))] rounded-[24px] border border-white/10 bg-[#0d1118]/96 p-3 shadow-[0_24px_80px_rgba(0,0,0,0.42)] backdrop-blur">
          <div className="flex items-center justify-between gap-3 px-2 pb-3">
            <div>
              <p className="text-[11px] uppercase tracking-[0.28em] text-white/34">
                Уведомления
              </p>
              <p className="mt-1 text-sm text-white/58">
                {unreadCount
                  ? `Новых: ${unreadCount}`
                  : "Новых уведомлений нет"}
              </p>
            </div>

            {unreadCount ? (
              <form action={markAllNotificationsReadAction}>
                <button
                  type="submit"
                  className="rounded-full border border-white/10 bg-white/[0.04] px-3 py-2 text-[11px] font-semibold uppercase tracking-[0.18em] text-white/62 transition-colors hover:[border-color:rgba(var(--accent-start-rgb),0.4)] hover:text-white"
                >
                  Прочитать все
                </button>
              </form>
            ) : null}
          </div>

          <div className="space-y-2">
            {notifications.length ? (
              notifications.map((notification) => (
                <form key={notification.id} action={openNotificationAction}>
                  <input
                    type="hidden"
                    name="notificationId"
                    value={notification.id}
                  />
                  <button
                    type="submit"
                    className={cn(
                      "block w-full rounded-[18px] border p-4 text-left transition-colors",
                      notification.isRead
                        ? "border-white/8 bg-white/[0.03] text-white/68 hover:border-white/14 hover:text-white"
                        : "border-[#4aa86d]/28 bg-[#102117] text-white hover:border-[#4aa86d]/46",
                    )}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <p className="text-sm font-semibold">
                          {notification.title}
                        </p>
                        <p className="mt-2 text-sm leading-6 text-white/62">
                          {notification.message}
                        </p>
                        <p className="mt-3 text-[11px] uppercase tracking-[0.22em] text-white/30">
                          {notification.createdAtLabel}
                        </p>
                      </div>

                      {!notification.isRead ? (
                        <span className="mt-1 h-2.5 w-2.5 shrink-0 rounded-full bg-[#4aa86d]" />
                      ) : null}
                    </div>
                  </button>
                </form>
              ))
            ) : (
              <div className="rounded-[18px] border border-white/8 bg-white/[0.03] px-4 py-5 text-sm text-white/48">
                Здесь появятся уведомления, когда админ запустит ваш матч.
              </div>
            )}
          </div>
        </div>
      ) : null}
    </div>
  );
}

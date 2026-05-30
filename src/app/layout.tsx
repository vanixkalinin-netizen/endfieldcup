import type { Metadata } from "next";
import Link from "next/link";
import { Manrope, Oxanium } from "next/font/google";

import { LiveRouteRefresh } from "@/components/live-route-refresh";
import { AvatarBadge } from "@/components/avatar-badge";
import { NotificationBell } from "@/components/notification-bell";
import { SidebarNav } from "@/components/sidebar-nav";
import { ThemeSwitcher } from "@/components/theme-switcher";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { formatDateTime } from "@/lib/utils";
import "./globals.css";

const manrope = Manrope({
  variable: "--font-manrope",
  subsets: ["latin", "cyrillic"],
});

const oxanium = Oxanium({
  variable: "--font-oxanium",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Endfield Cups",
  description:
    "Турнирный сайт по Arknights: Endfield с регистрацией, заявками и отдельной админ-панелью.",
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const currentUser = await getCurrentUser();
  const notificationDelegate = (
    prisma as { notification?: typeof prisma.notification }
  ).notification;
  const [notifications, unreadCount] = currentUser && notificationDelegate
    ? await Promise.all([
        notificationDelegate.findMany({
          where: {
            userId: currentUser.id,
          },
          orderBy: [
            {
              isRead: "asc",
            },
            {
              createdAt: "desc",
            },
          ],
          take: 8,
          select: {
            id: true,
            title: true,
            message: true,
            href: true,
            isRead: true,
            createdAt: true,
          },
        }),
        notificationDelegate.count({
          where: {
            userId: currentUser.id,
            isRead: false,
          },
        }),
      ])
    : [[], 0];

  return (
    <html
      lang="ru"
      className={`${manrope.variable} ${oxanium.variable} h-full antialiased`}
    >
      <body className="min-h-full text-white">
        <div className="app-root relative min-h-screen overflow-hidden">
          <LiveRouteRefresh />

          <div className="relative min-h-screen px-3 py-3 md:px-5 md:py-5">
            <div className="grid min-h-[calc(100vh-24px)] max-w-[1360px] gap-4 lg:grid-cols-[220px_minmax(0,1fr)] xl:grid-cols-[240px_minmax(0,1fr)]">
              <aside className="app-sidebar flex flex-col rounded-[22px] border p-4 shadow-[0_30px_80px_rgba(0,0,0,0.4)] backdrop-blur md:p-5">
                <div className="flex h-full flex-col justify-between gap-8">
                  <div className="space-y-8">
                    <Link href="/" className="block rounded-[18px] px-2 py-3">
                      <div className="space-y-2">
                        <p className="site-kicker text-[10px] uppercase tracking-[0.42em]">
                          Arknights: Endfield
                        </p>
                        <div className="space-y-0.5">
                          <p className="font-heading text-3xl font-bold uppercase tracking-[0.08em]">
                            Endfield
                          </p>
                          <p className="site-accent font-heading text-3xl font-bold uppercase tracking-[0.08em]">
                            Cups
                          </p>
                        </div>
                      </div>
                    </Link>

                    <SidebarNav
                      isAdmin={currentUser?.role === "ADMIN"}
                      isAuthenticated={Boolean(currentUser)}
                    />
                  </div>

                  <div className="rounded-[20px] border border-[rgba(255,70,70,0.16)] bg-[linear-gradient(180deg,rgba(45,9,12,0.92),rgba(13,8,10,0.96))] p-4 shadow-[inset_0_1px_0_rgba(255,255,255,0.05)]">
                    <p className="site-accent font-heading text-lg font-bold uppercase tracking-[0.08em]">
                      Endfield
                    </p>
                    <p className="font-heading text-lg font-bold uppercase tracking-[0.08em] text-white">
                      Cups
                    </p>
                    <p className="mt-3 text-[10px] uppercase tracking-[0.26em] text-white/36">
                      Welcome, doctor
                    </p>
                  </div>
                </div>
              </aside>

              <div className="app-shell flex min-h-[calc(100vh-24px)] flex-col rounded-[24px] border shadow-[0_40px_120px_rgba(0,0,0,0.45)] backdrop-blur">
                <header className="flex flex-col gap-4 border-b border-white/8 px-5 py-5 md:flex-row md:items-start md:justify-between md:px-8">
                  <div className="space-y-2">
                    <p className="site-kicker text-[10px] uppercase tracking-[0.42em]">
                      Operator access
                    </p>
                    <h1 className="font-heading text-xl font-bold uppercase tracking-[0.14em] text-white md:text-3xl">
                      Tournament Interface
                    </h1>
                  </div>

                  <div className="flex items-center gap-3 self-start md:self-auto">
                    {currentUser ? (
                      <>
                        <NotificationBell
                          notifications={notifications.map((notification) => ({
                            ...notification,
                            href: notification.href ?? null,
                            createdAtLabel: formatDateTime(notification.createdAt),
                          }))}
                          unreadCount={unreadCount}
                        />
                        <Link
                          href="/profile"
                          aria-label="Открыть личный кабинет"
                          className="avatar-link"
                        >
                          <AvatarBadge nickname={currentUser.nickname} size="sm" />
                        </Link>
                      </>
                    ) : (
                      <>
                        <Link href="/login" className="ghost-button">
                          Вход
                        </Link>
                        <Link href="/register" className="primary-button">
                          Регистрация
                        </Link>
                      </>
                    )}
                  </div>
                </header>

                <main className="flex-1 px-5 py-5 md:px-8 md:py-8">{children}</main>
              </div>
            </div>
          </div>

          <ThemeSwitcher />
        </div>
      </body>
    </html>
  );
}

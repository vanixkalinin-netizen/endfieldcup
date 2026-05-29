import type { Metadata } from "next";
import Link from "next/link";
import { Manrope, Oxanium } from "next/font/google";

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
          <div className="relative mx-auto grid min-h-screen max-w-[1600px] gap-5 px-3 py-3 lg:grid-cols-[260px_minmax(0,1fr)] lg:px-5 lg:py-5">
            <aside className="app-sidebar flex flex-col rounded-[30px] border p-5 shadow-[0_30px_80px_rgba(0,0,0,0.4)] backdrop-blur">
              <div className="space-y-10">
                <Link href="/" className="block space-y-4 rounded-[20px] p-1">
                  <div className="space-y-1">
                    <p className="font-heading text-3xl font-bold uppercase tracking-[0.08em]">
                      Endfield
                    </p>
                    <p className="site-accent font-heading text-3xl font-bold uppercase tracking-[0.08em]">
                      Cups
                    </p>
                  </div>
                </Link>

                <SidebarNav
                  isAdmin={currentUser?.role === "ADMIN"}
                  isAuthenticated={Boolean(currentUser)}
                />
              </div>
            </aside>

            <div className="app-shell flex min-h-[calc(100vh-24px)] flex-col rounded-[32px] border shadow-[0_40px_120px_rgba(0,0,0,0.45)] backdrop-blur">
              <header className="flex flex-col gap-4 border-b border-white/8 px-5 py-5 md:flex-row md:items-center md:justify-between md:px-8">
                <div>
                  <p className="site-kicker text-xs uppercase tracking-[0.35em]">
                    Arknights: Endfield
                  </p>
                  <h1 className="font-heading text-2xl font-bold uppercase tracking-[0.08em] md:text-4xl">
                    Endfield Tournament Hub
                  </h1>
                </div>

                <div className="flex items-center gap-3 self-end md:self-auto">
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

          <ThemeSwitcher />
        </div>
      </body>
    </html>
  );
}

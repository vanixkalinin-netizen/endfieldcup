import Link from "next/link";

import {
  getDiscordFeedback,
  getDiscordFeedbackClasses,
  getDiscordGuildInviteUrl,
  isDiscordAuthConfigured,
  sanitizeDiscordNextPath,
} from "@/lib/discord";

type LoginPageProps = {
  searchParams: Promise<{
    discord?: string | string[];
    next?: string | string[];
  }>;
};

function takeFirst(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] : value;
}

export default async function LoginPage({ searchParams }: LoginPageProps) {
  const query = await searchParams;
  const nextPath = sanitizeDiscordNextPath(takeFirst(query.next), "/profile");
  const feedback = getDiscordFeedback(takeFirst(query.discord));
  const discordConfigured = isDiscordAuthConfigured();
  const discordInviteUrl = getDiscordGuildInviteUrl();
  const discordConnectHref = `/api/discord/connect?next=${encodeURIComponent(nextPath)}`;

  return (
    <div className="mx-auto w-full max-w-6xl">
      <section className="panel relative overflow-hidden px-6 py-8 md:px-10 md:py-10 xl:px-14 xl:py-12">
        <div className="pointer-events-none absolute inset-0">
          <div className="absolute -left-24 top-0 h-52 w-52 rounded-full bg-[radial-gradient(circle,rgba(212,60,67,0.22),transparent_68%)] blur-3xl" />
          <div className="absolute right-[-4rem] top-1/2 h-72 w-72 -translate-y-1/2 rounded-full bg-[radial-gradient(circle,rgba(212,60,67,0.18),transparent_72%)] blur-3xl" />
          <div className="absolute inset-y-0 right-[28%] hidden w-px bg-white/6 xl:block" />
        </div>

        <div className="relative grid gap-10 xl:grid-cols-[minmax(0,1.2fr)_minmax(380px,440px)] xl:items-center">
          <div className="max-w-3xl">
            <p className="text-xs uppercase tracking-[0.38em] text-[#ff7b7f]">
              Operator access
            </p>
            <h2 className="mt-5 font-heading text-4xl font-bold uppercase tracking-[0.08em] text-white md:text-5xl xl:text-6xl">
              Вход через Discord
            </h2>
          </div>

          <div className="rounded-[28px] border border-white/10 bg-[#0c0f17]/88 p-6 shadow-[0_24px_60px_rgba(0,0,0,0.32)] md:p-8">
            <h3 className="font-heading text-2xl font-bold uppercase tracking-[0.08em] text-white">
              Discord OAuth
            </h3>
            <p className="mt-2 text-sm text-white/52">
              Нажмите кнопку ниже, чтобы войти через Discord, автоматически
              создать профиль и подтвердить доступ через нужный сервер.
            </p>

            {feedback ? (
              <div className={`mt-6 ${getDiscordFeedbackClasses(feedback.tone)}`}>
                {feedback.message}
              </div>
            ) : null}

            <div className="mt-6 flex flex-col gap-3">
              <Link href={discordConnectHref} className="primary-button text-center">
                Войти через Discord
              </Link>
              {discordInviteUrl ? (
                <Link
                  href={discordInviteUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="ghost-button text-center"
                >
                  Открыть Discord сервер
                </Link>
              ) : null}
            </div>

            {!discordConfigured ? (
              <div className="mt-6 rounded-[18px] border border-[#7d2631]/28 bg-[#7d2631]/16 p-4 text-sm text-[#ffccd5]">
                Discord-авторизация еще не настроена. Заполните
                `DISCORD_CLIENT_ID`, `DISCORD_CLIENT_SECRET`,
                `DISCORD_REDIRECT_URI` и `DISCORD_GUILD_ID`.
              </div>
            ) : null}
          </div>
        </div>
      </section>
    </div>
  );
}

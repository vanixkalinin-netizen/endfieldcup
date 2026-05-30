import Link from "next/link";

import { logoutAction } from "@/actions/auth";
import { AvatarBadge } from "@/components/avatar-badge";
import { PasswordForm } from "@/components/forms/password-form";
import { ProfileForm } from "@/components/forms/profile-form";
import { requireUser } from "@/lib/auth";
import {
  getDiscordFeedback,
  getDiscordFeedbackClasses,
  getDiscordGuildInviteUrl,
  getDiscordGuildName,
  isDiscordAuthConfigured,
  resolveDiscordIdentityLabel,
} from "@/lib/discord";
import { prisma } from "@/lib/prisma";

type ProfilePageProps = {
  searchParams: Promise<{
    discord?: string | string[];
  }>;
};

function takeFirst(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] : value;
}

export default async function ProfilePage({ searchParams }: ProfilePageProps) {
  const user = await requireUser();
  const query = await searchParams;
  const applicationCount = await prisma.eventApplication.count({
    where: { userId: user.id },
  });
  const discordConfigured = isDiscordAuthConfigured();
  const discordGuildName = getDiscordGuildName();
  const discordInviteUrl = getDiscordGuildInviteUrl();
  const discordFeedback = getDiscordFeedback(takeFirst(query.discord));
  const discordIdentity = resolveDiscordIdentityLabel(user);
  const discordConnectHref = `/api/discord/connect?next=${encodeURIComponent("/profile")}`;
  const isDiscordReady = Boolean(
    user.discordId &&
      user.discordLinkedAt &&
      user.discordMemberAt &&
      !user.discordPending,
  );

  return (
    <div className="space-y-5">
      <section className="panel grid gap-6 p-7 md:grid-cols-[auto_minmax(0,1fr)_auto] md:items-center md:p-8">
        <AvatarBadge nickname={user.nickname} size="xl" />

        <div>
          <p className="text-xs uppercase tracking-[0.34em] text-[#8891dd]">
            Personal cabinet
          </p>
          <h2 className="mt-4 font-heading text-4xl font-bold uppercase tracking-[0.08em] text-white">
            {user.nickname}
          </h2>
          <p className="mt-4 max-w-2xl text-white/56">
            {user.bio || "Пока без описания. Добавьте пару строк о себе ниже."}
          </p>
        </div>

        <div className="flex flex-col gap-3 md:items-end">
          <Link
            href={`/players/${encodeURIComponent(user.nickname)}`}
            className="ghost-button text-center"
          >
            Публичный профиль
          </Link>
          <form action={logoutAction} className="w-full md:w-auto">
            <button type="submit" className="ghost-button w-full">
              Выйти
            </button>
          </form>
        </div>
      </section>

      {discordFeedback ? (
        <div className={getDiscordFeedbackClasses(discordFeedback.tone)}>
          {discordFeedback.message}
        </div>
      ) : null}

      <section className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_420px]">
        <div className="panel p-7">
          <div className="flex items-center justify-between">
            <h3 className="section-title">Описание профиля</h3>
            <span className="inline-flex items-center gap-1.5 text-sm text-white/45">
              <span>{applicationCount}</span>
              <span>заявок</span>
            </span>
          </div>
          <div className="mt-6">
            <ProfileForm bio={user.bio} />
          </div>
        </div>

        <div className="panel p-7">
          <h3 className="section-title">Смена пароля</h3>
          <p className="mt-3 text-sm text-white/52">
            Для обновления пароля введите текущий пароль, затем новый пароль
            дважды.
          </p>
          <div className="mt-6">
            <PasswordForm />
          </div>
        </div>
      </section>

      <section className="panel p-7">
        <div className="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
          <div className="space-y-3">
            <p className="text-[11px] uppercase tracking-[0.28em] text-[#8891dd]">
              Tournament access
            </p>
            <h3 className="font-heading text-3xl font-bold uppercase tracking-[0.08em] text-white">
              Доступ через {discordGuildName}
            </h3>
            <p className="max-w-3xl text-sm leading-6 text-white/58">
              Чтобы участвовать в турнирах, аккаунт должен пройти Discord OAuth и
              быть участником нужного сервера. После успешной проверки форма
              участия на страницах событий откроется автоматически.
            </p>
            {discordIdentity ? (
              <p className="text-sm text-white/65">
                Текущий Discord: {discordIdentity}
              </p>
            ) : null}
            {isDiscordReady ? (
              <p className="text-sm text-[#c7f2d6]">
                Доступ открыт. Сервер Discord подтвержден.
              </p>
            ) : user.discordPending ? (
              <p className="text-sm text-[#f8ddb0]">
                Discord найден, но завершите проверку на сервере, затем повторите
                авторизацию.
              </p>
            ) : (
              <p className="text-sm text-white/55">
                Пока доступ не открыт. Подключите Discord и подтвердите участие в
                сервере.
              </p>
            )}
          </div>

          <div className="flex w-full max-w-sm flex-col gap-3">
            <Link href={discordConnectHref} className="primary-button text-center">
              {user.discordId ? "Обновить Discord-проверку" : "Войти через Discord"}
            </Link>
            {discordInviteUrl ? (
              <Link
                href={discordInviteUrl}
                target="_blank"
                rel="noreferrer"
                className="ghost-button text-center"
              >
                Открыть сервер Discord
              </Link>
            ) : null}
            {!discordConfigured ? (
              <div className="rounded-[18px] border border-[#7d2631]/28 bg-[#7d2631]/16 p-4 text-sm text-[#ffccd5]">
                Discord-авторизация еще не настроена. Заполните переменные
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

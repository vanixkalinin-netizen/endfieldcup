import Link from "next/link";

import { logoutAction } from "@/actions/auth";
import { AvatarBadge } from "@/components/avatar-badge";
import { ProfileForm } from "@/components/forms/profile-form";
import { requireUser } from "@/lib/auth";
import {
  getDiscordFeedback,
  getDiscordFeedbackClasses,
  getDiscordGuildInviteUrl,
  getDiscordGuildName,
  isDiscordAuthConfigured,
  isDiscordVerified,
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
  const discordReady = isDiscordVerified(user);

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
          <h3 className="section-title">Статус Discord</h3>
          <p className="mt-3 text-sm text-white/52">
            Вход и подтверждение аккаунта теперь работают только через Discord.
            Сайт сверяет членство с сервером {discordGuildName} и по нему
            открывает турнирный доступ.
          </p>
          <div className="mt-6 space-y-4 rounded-[22px] border border-white/8 bg-white/[0.04] p-5">
            {discordIdentity ? (
              <p className="text-sm text-white/68">Текущий Discord: {discordIdentity}</p>
            ) : (
              <p className="text-sm text-white/55">
                Discord еще не привязан к этому профилю.
              </p>
            )}

            {discordReady ? (
              <p className="text-sm text-[#c7f2d6]">
                Аккаунт подтвержден: нужный Discord-сервер найден.
              </p>
            ) : user.discordPending ? (
              <p className="text-sm text-[#f8ddb0]">
                Discord найден, но подтверждение на сервере еще не завершено.
              </p>
            ) : (
              <p className="text-sm text-white/55">
                Турнирный доступ пока закрыт. Выполните Discord-вход и убедитесь,
                что вы состоите на нужном сервере.
              </p>
            )}

            <div className="flex flex-col gap-3">
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
                  Открыть Discord сервер
                </Link>
              ) : null}
            </div>
          </div>
        </div>
      </section>

      {!discordConfigured ? (
        <div className="rounded-[18px] border border-[#7d2631]/28 bg-[#7d2631]/16 p-4 text-sm text-[#ffccd5]">
          Discord-авторизация еще не настроена. Заполните переменные
          `DISCORD_CLIENT_ID`, `DISCORD_CLIENT_SECRET`,
          `DISCORD_REDIRECT_URI` и `DISCORD_GUILD_ID`.
        </div>
      ) : null}
    </div>
  );
}

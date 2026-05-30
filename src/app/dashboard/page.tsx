import Link from "next/link";

import { ApplicationStatus } from "@prisma/client";

import { StatusPill } from "@/components/status-pill";
import { requireUser } from "@/lib/auth";
import { isDiscordVerified, resolveDiscordIdentityLabel } from "@/lib/discord";
import { prisma } from "@/lib/prisma";
import { formatDateTime } from "@/lib/utils";

export default async function DashboardPage() {
  const user = await requireUser();
  const discordReady = isDiscordVerified(user);
  const discordIdentity = resolveDiscordIdentityLabel(user);
  const applications = await prisma.eventApplication.findMany({
    where: { userId: user.id },
    orderBy: { createdAt: "desc" },
    include: {
      event: true,
    },
  });

  return (
    <div className="space-y-5">
      <section className="panel grid gap-5 p-7 md:grid-cols-[minmax(0,1fr)_320px] md:p-8">
        <div>
          <p className="site-accent-soft text-xs uppercase tracking-[0.34em]">
            Pilot profile
          </p>
          <h2 className="mt-4 font-heading text-4xl font-bold uppercase tracking-[0.08em] text-white">
            {user.nickname}
          </h2>
        </div>
        <div className="rounded-[24px] border border-white/8 bg-white/[0.03] p-5 text-sm text-white/56">
          <p className="text-xs uppercase tracking-[0.3em] text-white/35">
            Статус аккаунта
          </p>
          <p className="site-accent mt-4 font-heading text-2xl font-bold uppercase tracking-[0.08em]">
            {discordReady
              ? "Подтвержден"
              : user.discordPending
                ? "Ожидает"
                : user.discordId
                  ? "Нужен сервер"
                  : "Discord не подключен"}
          </p>
          <p className="mt-3">
            {discordIdentity
              ? `Текущий Discord: ${discordIdentity}.`
              : "Выполните вход через Discord, чтобы подтвердить аккаунт."}{" "}
            Здесь лежат все ваши участия. Открывайте нужное событие, чтобы
            посмотреть сетку и актуальный статус.
          </p>
        </div>
      </section>

      <section className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="section-title">Мои участия</h3>
          <span className="inline-flex items-center gap-1.5 text-sm text-white/45">
            <span>{applications.length}</span>
            <span>всего</span>
          </span>
        </div>

        {applications.length ? (
          <div className="grid gap-4">
            {applications.map((application) => (
              <article key={application.id} className="panel p-6">
                <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
                  <div>
                    <div className="flex items-center gap-3">
                      <StatusPill
                        status={
                          application.status === ApplicationStatus.REJECTED
                            ? application.status
                            : ApplicationStatus.APPROVED
                        }
                      />
                      <span className="text-xs uppercase tracking-[0.3em] text-white/30">
                        {formatDateTime(application.createdAt)}
                      </span>
                    </div>
                    <Link
                      href={`/events/${application.event.slug}`}
                      className="site-accent-hover mt-4 inline-block font-heading text-3xl font-bold uppercase tracking-[0.06em] text-white"
                    >
                      {application.event.title}
                    </Link>
                    <p className="mt-3 max-w-2xl text-white/58">
                      {application.event.description}
                    </p>
                  </div>
                  <div className="max-w-sm rounded-[22px] border border-white/8 bg-white/[0.03] p-4 text-sm text-white/56">
                    <p className="text-xs uppercase tracking-[0.24em] text-white/30">
                      Discord
                    </p>
                    <p className="mt-3">{application.discordNickname}</p>
                    <p className="mt-4 text-xs uppercase tracking-[0.24em] text-white/30">
                      Комментарий
                    </p>
                    <p className="mt-3">
                      {application.note || "Комментарий не добавлен."}
                    </p>
                  </div>
                </div>
              </article>
            ))}
          </div>
        ) : (
          <div className="panel p-6 text-white/55">
            У вас пока нет участий. На главной странице можно выбрать событие и
            зарегистрироваться в первый турнир.
          </div>
        )}
      </section>
    </div>
  );
}

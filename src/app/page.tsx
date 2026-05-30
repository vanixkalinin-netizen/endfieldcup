import { ApplicationStatus, EventStatus } from "@prisma/client";
import Link from "next/link";

import { AvatarBadge } from "@/components/avatar-badge";
import { StatusPill } from "@/components/status-pill";
import { getCurrentUser } from "@/lib/auth";
import { buildBracket, type BracketMatch as BracketMatchType } from "@/lib/bracket";
import { prisma } from "@/lib/prisma";
import { cn, formatDate } from "@/lib/utils";

export default async function Home() {
  const [currentUser, events] = await Promise.all([
    getCurrentUser(),
    prisma.event.findMany({
      orderBy: [{ status: "asc" }, { startsAt: "asc" }],
      include: {
        applications: {
          select: {
            userId: true,
            status: true,
            discordNickname: true,
            user: {
              select: {
                id: true,
                nickname: true,
              },
            },
          },
        },
      },
    }),
  ]);

  const visibleEvents = events.filter(
    (event) => event.status !== EventStatus.DRAFT,
  );
  type VisibleEvent = (typeof visibleEvents)[number];
  type BracketMatch = BracketMatchType;
  type LiveMatchSummary = {
    event: VisibleEvent;
    match: BracketMatch & {
      participants: [
        NonNullable<BracketMatch["participants"][0]>,
        NonNullable<BracketMatch["participants"][1]>,
      ];
    };
    isCurrentUserPlaying: boolean;
  };

  const liveMatch = visibleEvents
    .map((event) => {
      const participants = event.applications
        .filter((application) => application.status !== ApplicationStatus.REJECTED)
        .map((application) => ({
          id: application.user.id,
          nickname: application.user.nickname,
          discordNickname: application.discordNickname,
        }));
      const bracket = buildBracket(participants, event.bracketState);
      const match = bracket.rounds
        .flatMap((round) => round.matches)
        .find((candidateMatch) => candidateMatch.isLive);

      if (!match || !match.participants[0] || !match.participants[1]) {
        return null;
      }

      return {
        event,
        match: {
          ...match,
          participants: [match.participants[0], match.participants[1]],
        },
        isCurrentUserPlaying: match.participants.some(
          (participant) => participant?.id === currentUser?.id,
        ),
      } satisfies LiveMatchSummary;
    })
    .find((candidateMatch) => candidateMatch !== null);

  return (
    <div className="space-y-7 lg:max-w-[1020px]">
      <section className="space-y-4">
        <div className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
          <div>
            <p className="site-kicker text-[11px] uppercase tracking-[0.38em]">
              Current match
            </p>
            <h3 className="section-title mt-2">Текущий матч</h3>
          </div>

          <span
            className={cn(
              "inline-flex w-fit items-center gap-2 rounded-full border px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.24em]",
              liveMatch
                ? "border-[#d43c43]/32 bg-[#d43c43]/12 text-[#ffd7d7]"
                : "border-white/10 bg-white/[0.04] text-white/46",
            )}
          >
            <span
              className={cn(
                "status-dot h-2 w-2 rounded-full",
                liveMatch ? "bg-[#ff5c60]" : "bg-white/24",
              )}
            />
            {liveMatch ? "Идет сейчас" : "Ожидание"}
          </span>
        </div>

        {liveMatch ? (
          <article className="relative overflow-hidden rounded-[24px] border border-[rgba(217,58,65,0.24)] bg-[linear-gradient(180deg,rgba(16,10,12,0.94),rgba(6,6,7,0.92))] p-5 shadow-[0_24px_80px_rgba(0,0,0,0.42)] md:p-6">
            <div className="pointer-events-none absolute inset-x-5 top-0 h-px bg-[linear-gradient(90deg,transparent,rgba(255,93,93,0.7),transparent)]" />
            <div className="pointer-events-none absolute right-[-4rem] top-[-3rem] h-36 w-36 rounded-full bg-[#bf2731]/20 blur-3xl" />

            <div className="relative space-y-5">
              <div className="flex flex-wrap items-center gap-3">
                <span className="inline-flex items-center gap-2 rounded-full border border-[#d43c43]/32 bg-[#d43c43]/14 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.24em] text-[#ffd7d7]">
                  <span className="status-dot h-2 w-2 rounded-full bg-[#ff5c60]" />
                  Идет сейчас
                </span>
                <span className="rounded-full border border-white/10 bg-white/[0.03] px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.24em] text-white/54">
                  {liveMatch.match.label}
                </span>
                <span className="rounded-full border border-white/10 bg-white/[0.03] px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.24em] text-white/54">
                  Регион {liveMatch.event.location || "Онлайн"}
                </span>
              </div>

              <div>
                <p className="site-accent text-xs uppercase tracking-[0.32em]">
                  {liveMatch.event.title}
                </p>
              </div>

              <div className="rounded-[22px] border border-[rgba(255,70,70,0.14)] bg-black/26 p-4 shadow-[inset_0_1px_0_rgba(255,255,255,0.04)] md:p-5">
                <div className="grid gap-4 md:grid-cols-[minmax(0,1fr)_auto_minmax(0,1fr)] md:items-center">
                  {liveMatch.match.participants.map((participant, index) => (
                    <div
                      key={participant.id}
                      className={cn(
                        "rounded-[18px] border px-4 py-4",
                        liveMatch.isCurrentUserPlaying &&
                          participant.id === currentUser?.id
                          ? "border-[#d43c43]/36 bg-[#311114]"
                          : "border-white/8 bg-white/[0.03]",
                      )}
                    >
                      <div className="flex items-center gap-3">
                        <AvatarBadge
                          nickname={participant.nickname}
                          size="sm"
                          className="h-12 w-12 border-white/10 text-sm shadow-[0_16px_30px_rgba(0,0,0,0.35)]"
                        />
                        <div className="min-w-0">
                          <p className="text-[10px] uppercase tracking-[0.28em] text-white/30">
                            Игрок {index + 1}
                          </p>
                          <p className="mt-1 truncate font-heading text-2xl font-bold uppercase tracking-[0.06em] text-white">
                            {participant.nickname}
                          </p>
                          {liveMatch.isCurrentUserPlaying &&
                          participant.id === currentUser?.id ? (
                            <p className="mt-2 text-[10px] uppercase tracking-[0.24em] text-[#ffb2b4]">
                              Это вы
                            </p>
                          ) : null}
                        </div>
                      </div>
                    </div>
                  ))}

                  <div className="flex items-center justify-center">
                    <div className="rounded-full border border-[#d43c43]/30 bg-[#d43c43]/10 px-5 py-4 shadow-[0_0_28px_rgba(190,39,49,0.2)]">
                      <span className="font-heading text-3xl font-bold uppercase tracking-[0.12em] text-[#ff7c7e]">
                        VS
                      </span>
                    </div>
                  </div>
                </div>

                <div className="mt-5 flex justify-start md:justify-end">
                  <Link
                    href={`/events/${liveMatch.event.slug}`}
                    className="primary-button inline-flex items-center justify-center"
                  >
                    Открыть текущий матч
                  </Link>
                </div>
              </div>
            </div>
          </article>
        ) : (
          <article className="panel border-[rgba(255,70,70,0.12)] bg-[linear-gradient(180deg,rgba(12,9,10,0.92),rgba(8,7,8,0.86))] p-6">
            <div className="flex flex-col gap-5 md:flex-row md:items-center md:justify-between">
              <div>
                <h4 className="font-heading text-2xl font-bold uppercase tracking-[0.08em] text-white">
                  Сейчас нет активного матча
                </h4>
                <p className="mt-3 max-w-2xl text-sm leading-7 text-white/48">
                  Как только администратор запускает матч в сетке, этот блок
                  автоматически обновляется и показывает текущую пару игроков.
                </p>
              </div>

              <div className="flex h-[132px] w-full max-w-[260px] items-center justify-center rounded-[20px] border border-white/8 bg-[linear-gradient(180deg,rgba(42,10,13,0.55),rgba(9,8,9,0.92))]">
                <div className="flex h-16 w-16 items-center justify-center rounded-full border border-[#d43c43]/24 bg-[#d43c43]/8">
                  <div className="ml-1 h-0 w-0 border-y-[10px] border-l-[16px] border-y-transparent border-l-[#ff9da0]/80" />
                </div>
              </div>
            </div>
          </article>
        )}
      </section>

      <section className="space-y-4">
        <div className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
          <div>
            <p className="site-kicker text-[11px] uppercase tracking-[0.38em]">
              Events
            </p>
            <h3 className="section-title mt-2">События</h3>
          </div>

          <span className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.03] px-3 py-1 text-[11px] uppercase tracking-[0.24em] text-white/42">
            <span>{visibleEvents.length}</span>
            <span>доступно</span>
          </span>
        </div>

        <div className="space-y-4">
          {visibleEvents.length ? (
            visibleEvents.map((event) => {
              const myApplication = event.applications.find(
                (application) =>
                  application.userId === currentUser?.id &&
                  application.status !== ApplicationStatus.REJECTED,
              );

              return (
                <article
                  key={event.id}
                  className="panel border-[rgba(255,70,70,0.12)] bg-[linear-gradient(180deg,rgba(10,8,9,0.93),rgba(7,6,7,0.88))] p-5 md:p-6"
                >
                  <div className="flex flex-col gap-6 xl:flex-row xl:items-center xl:justify-between">
                    <div className="space-y-4">
                      <div className="flex flex-wrap items-center gap-3">
                        <StatusPill status={event.status} />
                        <span className="text-[11px] uppercase tracking-[0.28em] text-white/34">
                          Старт: {formatDate(event.startsAt)}
                        </span>
                      </div>

                      <div>
                        <h4 className="font-heading text-3xl font-bold uppercase tracking-[0.06em] text-white">
                          {event.title}
                        </h4>
                        {event.location ? (
                          <p className="mt-2 text-[11px] uppercase tracking-[0.28em] text-white/32">
                            {event.location}
                          </p>
                        ) : null}
                        <p className="mt-4 max-w-3xl text-sm leading-7 text-white/56">
                          {event.description}
                        </p>
                      </div>
                    </div>

                    <div className="w-full max-w-[340px] rounded-[18px] border border-[rgba(255,70,70,0.14)] bg-[linear-gradient(180deg,rgba(48,10,13,0.42),rgba(11,9,10,0.88))] p-4">
                      {myApplication ? (
                        <div className="space-y-4">
                          <div className="flex items-center gap-3">
                            <StatusPill status={ApplicationStatus.APPROVED} />
                            <span className="text-sm text-white/50">
                              Вы уже участвуете в событии
                            </span>
                          </div>

                          <Link
                            href={`/events/${event.slug}`}
                            className="primary-button flex w-full items-center justify-center"
                          >
                            Открыть событие
                          </Link>
                        </div>
                      ) : (
                        <div className="space-y-4">
                          <p className="text-sm leading-7 text-white/54">
                            Откройте событие, чтобы зарегистрироваться и перейти
                            к турнирной сетке.
                          </p>

                          <Link
                            href={`/events/${event.slug}`}
                            className="primary-button flex w-full items-center justify-center"
                          >
                            Открыть событие
                          </Link>
                        </div>
                      )}
                    </div>
                  </div>
                </article>
              );
            })
          ) : (
            <div className="panel border-[rgba(255,70,70,0.12)] bg-[linear-gradient(180deg,rgba(10,8,9,0.93),rgba(7,6,7,0.88))] p-6 text-white/55">
              Пока нет активных событий.
            </div>
          )}
        </div>
      </section>
    </div>
  );
}

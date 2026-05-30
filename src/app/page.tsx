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
        </div>

        {liveMatch ? (
          <article className="relative overflow-hidden rounded-[24px] border border-[rgba(217,58,65,0.24)] bg-[linear-gradient(180deg,rgba(16,10,12,0.94),rgba(6,6,7,0.92))] p-5 shadow-[0_24px_80px_rgba(0,0,0,0.42)] md:p-6">
            <div className="pointer-events-none absolute inset-x-5 top-0 h-px bg-[linear-gradient(90deg,transparent,rgba(255,93,93,0.7),transparent)]" />
            <div className="pointer-events-none absolute right-[-4rem] top-[-3rem] h-36 w-36 rounded-full bg-[#bf2731]/20 blur-3xl" />

            <div className="relative space-y-5">
                <div className="flex flex-wrap items-center gap-3">
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

              <div className="relative overflow-hidden rounded-[24px] border border-[rgba(255,70,70,0.16)] bg-[linear-gradient(180deg,rgba(8,7,8,0.99),rgba(10,7,9,0.95))] p-4 shadow-[inset_0_1px_0_rgba(255,255,255,0.04)] md:p-5">
                <div
                  className="pointer-events-none absolute inset-0 bg-center bg-no-repeat opacity-70"
                  style={{
                    backgroundImage: "url('/live-match-vs-emblem.png')",
                    backgroundSize: "100% 100%",
                  }}
                />
                <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(255,70,70,0.05),transparent_30%),linear-gradient(90deg,rgba(120,18,24,0.08),transparent_18%,transparent_82%,rgba(120,18,24,0.08))]" />
                <div className="pointer-events-none absolute inset-x-4 top-0 h-px bg-[linear-gradient(90deg,transparent,rgba(211,52,57,0.55),transparent)]" />
                <div className="pointer-events-none absolute inset-x-6 bottom-3 h-px bg-[linear-gradient(90deg,transparent,rgba(211,52,57,0.55),transparent)]" />
                <div className="pointer-events-none absolute left-1/2 top-1/2 h-28 w-40 -translate-x-1/2 -translate-y-1/2 bg-[radial-gradient(circle,rgba(188,36,44,0.14),transparent_72%)] blur-2xl" />

                <div className="relative flex flex-col gap-3 sm:grid sm:grid-cols-[minmax(0,1fr)_110px_minmax(0,1fr)] sm:items-center sm:gap-3">
                  {(() => {
                    const firstParticipant = liveMatch.match.participants[0];
                    const secondParticipant = liveMatch.match.participants[1];
                    const firstIsCurrentUser =
                      liveMatch.isCurrentUserPlaying &&
                      firstParticipant.id === currentUser?.id;
                    const secondIsCurrentUser =
                      liveMatch.isCurrentUserPlaying &&
                      secondParticipant.id === currentUser?.id;

                    return (
                      <>
                        <div
                          className={cn(
                            "min-w-0 rounded-[18px] border px-4 py-4 shadow-[inset_0_1px_0_rgba(255,255,255,0.04)]",
                            firstIsCurrentUser
                              ? "border-[#d43c43]/42 bg-[linear-gradient(180deg,rgba(92,25,29,0.94),rgba(55,14,18,0.94))]"
                              : "border-white/8 bg-[linear-gradient(180deg,rgba(255,255,255,0.025),rgba(255,255,255,0.012))]",
                          )}
                        >
                          <div className="flex items-center gap-3">
                            <AvatarBadge
                              nickname={firstParticipant.nickname}
                              size="sm"
                              className="h-11 w-11 shrink-0 border-white/10 text-[13px] shadow-[0_16px_30px_rgba(0,0,0,0.35)]"
                            />

                            <div className="min-w-0">
                              <p className="text-[10px] uppercase tracking-[0.3em] text-white/28">
                                Игрок 1
                              </p>
                              <p className="mt-1 truncate font-heading text-[1.05rem] font-bold uppercase tracking-[0.06em] text-white sm:text-[1.14rem]">
                                {firstParticipant.nickname}
                              </p>
                            </div>
                          </div>
                        </div>

                        <div className="flex h-[84px] items-center justify-center py-1 sm:py-0" />

                        <div
                          className={cn(
                            "min-w-0 rounded-[18px] border px-4 py-4 shadow-[inset_0_1px_0_rgba(255,255,255,0.04)]",
                            secondIsCurrentUser
                              ? "border-[#d43c43]/42 bg-[linear-gradient(180deg,rgba(92,25,29,0.94),rgba(55,14,18,0.94))]"
                              : "border-white/8 bg-[linear-gradient(180deg,rgba(255,255,255,0.025),rgba(255,255,255,0.012))]",
                          )}
                        >
                          <div className="flex items-center gap-3">
                            <AvatarBadge
                              nickname={secondParticipant.nickname}
                              size="sm"
                              className="h-11 w-11 shrink-0 border-white/10 text-[13px] shadow-[0_16px_30px_rgba(0,0,0,0.35)]"
                            />

                            <div className="min-w-0">
                              <p className="text-[10px] uppercase tracking-[0.3em] text-white/28">
                                Игрок 2
                              </p>
                              <p className="mt-1 truncate font-heading text-[1.05rem] font-bold uppercase tracking-[0.06em] text-white sm:text-[1.14rem]">
                                {secondParticipant.nickname}
                              </p>
                              {secondIsCurrentUser ? (
                                <span className="mt-2 inline-flex rounded-full border border-[#ff8d90]/26 bg-[#d43c43]/14 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-[0.18em] text-[#ffd1d2]">
                                  Это вы
                                </span>
                              ) : null}
                            </div>
                          </div>
                        </div>

                        <div className="flex sm:col-start-3 sm:row-start-2 sm:justify-start">
                          <Link
                            href={`/events/${liveMatch.event.slug}`}
                            className="primary-button inline-flex min-h-[70px] w-full items-center justify-center text-center leading-6 sm:min-h-[74px] sm:w-full"
                          >
                            Открыть текущий матч
                          </Link>
                        </div>
                      </>
                    );
                  })()}
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

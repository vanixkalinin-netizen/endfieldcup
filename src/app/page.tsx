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
    <div className="space-y-8">
      <section className="space-y-5">
        <div className="flex items-center justify-between">
          <h3 className="section-title">Текущий матч</h3>
          <span
            className={cn(
              "inline-flex items-center gap-2 rounded-full border px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.24em]",
              liveMatch
                ? "border-[#4aa86d]/22 bg-[#4aa86d]/10 text-[#c8ffd9]"
                : "border-white/10 bg-white/[0.04] text-white/50",
            )}
          >
            <span
              className={cn(
                "status-dot h-2 w-2 rounded-full",
                liveMatch ? "bg-[#4aa86d]" : "bg-white/30",
              )}
            />
            Live
          </span>
        </div>

        {liveMatch ? (
          <article className="relative overflow-hidden rounded-[32px] border border-[#4aa86d]/26 bg-[radial-gradient(circle_at_top_left,_rgba(74,168,109,0.22),_transparent_34%),radial-gradient(circle_at_bottom_right,_rgba(58,93,255,0.18),_transparent_28%),linear-gradient(135deg,_rgba(10,18,14,0.98),_rgba(7,10,17,0.98))] p-6 shadow-[0_28px_90px_rgba(0,0,0,0.36)]">
            <div className="pointer-events-none absolute -right-12 top-0 h-36 w-36 rounded-full bg-[#4aa86d]/10 blur-3xl" />
            <div className="pointer-events-none absolute bottom-0 left-0 h-32 w-40 rounded-full bg-[#4e78ff]/10 blur-3xl" />

            <div className="relative space-y-5">
              <div className="space-y-5">
                <div className="flex flex-wrap items-center gap-3">
                  <span className="inline-flex items-center gap-2 rounded-full border border-[#4aa86d]/28 bg-[#4aa86d]/12 px-3 py-1.5 text-[11px] font-semibold uppercase tracking-[0.24em] text-[#c8ffd9]">
                    <span className="status-dot h-2 w-2 rounded-full bg-[#4aa86d]" />
                    Идет сейчас
                  </span>
                  <span className="rounded-full border border-white/10 bg-white/[0.04] px-3 py-1.5 text-[11px] font-semibold uppercase tracking-[0.24em] text-white/60">
                    {liveMatch.match.label}
                  </span>
                  <span className="rounded-full border border-white/10 bg-white/[0.04] px-3 py-1.5 text-[11px] font-semibold uppercase tracking-[0.24em] text-white/60">
                    Регион {liveMatch.event.location || "Онлайн"}
                  </span>
                </div>

                <div>
                  <p className="text-xs uppercase tracking-[0.32em] text-[#8fb39a]">
                    {liveMatch.event.title}
                  </p>
                  <p className="hidden mt-4 max-w-2xl text-sm leading-7 text-white/62">
                    Зелёный матч в турнирной сетке уже запущен админом. Здесь мы
                    показываем, кто сейчас на арене и куда перейти, чтобы открыть
                    событие и следить за сеткой.
                  </p>
                </div>
              </div>

              <div className="w-full rounded-[28px] border border-white/10 bg-black/18 p-4 shadow-[inset_0_1px_0_rgba(255,255,255,0.04)]">
                <div className="grid grid-cols-[minmax(0,1fr)_auto_minmax(0,1fr)] items-center gap-3">
                  {liveMatch.match.participants.map((participant, index) => (
                    <div
                      key={participant.id}
                      className={cn(
                        "rounded-[22px] border p-4",
                        index === 0 ? "order-1" : "order-3",
                        liveMatch.isCurrentUserPlaying &&
                          participant.id === currentUser?.id
                          ? "border-[#7ee29d]/40 bg-[#153021]"
                          : "border-white/10 bg-white/[0.04]",
                      )}
                    >
                      <div className="flex items-center gap-3">
                        <AvatarBadge
                          nickname={participant.nickname}
                          size="sm"
                          className="h-12 w-12 border-white/12 text-sm"
                        />
                        <div className="min-w-0">
                          <p className="truncate text-[11px] uppercase tracking-[0.24em] text-white/34">
                            Игрок {index + 1}
                          </p>
                          <p className="mt-1 truncate font-heading text-xl font-bold uppercase tracking-[0.06em] text-white">
                            {participant.nickname}
                          </p>
                          {liveMatch.isCurrentUserPlaying &&
                          participant.id === currentUser?.id ? (
                            <p className="mt-2 text-xs uppercase tracking-[0.22em] text-[#bff7d0]">
                              Это вы
                            </p>
                          ) : null}
                        </div>
                      </div>
                    </div>
                  ))}

                  <div className="order-2 flex items-center justify-center">
                    <div className="rounded-full border border-[#4aa86d]/28 bg-[#4aa86d]/12 px-4 py-3 text-center">
                      <p className="font-heading text-lg font-bold uppercase tracking-[0.18em] text-[#d8ffe5]">
                        VS
                      </p>
                    </div>
                  </div>
                </div>

                <div className="mt-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                  <Link
                    href={`/events/${liveMatch.event.slug}`}
                    className="inline-flex items-center justify-center rounded-[18px] border border-[#69d38d]/32 bg-[linear-gradient(135deg,_#2a8c4c,_#4e78ff)] px-5 py-3 text-sm font-semibold text-white shadow-[0_18px_34px_rgba(50,120,255,0.22)] transition-transform hover:-translate-y-0.5 sm:ml-auto"
                  >
                    Открыть текущий матч
                  </Link>
                </div>
              </div>
            </div>
          </article>
        ) : (
          <article className="relative overflow-hidden rounded-[30px] border border-white/10 bg-[radial-gradient(circle_at_top_left,_rgba(255,255,255,0.06),_transparent_30%),linear-gradient(180deg,_rgba(255,255,255,0.035),_rgba(255,255,255,0.015))] p-6">
            <div className="flex flex-col gap-6 md:flex-row md:items-center md:justify-between">
              <div>
                <h2 className="font-heading text-2xl font-bold uppercase tracking-[0.08em] text-white">
                  Сейчас нет активного матча
                </h2>
                <p className="hidden mt-3 max-w-2xl text-sm leading-7 text-white/48">
                  Как только админ отметит матч кнопкой A в сетке, здесь сразу
                  появится отдельный live-блок с текущей парой игроков.
                </p>
              </div>
              <div className="relative h-[152px] w-full max-w-[280px] overflow-hidden rounded-[24px] border border-white/10 bg-[linear-gradient(180deg,_rgba(255,255,255,0.06),_rgba(255,255,255,0.02))] p-5 text-[0px] leading-none text-transparent">
                <div className="pointer-events-none absolute inset-x-6 top-2 h-10 rounded-full bg-white/[0.04] blur-2xl" />
                <div className="relative flex h-full items-center justify-center rounded-[20px] border border-white/10 bg-[#17191f] shadow-[inset_0_1px_0_rgba(255,255,255,0.05)]">
                  <div className="flex h-16 w-16 items-center justify-center rounded-full border border-white/10 bg-white/[0.04]">
                    <div className="ml-1 h-0 w-0 border-y-[11px] border-l-[18px] border-y-transparent border-l-white/40" />
                  </div>
                </div>
                Ожидаем запуск следующего раунда
              </div>
            </div>
          </article>
        )}
      </section>

      <section className="space-y-5">
        <div className="flex items-center justify-between">
          <h3 className="section-title">События</h3>
          <span className="inline-flex items-center gap-1.5 text-sm text-white/45">
            <span>{visibleEvents.length}</span>
            <span>доступно</span>
          </span>
        </div>

        <div className="space-y-5">
          {visibleEvents.length ? (
            visibleEvents.map((event) => {
              const myApplication = event.applications.find(
                (application) =>
                  application.userId === currentUser?.id &&
                  application.status !== ApplicationStatus.REJECTED,
              );

              return (
                <article key={event.id} className="panel p-6">
                  <div className="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
                    <div className="space-y-4">
                      <div className="flex flex-wrap items-center gap-3">
                        <StatusPill status={event.status} />
                        <span className="text-xs uppercase tracking-[0.28em] text-white/35">
                          Старт: {formatDate(event.startsAt)}
                        </span>
                      </div>

                      <div>
                        <h4 className="font-heading text-3xl font-bold uppercase tracking-[0.06em] text-white">
                          {event.title}
                        </h4>
                        {event.location ? (
                          <p className="mt-3 text-sm uppercase tracking-[0.24em] text-white/36">
                            {event.location}
                          </p>
                        ) : null}
                        <p className="mt-4 max-w-3xl text-white/58">
                          {event.description}
                        </p>
                      </div>
                    </div>

                    <div className="w-full max-w-sm rounded-[24px] border border-white/8 bg-white/[0.03] p-5">
                      {myApplication ? (
                        <div className="space-y-4">
                          <div className="flex items-center gap-3">
                            <StatusPill status={ApplicationStatus.APPROVED} />
                            <span className="text-sm text-white/55">
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
                          <p className="text-sm text-white/58">
                            Откройте событие, чтобы зарегистрироваться и
                            посмотреть турнирную сетку.
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
            <div className="panel p-6 text-white/55">
              Пока нет активных событий.
            </div>
          )}
        </div>
      </section>
    </div>
  );
}

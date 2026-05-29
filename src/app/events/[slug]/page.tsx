import { ApplicationStatus, EventStatus, UserRole } from "@prisma/client";
import Link from "next/link";
import { notFound } from "next/navigation";

import { EventBracket } from "@/components/event-bracket";
import { ApplyForm } from "@/components/forms/apply-form";
import { StatusPill } from "@/components/status-pill";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { formatDate } from "@/lib/utils";

type EventPageProps = {
  params: Promise<{
    slug: string;
  }>;
};

export default async function EventPage({ params }: EventPageProps) {
  const { slug } = await params;
  const decodedSlug = decodeURIComponent(slug);
  const [currentUser, event] = await Promise.all([
    getCurrentUser(),
    prisma.event.findUnique({
      where: { slug: decodedSlug },
      include: {
        applications: {
          orderBy: { createdAt: "desc" },
          include: {
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

  if (!event || event.status === EventStatus.DRAFT) {
    notFound();
  }

  const participants = event.applications
    .filter((application) => application.status !== ApplicationStatus.REJECTED)
    .map((application) => ({
      id: application.user.id,
      nickname: application.user.nickname,
      discordNickname: application.discordNickname,
    }));
  const currentApplication = event.applications.find(
    (application) =>
      application.userId === currentUser?.id &&
      application.status !== ApplicationStatus.REJECTED,
  );
  const isRegistrationOpen = event.status === EventStatus.PUBLISHED;
  const isEventCompleted = event.status === EventStatus.COMPLETED;

  return (
    <div className="space-y-5">
      <section className="panel p-7 md:p-8">
        <div className="flex flex-col gap-5 xl:flex-row xl:items-start xl:justify-between">
          <div className="space-y-4">
            <Link
              href="/"
              className="inline-flex items-center gap-2 text-sm text-white/42 transition-colors hover:text-white/70"
            >
              <span>←</span>
              <span>Назад к событиям</span>
            </Link>

            <div className="flex flex-wrap items-center gap-3">
              <StatusPill status={event.status} />
              <span className="text-xs uppercase tracking-[0.28em] text-white/32">
                Старт: {formatDate(event.startsAt)}
              </span>
              {event.location ? (
                <span className="text-xs uppercase tracking-[0.28em] text-white/32">
                  {event.location}
                </span>
              ) : null}
              {event.maxParticipants ? (
                <span className="text-xs uppercase tracking-[0.28em] text-white/32">
                  {participants.length}/{event.maxParticipants}
                </span>
              ) : null}
            </div>

            <div>
              <h1 className="font-heading text-4xl font-bold uppercase tracking-[0.08em] text-white md:text-5xl">
                {event.title}
              </h1>
              <p className="mt-4 max-w-4xl text-base leading-7 text-white/60">
                {event.description}
              </p>
            </div>
          </div>

          <div className="w-full max-w-sm rounded-[24px] border border-white/8 bg-white/[0.03] p-5">
            {currentApplication ? (
              <div className="space-y-4">
                <div className="flex items-center gap-3">
                  <StatusPill status={ApplicationStatus.APPROVED} />
                  <span className="text-sm text-white/58">
                    Вы уже в списке участников
                  </span>
                </div>
                <p className="text-sm text-white/55">
                  Discord: {currentApplication.discordNickname}
                </p>
                <p className="text-sm text-white/55">
                  {currentApplication.note || "Комментарий не добавлен."}
                </p>
              </div>
            ) : isRegistrationOpen ? (
              currentUser ? (
                <ApplyForm eventId={event.id} />
              ) : (
                <div className="space-y-4">
                  <p className="text-sm text-white/60">
                    Войдите или зарегистрируйтесь, чтобы попасть в список
                    участников.
                  </p>
                  <div className="flex gap-3">
                    <Link
                      href="/register"
                      className="primary-button flex-1 text-center"
                    >
                      Регистрация
                    </Link>
                    <Link
                      href="/login"
                      className="ghost-button flex-1 text-center"
                    >
                      Вход
                    </Link>
                  </div>
                </div>
              )
            ) : (
              <div className="space-y-3">
                <div
                  className={
                    isEventCompleted
                      ? "rounded-[18px] border border-[#7d2631]/28 bg-[#7d2631]/16 p-4 text-sm text-[#ffccd5]"
                      : "rounded-[18px] border border-[#b9852f]/28 bg-[#b9852f]/14 p-4 text-sm text-[#f8ddb0]"
                  }
                >
                  {isEventCompleted
                    ? "Событие завершено. Регистрация больше не доступна."
                    : "Регистрация завершена. Новые участники больше не принимаются."}
                </div>
                {currentUser?.role === UserRole.ADMIN ? (
                  <Link
                    href={`/acp/events/${event.slug}`}
                    className="ghost-button flex w-full items-center justify-center"
                  >
                    Открыть админ-вкладку
                  </Link>
                ) : null}
              </div>
            )}
          </div>
        </div>
      </section>

      <EventBracket participants={participants} rawState={event.bracketState} />
    </div>
  );
}

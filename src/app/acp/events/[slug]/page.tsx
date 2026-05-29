import { ApplicationStatus, EventStatus } from "@prisma/client";
import Link from "next/link";
import { notFound } from "next/navigation";

import {
  closeRegistrationAction,
  completeEventAction,
  deleteEventAction,
  reopenRegistrationAction,
} from "@/actions/events";
import { EventBracket } from "@/components/event-bracket";
import { StatusPill } from "@/components/status-pill";
import { requireAdmin } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { formatDate } from "@/lib/utils";

type AcpEventPageProps = {
  params: Promise<{
    slug: string;
  }>;
};

export default async function AcpEventPage({ params }: AcpEventPageProps) {
  await requireAdmin();

  const { slug } = await params;
  const decodedSlug = decodeURIComponent(slug);
  const event = await prisma.event.findUnique({
    where: { slug: decodedSlug },
    include: {
      applications: {
        include: {
          user: {
            select: {
              id: true,
              nickname: true,
              email: true,
            },
          },
        },
      },
    },
  });

  if (!event) {
    notFound();
  }

  const participants = event.applications
    .filter((application) => application.status !== ApplicationStatus.REJECTED)
    .sort((left, right) => Number(right.createdAt) - Number(left.createdAt))
    .map((application) => ({
      id: application.user.id,
      nickname: application.user.nickname,
      discordNickname: application.discordNickname,
    }));

  const isRegistrationOpen = event.status === EventStatus.PUBLISHED;
  const isEventCompleted = event.status === EventStatus.COMPLETED;

  return (
    <div className="space-y-5">
      <section className="panel p-7 md:p-8">
        <div className="flex flex-col gap-5 xl:flex-row xl:items-start xl:justify-between">
          <div className="space-y-4">
            <Link
              href="/acp"
              className="inline-flex items-center gap-2 text-sm text-white/42 transition-colors hover:text-white/70"
            >
              <span>←</span>
              <span>Назад к списку событий</span>
            </Link>

            <div className="flex flex-wrap items-center gap-3">
              <StatusPill status={event.status} />
              <span className="text-xs uppercase tracking-[0.28em] text-white/32">
                Старт: {formatDate(event.startsAt)}
              </span>
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
              {event.location ? (
                <p className="mt-3 text-sm uppercase tracking-[0.24em] text-white/36">
                  {event.location}
                </p>
              ) : null}
              <p className="mt-4 max-w-4xl text-base leading-7 text-white/60">
                {event.description}
              </p>
            </div>
          </div>

          <div className="flex w-full flex-col gap-3 xl:w-auto">
            {isRegistrationOpen ? (
              <form action={closeRegistrationAction}>
                <input type="hidden" name="eventId" value={event.id} />
                <button
                  type="submit"
                  className="w-full rounded-[16px] border border-[#b9852f]/28 bg-[#2a1f10] px-4 py-3 text-sm font-semibold text-[#f8ddb0] transition-colors hover:border-[#b9852f]/55 hover:text-white xl:w-auto"
                >
                  Завершить регистрацию
                </button>
              </form>
            ) : null}

            {event.status === EventStatus.CLOSED ? (
              <form action={reopenRegistrationAction}>
                <input type="hidden" name="eventId" value={event.id} />
                <button type="submit" className="ghost-button w-full xl:w-auto">
                  Открыть регистрацию
                </button>
              </form>
            ) : null}

            {!isEventCompleted ? (
              <form action={completeEventAction}>
                <input type="hidden" name="eventId" value={event.id} />
                <button type="submit" className="primary-button w-full xl:w-auto">
                  Завершить событие
                </button>
              </form>
            ) : null}

            <form action={deleteEventAction}>
              <input type="hidden" name="eventId" value={event.id} />
              <button
                type="submit"
                className="w-full rounded-[16px] border border-[#ff6b8b]/28 bg-[#241119] px-4 py-3 text-sm font-semibold text-[#ff9db1] transition-colors hover:border-[#ff6b8b]/55 hover:text-white xl:w-auto"
              >
                Удалить событие
              </button>
            </form>
          </div>
        </div>
      </section>

      <EventBracket
        participants={participants}
        rawState={event.bracketState}
        editable={!isEventCompleted}
        eventId={event.id}
        showDiscordNicknames
      />
    </div>
  );
}

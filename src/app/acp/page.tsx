import Link from "next/link";

import {
  closeRegistrationAction,
  completeEventAction,
  deleteEventAction,
  reopenRegistrationAction,
} from "@/actions/events";
import { EventForm } from "@/components/forms/event-form";
import { StatusPill } from "@/components/status-pill";
import { requireAdmin } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { formatDate } from "@/lib/utils";

export default async function AcpPage() {
  await requireAdmin();

  const events = await prisma.event.findMany({
    orderBy: { createdAt: "desc" },
    include: {
      applications: {
        select: {
          id: true,
          status: true,
        },
      },
    },
  });

  return (
    <div className="space-y-5">
      <section className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_430px]">
        <div className="panel p-7 md:p-8">
          <p className="text-xs uppercase tracking-[0.34em] text-[#8891dd]">
            Admin console
          </p>
          <h2 className="mt-4 font-heading text-4xl font-bold uppercase tracking-[0.08em] text-white md:text-5xl">
            Управление событиями
          </h2>
          <p className="mt-4 max-w-3xl text-white/60">
            Внутри каждого события отдельная вкладка: сетка, участники и
            управление турниром находятся прямо там.
          </p>
        </div>

        <div className="panel p-7">
          <h3 className="font-heading text-2xl font-bold uppercase tracking-[0.08em] text-white">
            Создать событие
          </h3>
          <div className="mt-6">
            <EventForm />
          </div>
        </div>
      </section>

      <section className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="section-title">Список событий</h3>
          <span className="inline-flex items-center gap-1.5 text-sm text-white/45">
            <span>{events.length}</span>
            <span>всего</span>
          </span>
        </div>

        <div className="grid gap-4">
          {events.length ? (
            events.map((event) => {
              const participantCount = event.applications.filter(
                (application) => application.status !== "REJECTED",
              ).length;
              const isRegistrationOpen = event.status === "PUBLISHED";
              const isEventCompleted = event.status === "COMPLETED";

              return (
                <article key={event.id} className="panel p-6">
                  <div className="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
                    <div className="space-y-4">
                      <div className="flex flex-wrap items-center gap-3">
                        <StatusPill status={event.status} />
                        <span className="text-xs uppercase tracking-[0.28em] text-white/32">
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

                    <div className="w-full max-w-sm space-y-4 rounded-[24px] border border-white/8 bg-white/[0.03] p-5">
                      <div className="grid grid-cols-2 gap-3 text-sm text-white/62">
                        <div className="rounded-[18px] border border-white/8 bg-black/20 p-4">
                          <p className="text-xs uppercase tracking-[0.22em] text-white/28">
                            Участников
                          </p>
                          <p className="mt-3 text-2xl font-semibold text-white">
                            {participantCount}
                          </p>
                        </div>
                        <div className="rounded-[18px] border border-white/8 bg-black/20 p-4">
                          <p className="text-xs uppercase tracking-[0.22em] text-white/28">
                            Слотов
                          </p>
                          <p className="mt-3 text-2xl font-semibold text-white">
                            {participantCount <= 1
                              ? 2
                              : 2 ** Math.ceil(Math.log2(participantCount))}
                          </p>
                        </div>
                      </div>

                      {isRegistrationOpen ? (
                        <form action={closeRegistrationAction}>
                          <input type="hidden" name="eventId" value={event.id} />
                          <button
                            type="submit"
                            className="w-full rounded-[16px] border border-[#b9852f]/28 bg-[#2a1f10] px-4 py-3 text-sm font-semibold text-[#f8ddb0] transition-colors hover:border-[#b9852f]/55 hover:text-white"
                          >
                            Завершить регистрацию
                          </button>
                        </form>
                      ) : null}

                      {event.status === "CLOSED" ? (
                        <form action={reopenRegistrationAction}>
                          <input type="hidden" name="eventId" value={event.id} />
                          <button type="submit" className="ghost-button w-full">
                            Открыть регистрацию
                          </button>
                        </form>
                      ) : null}

                      {!isEventCompleted ? (
                        <form action={completeEventAction}>
                          <input type="hidden" name="eventId" value={event.id} />
                          <button type="submit" className="ghost-button w-full">
                            Завершить событие
                          </button>
                        </form>
                      ) : null}

                      <form action={deleteEventAction}>
                        <input type="hidden" name="eventId" value={event.id} />
                        <button
                          type="submit"
                          className="w-full rounded-[16px] border border-[#ff6b8b]/28 bg-[#241119] px-4 py-3 text-sm font-semibold text-[#ff9db1] transition-colors hover:border-[#ff6b8b]/55 hover:text-white"
                        >
                          Удалить событие
                        </button>
                      </form>

                      <Link
                        href={`/acp/events/${event.slug}`}
                        className="primary-button flex w-full items-center justify-center"
                      >
                        Открыть событие
                      </Link>
                    </div>
                  </div>
                </article>
              );
            })
          ) : (
            <div className="panel p-6 text-white/55">
              Пока нет событий. Создайте первое событие через форму справа.
            </div>
          )}
        </div>
      </section>
    </div>
  );
}

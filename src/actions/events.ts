"use server";

import { ApplicationStatus, EventStatus } from "@prisma/client";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { requireAdmin, requireUser } from "@/lib/auth";
import { buildBracket, stringifyBracketState } from "@/lib/bracket";
import { prisma } from "@/lib/prisma";
import {
  applicationSchema,
  eventSchema,
  type FormState,
} from "@/lib/validators";
import { slugify } from "@/lib/utils";

function getNotificationDelegate() {
  return (prisma as { notification?: typeof prisma.notification }).notification;
}

function revalidateEventPages(slug: string) {
  revalidatePath("/");
  revalidatePath("/acp");
  revalidatePath("/dashboard");
  revalidatePath(`/events/${slug}`);
  revalidatePath(`/acp/events/${slug}`);
}

function clearLiveMatchFromState(rawState: string | null | undefined) {
  if (!rawState?.trim()) {
    return stringifyBracketState({
      seeds: [],
      winners: {},
      liveMatchId: null,
    });
  }

  try {
    const parsed = JSON.parse(rawState) as unknown;

    if (Array.isArray(parsed)) {
      return stringifyBracketState({
        seeds: parsed.filter((value): value is string => typeof value === "string"),
        winners: {},
        liveMatchId: null,
      });
    }

    if (parsed && typeof parsed === "object") {
      return JSON.stringify({
        ...parsed,
        liveMatchId: null,
      });
    }
  } catch {
    return stringifyBracketState({
      seeds: [],
      winners: {},
      liveMatchId: null,
    });
  }

  return stringifyBracketState({
    seeds: [],
    winners: {},
    liveMatchId: null,
  });
}

export async function createEventAction(
  _prevState: FormState,
  formData: FormData,
): Promise<FormState> {
  await requireAdmin();

  const payload = {
    title: String(formData.get("title") ?? ""),
    description: String(formData.get("description") ?? ""),
    location: String(formData.get("location") ?? ""),
    startsAt: String(formData.get("startsAt") ?? ""),
  };

  const parsed = eventSchema.safeParse(payload);

  if (!parsed.success) {
    return {
      status: "error",
      message: "Исправьте поля формы события.",
      fieldErrors: parsed.error.flatten().fieldErrors,
      values: payload,
    };
  }

  const baseSlug = slugify(parsed.data.title);
  let slug = baseSlug;
  let suffix = 1;

  while (await prisma.event.findUnique({ where: { slug } })) {
    suffix += 1;
    slug = `${baseSlug}-${suffix}`;
  }

  const startsAt = new Date(`${parsed.data.startsAt}T00:00:00`);
  const summary = parsed.data.description.trim().slice(0, 180);

  await prisma.event.create({
    data: {
      title: parsed.data.title,
      slug,
      summary,
      description: parsed.data.description,
      location: parsed.data.location || null,
      maxParticipants: null,
      startsAt,
      endsAt: startsAt,
      status: EventStatus.PUBLISHED,
      bracketState: stringifyBracketState({
        seeds: [],
        winners: {},
        liveMatchId: null,
      }),
    },
  });

  revalidatePath("/");
  revalidatePath("/acp");

  return {
    status: "success",
    message: "Событие создано и открыто для регистрации.",
  };
}

export async function closeRegistrationAction(formData: FormData) {
  await requireAdmin();

  const eventId = String(formData.get("eventId") ?? "");

  if (!eventId) {
    return;
  }

  const event = await prisma.event.update({
    where: { id: eventId },
    data: {
      status: EventStatus.CLOSED,
    },
    select: {
      slug: true,
    },
  });

  revalidateEventPages(event.slug);
}

export async function completeEventAction(formData: FormData) {
  await requireAdmin();

  const eventId = String(formData.get("eventId") ?? "");

  if (!eventId) {
    return;
  }

  const currentEvent = await prisma.event.findUnique({
    where: { id: eventId },
    select: {
      slug: true,
      bracketState: true,
    },
  });

  if (!currentEvent) {
    return;
  }

  const event = await prisma.event.update({
    where: { id: eventId },
    data: {
      status: EventStatus.COMPLETED,
      bracketState: clearLiveMatchFromState(currentEvent.bracketState),
    },
    select: {
      slug: true,
    },
  });

  revalidateEventPages(event.slug);
}

export async function reopenRegistrationAction(formData: FormData) {
  await requireAdmin();

  const eventId = String(formData.get("eventId") ?? "");

  if (!eventId) {
    return;
  }

  const event = await prisma.event.update({
    where: { id: eventId },
    data: {
      status: EventStatus.PUBLISHED,
    },
    select: {
      slug: true,
    },
  });

  revalidateEventPages(event.slug);
}

export async function deleteEventAction(formData: FormData) {
  await requireAdmin();

  const eventId = String(formData.get("eventId") ?? "");

  if (!eventId) {
    return;
  }

  const event = await prisma.event.findUnique({
    where: { id: eventId },
    select: {
      slug: true,
    },
  });

  if (!event) {
    redirect("/acp");
  }

  await prisma.event.delete({
    where: { id: eventId },
  });

  revalidateEventPages(event.slug);
  redirect("/acp");
}

export async function recordMatchWinnerAction(formData: FormData) {
  await requireAdmin();

  const eventId = String(formData.get("eventId") ?? "");
  const matchId = String(formData.get("matchId") ?? "");
  const winnerId = String(formData.get("winnerId") ?? "");

  if (!eventId || !matchId) {
    return;
  }

  const event = await prisma.event.findUnique({
    where: { id: eventId },
    select: {
      id: true,
      title: true,
      slug: true,
      status: true,
      bracketState: true,
      applications: {
        where: {
          status: {
            not: ApplicationStatus.REJECTED,
          },
        },
        orderBy: {
          createdAt: "desc",
        },
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
  });

  if (!event) {
    return;
  }

  if (event.status === EventStatus.COMPLETED) {
    return;
  }

  const participants = event.applications.map((application) => ({
    id: application.user.id,
    nickname: application.user.nickname,
    discordNickname: application.discordNickname,
  }));
  const bracket = buildBracket(participants, event.bracketState);
  const targetMatch = bracket.activeMatches.find((match) => match.id === matchId);

  if (!targetMatch) {
    return;
  }

  const nextWinners = {
    ...bracket.state.winners,
  };

  if (
    !winnerId ||
    !targetMatch.participants.some((participant) => participant?.id === winnerId)
  ) {
    delete nextWinners[matchId];
  } else {
    nextWinners[matchId] = winnerId;
  }

  const normalizedBracket = buildBracket(
    participants,
    stringifyBracketState({
      seeds: bracket.state.seeds,
      winners: nextWinners,
      liveMatchId: bracket.state.liveMatchId,
    }),
  );

  await prisma.event.update({
    where: { id: event.id },
    data: {
      bracketState: stringifyBracketState(normalizedBracket.state),
    },
  });

  revalidateEventPages(event.slug);
}

export async function toggleLiveMatchAction(formData: FormData) {
  await requireAdmin();

  const eventId = String(formData.get("eventId") ?? "");
  const matchId = String(formData.get("matchId") ?? "");

  if (!eventId || !matchId) {
    return;
  }

  const event = await prisma.event.findUnique({
    where: { id: eventId },
    select: {
      id: true,
      title: true,
      slug: true,
      status: true,
      bracketState: true,
      applications: {
        where: {
          status: {
            not: ApplicationStatus.REJECTED,
          },
        },
        orderBy: {
          createdAt: "desc",
        },
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
  });

  if (!event || event.status === EventStatus.COMPLETED) {
    return;
  }

  const participants = event.applications.map((application) => ({
    id: application.user.id,
    nickname: application.user.nickname,
    discordNickname: application.discordNickname,
  }));
  const bracket = buildBracket(participants, event.bracketState);
  const targetMatch = bracket.activeMatches.find((match) => match.id === matchId);

  if (!targetMatch) {
    return;
  }

  const normalizedBracket = buildBracket(
    participants,
    stringifyBracketState({
      seeds: bracket.state.seeds,
      winners: bracket.state.winners,
      liveMatchId: bracket.state.liveMatchId === matchId ? null : matchId,
    }),
  );

  await prisma.event.update({
    where: { id: event.id },
    data: {
      bracketState: stringifyBracketState(normalizedBracket.state),
    },
  });

  const notificationDelegate = getNotificationDelegate();

  if (normalizedBracket.state.liveMatchId && notificationDelegate) {
    const [firstParticipant, secondParticipant] = targetMatch.participants;

    if (firstParticipant && secondParticipant) {
      await notificationDelegate.createMany({
        data: [
          {
            userId: firstParticipant.id,
            title: "Ваш раунд начался",
            message: `Сейчас идет матч против ${secondParticipant.nickname} на событии ${event.title}. Раунд: ${targetMatch.label}.`,
            href: `/events/${event.slug}`,
          },
          {
            userId: secondParticipant.id,
            title: "Ваш раунд начался",
            message: `Сейчас идет матч против ${firstParticipant.nickname} на событии ${event.title}. Раунд: ${targetMatch.label}.`,
            href: `/events/${event.slug}`,
          },
        ],
      });
    }
  }

  revalidateEventPages(event.slug);
}

export async function applyToEventAction(
  _prevState: FormState,
  formData: FormData,
): Promise<FormState> {
  const user = await requireUser();

  if (!user.isVerified) {
    return {
      status: "error",
      message: "Подтвердите аккаунт перед регистрацией в событие.",
    };
  }

  const payload = {
    eventId: String(formData.get("eventId") ?? ""),
    discordNickname: String(formData.get("discordNickname") ?? ""),
    note: String(formData.get("note") ?? ""),
  };

  const parsed = applicationSchema.safeParse(payload);

  if (!parsed.success) {
    return {
      status: "error",
      message: "Не удалось зарегистрироваться в событие.",
      fieldErrors: parsed.error.flatten().fieldErrors,
      values: payload,
    };
  }

  const event = await prisma.event.findUnique({
    where: { id: parsed.data.eventId },
    include: {
      applications: {
        where: {
          status: {
            not: ApplicationStatus.REJECTED,
          },
        },
      },
    },
  });

  if (!event || event.status !== EventStatus.PUBLISHED) {
    return {
      status: "error",
      message: "Регистрация на это событие уже закрыта.",
      values: payload,
    };
  }

  if (
    event.maxParticipants &&
    event.applications.length >= event.maxParticipants
  ) {
    return {
      status: "error",
      message: "Свободных мест в событии больше нет.",
      values: payload,
    };
  }

  const existingApplication = await prisma.eventApplication.findUnique({
    where: {
      eventId_userId: {
        eventId: event.id,
        userId: user.id,
      },
    },
  });

  if (existingApplication && existingApplication.status !== ApplicationStatus.REJECTED) {
    return {
      status: "error",
      message: "Вы уже зарегистрированы в этом событии.",
      values: payload,
    };
  }

  try {
    if (existingApplication) {
      await prisma.eventApplication.update({
        where: { id: existingApplication.id },
        data: {
          status: ApplicationStatus.APPROVED,
          discordNickname: parsed.data.discordNickname,
          note: parsed.data.note || null,
        },
      });
    } else {
      await prisma.eventApplication.create({
        data: {
          eventId: event.id,
          userId: user.id,
          status: ApplicationStatus.APPROVED,
          discordNickname: parsed.data.discordNickname,
          note: parsed.data.note || null,
        },
      });
    }
  } catch (error) {
    console.error("Failed to register participant", error);

    return {
      status: "error",
      message:
        "Не удалось зарегистрироваться. Если Prisma только что обновлялась, перезапустите сервер и попробуйте снова.",
      values: payload,
    };
  }

  const participants = (
    await prisma.eventApplication.findMany({
      where: {
        eventId: event.id,
        status: {
          not: ApplicationStatus.REJECTED,
        },
      },
      orderBy: {
        createdAt: "desc",
      },
      include: {
        user: {
          select: {
            id: true,
            nickname: true,
          },
        },
      },
    })
  ).map((application) => ({
    id: application.user.id,
    nickname: application.user.nickname,
    discordNickname: application.discordNickname,
  }));

  const normalizedBracket = buildBracket(participants, event.bracketState);

  await prisma.event.update({
    where: { id: event.id },
    data: {
      bracketState: stringifyBracketState(normalizedBracket.state),
    },
  });

  revalidateEventPages(event.slug);

  return {
    status: "success",
    message: "Вы добавлены в список участников.",
    values: {
      eventId: parsed.data.eventId,
      discordNickname: parsed.data.discordNickname,
      note: parsed.data.note ?? "",
    },
  };
}

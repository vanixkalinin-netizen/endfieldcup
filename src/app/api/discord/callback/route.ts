import { cookies } from "next/headers";
import { NextResponse } from "next/server";

import { createSession, getCurrentUser } from "@/lib/auth";
import {
  buildDiscordInternalEmail,
  DISCORD_OAUTH_COOKIE,
  exchangeDiscordCode,
  fetchDiscordGuildMember,
  fetchDiscordUser,
  getDiscordAppOrigin,
  getPreferredDiscordNickname,
  isDiscordAuthConfigured,
  sanitizeDiscordNextPath,
} from "@/lib/discord";
import { prisma } from "@/lib/prisma";

function buildRedirectUrl(request: Request, nextPath: string, status: string) {
  const baseOrigin = getDiscordAppOrigin();
  const url = baseOrigin
    ? new URL(nextPath, `${baseOrigin}/`)
    : new URL(nextPath, request.url);
  url.searchParams.set("discord", status);
  return url;
}

async function createUniqueNickname(baseNickname: string) {
  let candidate = baseNickname;
  let suffix = 2;

  while (
    await prisma.user.findUnique({
      where: { nickname: candidate },
      select: { id: true },
    })
  ) {
    const suffixLabel = `-${suffix}`;
    const trimmedBase = baseNickname
      .slice(0, Math.max(3, 24 - suffixLabel.length))
      .trim();
    candidate = `${trimmedBase}${suffixLabel}`;
    suffix += 1;
  }

  return candidate;
}

export async function GET(request: Request) {
  const requestUrl = new URL(request.url);
  const cookieStore = await cookies();
  const rawStateCookie = cookieStore.get(DISCORD_OAUTH_COOKIE)?.value;
  cookieStore.delete(DISCORD_OAUTH_COOKIE);

  const fallbackPath = sanitizeDiscordNextPath(
    requestUrl.searchParams.get("next"),
    "/login",
  );

  let storedState: {
    state?: string;
    nextPath?: string;
    mode?: "login" | "link";
    userId?: string | null;
  } | null = null;

  if (rawStateCookie) {
    try {
      storedState = JSON.parse(rawStateCookie) as {
        state?: string;
        nextPath?: string;
        mode?: "login" | "link";
        userId?: string | null;
      };
    } catch {
      storedState = null;
    }
  }

  const nextPath = sanitizeDiscordNextPath(storedState?.nextPath, fallbackPath);
  const mode = storedState?.mode === "link" ? "link" : "login";
  const currentUser = await getCurrentUser();

  if (!isDiscordAuthConfigured()) {
    return NextResponse.redirect(
      buildRedirectUrl(request, mode === "link" ? nextPath : "/login", "config"),
    );
  }

  const state = requestUrl.searchParams.get("state");
  const code = requestUrl.searchParams.get("code");
  const error = requestUrl.searchParams.get("error");

  if (
    error ||
    !code ||
    !state ||
    !storedState?.state ||
    storedState.state !== state
  ) {
    return NextResponse.redirect(
      buildRedirectUrl(request, mode === "link" ? nextPath : "/login", "denied"),
    );
  }

  try {
    const token = await exchangeDiscordCode(code);
    const discordUser = await fetchDiscordUser(token.access_token);
    const guildMember = await fetchDiscordGuildMember(token.access_token);
    const now = new Date();
    const isPending = Boolean(guildMember?.pending);
    const discordData = {
      discordId: discordUser.id,
      discordUsername: discordUser.username,
      discordGlobalName: discordUser.global_name ?? null,
      discordGuildNick: guildMember?.nick ?? null,
      discordLinkedAt: now,
      discordMemberAt: guildMember && !isPending ? now : null,
      discordPending: isPending,
    };

    const existingDiscordUser = await prisma.user.findUnique({
      where: {
        discordId: discordUser.id,
      },
      select: {
        id: true,
        email: true,
        nickname: true,
        role: true,
      },
    });

    if (mode === "link" && (!currentUser || currentUser.id !== storedState?.userId)) {
      return NextResponse.redirect(buildRedirectUrl(request, "/login", "denied"));
    }

    if (
      mode === "link" &&
      existingDiscordUser &&
      existingDiscordUser.id !== currentUser?.id
    ) {
      return NextResponse.redirect(buildRedirectUrl(request, nextPath, "used"));
    }

    const authUser =
      mode === "link" && currentUser
        ? await prisma.user.update({
            where: { id: currentUser.id },
            data: discordData,
            select: {
              id: true,
              email: true,
              nickname: true,
              role: true,
            },
          })
        : existingDiscordUser
          ? await prisma.user.update({
              where: { id: existingDiscordUser.id },
              data: discordData,
              select: {
                id: true,
                email: true,
                nickname: true,
                role: true,
              },
            })
          : await prisma.user.create({
              data: {
                nickname: await createUniqueNickname(
                  getPreferredDiscordNickname({
                    guildNick: guildMember?.nick,
                    globalName: discordUser.global_name,
                    username: discordUser.username,
                    fallbackId: discordUser.id,
                  }),
                ),
                email: buildDiscordInternalEmail(discordUser.id),
                passwordHash: null,
                ...discordData,
              },
              select: {
                id: true,
                email: true,
                nickname: true,
                role: true,
              },
            });

    await createSession(authUser);

    return NextResponse.redirect(
      buildRedirectUrl(
        request,
        nextPath,
        !guildMember ? "join-server" : isPending ? "pending" : "linked",
      ),
    );
  } catch (error) {
    console.error("[discord callback] failed", error);
    return NextResponse.redirect(
      buildRedirectUrl(request, mode === "link" ? nextPath : "/login", "error"),
    );
  }
}

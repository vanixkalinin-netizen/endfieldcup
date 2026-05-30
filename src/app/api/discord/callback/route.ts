import { cookies } from "next/headers";
import { NextResponse } from "next/server";

import { getCurrentUser } from "@/lib/auth";
import {
  DISCORD_OAUTH_COOKIE,
  exchangeDiscordCode,
  fetchDiscordGuildMember,
  fetchDiscordUser,
  isDiscordAuthConfigured,
  sanitizeDiscordNextPath,
} from "@/lib/discord";
import { prisma } from "@/lib/prisma";

function buildRedirectUrl(request: Request, nextPath: string, status: string) {
  const url = new URL(nextPath, request.url);
  url.searchParams.set("discord", status);
  return url;
}

export async function GET(request: Request) {
  const user = await getCurrentUser();

  if (!user) {
    return NextResponse.redirect(new URL("/login", request.url));
  }

  const requestUrl = new URL(request.url);
  const cookieStore = await cookies();
  const rawStateCookie = cookieStore.get(DISCORD_OAUTH_COOKIE)?.value;
  cookieStore.delete(DISCORD_OAUTH_COOKIE);

  const fallbackPath = sanitizeDiscordNextPath(
    requestUrl.searchParams.get("next"),
    "/profile",
  );

  let storedState: { state?: string; nextPath?: string } | null = null;

  if (rawStateCookie) {
    try {
      storedState = JSON.parse(rawStateCookie) as {
        state?: string;
        nextPath?: string;
      };
    } catch {
      storedState = null;
    }
  }

  const nextPath = sanitizeDiscordNextPath(
    storedState?.nextPath,
    fallbackPath,
  );

  if (!isDiscordAuthConfigured()) {
    return NextResponse.redirect(buildRedirectUrl(request, nextPath, "config"));
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
    return NextResponse.redirect(buildRedirectUrl(request, nextPath, "denied"));
  }

  try {
    const token = await exchangeDiscordCode(code);
    const discordUser = await fetchDiscordUser(token.access_token);

    const existingDiscordUser = await prisma.user.findUnique({
      where: {
        discordId: discordUser.id,
      },
      select: {
        id: true,
      },
    });

    if (existingDiscordUser && existingDiscordUser.id !== user.id) {
      return NextResponse.redirect(buildRedirectUrl(request, nextPath, "used"));
    }

    const guildMember = await fetchDiscordGuildMember(token.access_token);

    if (!guildMember) {
      await prisma.user.update({
        where: {
          id: user.id,
        },
        data: {
          discordId: discordUser.id,
          discordUsername: discordUser.username,
          discordGlobalName: discordUser.global_name ?? null,
          discordGuildNick: null,
          discordLinkedAt: new Date(),
          discordMemberAt: null,
          discordPending: false,
        },
      });

      return NextResponse.redirect(
        buildRedirectUrl(request, nextPath, "join-server"),
      );
    }

    const now = new Date();
    const isPending = Boolean(guildMember.pending);

    await prisma.user.update({
      where: {
        id: user.id,
      },
      data: {
        discordId: discordUser.id,
        discordUsername: discordUser.username,
        discordGlobalName: discordUser.global_name ?? null,
        discordGuildNick: guildMember.nick ?? null,
        discordLinkedAt: now,
        discordMemberAt: isPending ? null : now,
        discordPending: isPending,
      },
    });

    return NextResponse.redirect(
      buildRedirectUrl(request, nextPath, isPending ? "pending" : "linked"),
    );
  } catch (error) {
    console.error("[discord callback] failed", error);
    return NextResponse.redirect(buildRedirectUrl(request, nextPath, "error"));
  }
}

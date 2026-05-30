import { cookies } from "next/headers";
import { NextResponse } from "next/server";

import { getCurrentUser } from "@/lib/auth";
import {
  buildDiscordAuthorizationUrl,
  DISCORD_OAUTH_COOKIE,
  getDiscordAppOrigin,
  isDiscordAuthConfigured,
  isSecureCookieEnabled,
  sanitizeDiscordNextPath,
} from "@/lib/discord";

export async function GET(request: Request) {
  const user = await getCurrentUser();
  const requestUrl = new URL(request.url);
  const nextPath = sanitizeDiscordNextPath(
    requestUrl.searchParams.get("next"),
    user ? "/profile" : "/login",
  );
  const baseOrigin = getDiscordAppOrigin();

  if (!isDiscordAuthConfigured()) {
    const errorUrl = baseOrigin
      ? new URL(user ? nextPath : "/login", `${baseOrigin}/`)
      : new URL(user ? nextPath : "/login", request.url);
    errorUrl.searchParams.set("discord", "config");
    return NextResponse.redirect(errorUrl);
  }

  const state = crypto.randomUUID();
  const cookieStore = await cookies();

  cookieStore.set(
    DISCORD_OAUTH_COOKIE,
    JSON.stringify({
      state,
      nextPath,
      mode: user ? "link" : "login",
      userId: user?.id ?? null,
    }),
    {
      httpOnly: true,
      sameSite: "lax",
      secure: isSecureCookieEnabled(),
      path: "/",
      maxAge: 60 * 10,
    },
  );

  return NextResponse.redirect(buildDiscordAuthorizationUrl(state));
}

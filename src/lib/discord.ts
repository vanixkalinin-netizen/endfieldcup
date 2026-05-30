import type { User } from "@prisma/client";

export const DISCORD_OAUTH_COOKIE = "endfield_discord_oauth";

type DiscordConfig = {
  clientId: string;
  clientSecret: string;
  redirectUri: string;
  guildId: string;
  guildName: string;
  guildInviteUrl: string | null;
};

type DiscordTokenResponse = {
  access_token: string;
  token_type: string;
  expires_in: number;
  refresh_token?: string;
  scope: string;
};

type DiscordUserResponse = {
  id: string;
  username: string;
  global_name?: string | null;
};

type DiscordGuildMemberResponse = {
  nick?: string | null;
  pending?: boolean;
};

export type DiscordFeedbackTone = "success" | "warning" | "error";

export type DiscordFeedback = {
  tone: DiscordFeedbackTone;
  message: string;
};

function readDiscordConfig(): DiscordConfig | null {
  const clientId = process.env.DISCORD_CLIENT_ID?.trim();
  const clientSecret = process.env.DISCORD_CLIENT_SECRET?.trim();
  const redirectUri = process.env.DISCORD_REDIRECT_URI?.trim();
  const guildId = process.env.DISCORD_GUILD_ID?.trim();

  if (!clientId || !clientSecret || !redirectUri || !guildId) {
    return null;
  }

  return {
    clientId,
    clientSecret,
    redirectUri,
    guildId,
    guildName: process.env.DISCORD_GUILD_NAME?.trim() || "Discord сервер",
    guildInviteUrl: process.env.DISCORD_GUILD_INVITE_URL?.trim() || null,
  };
}

export function isDiscordAuthConfigured() {
  return Boolean(readDiscordConfig());
}

export function getDiscordGuildName() {
  return readDiscordConfig()?.guildName || "Discord сервер";
}

export function getDiscordGuildInviteUrl() {
  return readDiscordConfig()?.guildInviteUrl || null;
}

export function getDiscordAppOrigin() {
  const config = readDiscordConfig();

  if (!config) {
    return null;
  }

  try {
    return new URL(config.redirectUri).origin;
  } catch {
    return null;
  }
}

export function sanitizeDiscordNextPath(
  nextPath: string | null | undefined,
  fallback: string,
) {
  if (!nextPath || !nextPath.startsWith("/") || nextPath.startsWith("//")) {
    return fallback;
  }

  return nextPath;
}

export function isSecureCookieEnabled() {
  if (process.env.AUTH_COOKIE_SECURE === "true") {
    return true;
  }

  if (process.env.AUTH_COOKIE_SECURE === "false") {
    return false;
  }

  return process.env.NODE_ENV === "production";
}

export function buildDiscordAuthorizationUrl(state: string) {
  const config = readDiscordConfig();

  if (!config) {
    throw new Error("Discord OAuth is not configured.");
  }

  const url = new URL("https://discord.com/oauth2/authorize");
  url.searchParams.set("response_type", "code");
  url.searchParams.set("client_id", config.clientId);
  url.searchParams.set("scope", "identify guilds.members.read");
  url.searchParams.set("state", state);
  url.searchParams.set("redirect_uri", config.redirectUri);

  return url.toString();
}

async function parseDiscordJson<T>(response: Response): Promise<T> {
  const json = (await response.json()) as T | { error?: string };

  if (!response.ok) {
    throw new Error(
      `Discord request failed with ${response.status}: ${JSON.stringify(json)}`,
    );
  }

  return json as T;
}

export async function exchangeDiscordCode(code: string) {
  const config = readDiscordConfig();

  if (!config) {
    throw new Error("Discord OAuth is not configured.");
  }

  const body = new URLSearchParams({
    client_id: config.clientId,
    client_secret: config.clientSecret,
    grant_type: "authorization_code",
    code,
    redirect_uri: config.redirectUri,
  });

  const response = await fetch("https://discord.com/api/v10/oauth2/token", {
    method: "POST",
    headers: {
      "content-type": "application/x-www-form-urlencoded",
    },
    body,
    cache: "no-store",
  });

  return parseDiscordJson<DiscordTokenResponse>(response);
}

export async function fetchDiscordUser(accessToken: string) {
  const response = await fetch("https://discord.com/api/v10/users/@me", {
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
    cache: "no-store",
  });

  return parseDiscordJson<DiscordUserResponse>(response);
}

export async function fetchDiscordGuildMember(accessToken: string) {
  const config = readDiscordConfig();

  if (!config) {
    throw new Error("Discord OAuth is not configured.");
  }

  const response = await fetch(
    `https://discord.com/api/v10/users/@me/guilds/${config.guildId}/member`,
    {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
      cache: "no-store",
    },
  );

  if (response.status === 404) {
    return null;
  }

  return parseDiscordJson<DiscordGuildMemberResponse>(response);
}

export function resolveDiscordApplicationNickname(
  user: Pick<
    User,
    "discordGuildNick" | "discordGlobalName" | "discordUsername" | "nickname"
  >,
) {
  return (
    user.discordGuildNick?.trim() ||
    user.discordGlobalName?.trim() ||
    user.discordUsername?.trim() ||
    user.nickname
  );
}

export function resolveDiscordIdentityLabel(
  user: Pick<User, "discordGuildNick" | "discordGlobalName" | "discordUsername">,
) {
  return (
    user.discordGuildNick?.trim() ||
    user.discordGlobalName?.trim() ||
    user.discordUsername?.trim() ||
    null
  );
}

export function getDiscordFeedback(status: string | null | undefined) {
  switch (status) {
    case "linked":
      return {
        tone: "success" as const,
        message: "Discord подтвержден. Теперь вы можете участвовать в турнирах.",
      };
    case "pending":
      return {
        tone: "warning" as const,
        message:
          "Вы уже вошли через Discord, но завершите проверку на сервере Discord перед участием.",
      };
    case "join-server":
      return {
        tone: "warning" as const,
        message:
          "Ваш Discord аккаунт найден, но он не состоит в нужном сервере. Вступите на сервер и повторите авторизацию.",
      };
    case "used":
      return {
        tone: "error" as const,
        message:
          "Этот Discord аккаунт уже привязан к другому профилю сайта. Используйте другой Discord или другой профиль.",
      };
    case "denied":
      return {
        tone: "error" as const,
        message:
          "Авторизация через Discord была отменена. Повторите попытку, чтобы открыть участие.",
      };
    case "config":
      return {
        tone: "error" as const,
        message:
          "Discord-авторизация еще не настроена на сервере. Проверьте переменные окружения приложения.",
      };
    case "error":
      return {
        tone: "error" as const,
        message:
          "Не удалось завершить проверку Discord. Повторите попытку чуть позже.",
      };
    default:
      return null;
  }
}

export function getDiscordFeedbackClasses(tone: DiscordFeedbackTone) {
  switch (tone) {
    case "success":
      return "rounded-[18px] border border-[#d43c43]/30 bg-[#d43c43]/14 p-4 text-sm text-[#ffd1d2]";
    case "warning":
      return "rounded-[18px] border border-[#b9852f]/28 bg-[#b9852f]/14 p-4 text-sm text-[#f8ddb0]";
    case "error":
    default:
      return "rounded-[18px] border border-[#7d2631]/28 bg-[#7d2631]/16 p-4 text-sm text-[#ffccd5]";
  }
}

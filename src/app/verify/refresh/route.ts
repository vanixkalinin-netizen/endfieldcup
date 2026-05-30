import { NextResponse } from "next/server";

import { refreshTelegramVerificationToken } from "@/lib/telegram";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const token = searchParams.get("token") ?? "";
  const nextToken = await refreshTelegramVerificationToken(token);

  if (!nextToken) {
    return NextResponse.redirect(new URL("/register", request.url));
  }

  return NextResponse.redirect(
    new URL(`/verify?token=${encodeURIComponent(nextToken)}`, request.url),
  );
}

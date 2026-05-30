import { NextResponse } from "next/server";

import { getTelegramVerificationStatus } from "@/lib/telegram";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const token = searchParams.get("token");
  const status = await getTelegramVerificationStatus(token);

  return NextResponse.json(status);
}

import { redirect } from "next/navigation";

import { createSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { getTelegramVerificationStatus } from "@/lib/telegram";

type VerifyCompletePageProps = {
  searchParams: Promise<{
    token?: string;
  }>;
};

export default async function VerifyCompletePage({
  searchParams,
}: VerifyCompletePageProps) {
  const params = await searchParams;
  const token = params.token ?? "";
  const status = await getTelegramVerificationStatus(token);

  if (status.status !== "verified") {
    redirect(`/verify?token=${encodeURIComponent(token)}`);
  }

  const user = await prisma.user.findUnique({
    where: {
      email: status.email,
    },
  });

  if (!user) {
    redirect("/login");
  }

  await createSession({
    id: user.id,
    email: user.email,
    nickname: user.nickname,
    role: user.role,
  });

  redirect(user.role === "ADMIN" ? "/acp" : "/dashboard");
}

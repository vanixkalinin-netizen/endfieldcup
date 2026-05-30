import "dotenv/config";

import { UserRole } from "@prisma/client";

import { buildDiscordInternalEmail } from "../src/lib/discord";
import { prisma } from "../src/lib/prisma";

async function main() {
  const adminDiscordId = process.env.SEED_ADMIN_DISCORD_ID?.trim() || null;
  const adminEmail = (
    process.env.SEED_ADMIN_EMAIL ||
    (adminDiscordId
      ? buildDiscordInternalEmail(adminDiscordId)
      : "admin@endfield.local")
  ).toLowerCase();
  const adminNickname = process.env.SEED_ADMIN_NICKNAME || "Operator";

  const existingUser = await prisma.user.findFirst({
    where: {
      OR: [
        { email: adminEmail },
        ...(adminDiscordId ? [{ discordId: adminDiscordId }] : []),
      ],
    },
  });

  if (existingUser) {
    await prisma.user.update({
      where: { id: existingUser.id },
      data: {
        nickname: adminNickname,
        email: adminEmail,
        role: UserRole.ADMIN,
        ...(adminDiscordId ? { discordId: adminDiscordId } : {}),
      },
    });
    return;
  }

  await prisma.user.create({
    data: {
      nickname: adminNickname,
      email: adminEmail,
      passwordHash: null,
      role: UserRole.ADMIN,
      ...(adminDiscordId ? { discordId: adminDiscordId } : {}),
    },
  });
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (error) => {
    console.error(error);
    await prisma.$disconnect();
    process.exit(1);
  });

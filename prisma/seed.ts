import "dotenv/config";

import { UserRole } from "@prisma/client";

import { hashPassword } from "../src/lib/password";
import { prisma } from "../src/lib/prisma";

async function main() {
  const adminEmail = process.env.SEED_ADMIN_EMAIL || "admin@endfield.local";
  const adminPassword = process.env.SEED_ADMIN_PASSWORD || "Admin123!";
  const adminNickname = process.env.SEED_ADMIN_NICKNAME || "Operator";

  const passwordHash = await hashPassword(adminPassword);

  await prisma.user.upsert({
    where: { email: adminEmail.toLowerCase() },
    update: {
      nickname: adminNickname,
      passwordHash,
      role: UserRole.ADMIN,
      isVerified: true,
    },
    create: {
      nickname: adminNickname,
      email: adminEmail.toLowerCase(),
      passwordHash,
      role: UserRole.ADMIN,
      isVerified: true,
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

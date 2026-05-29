import { notFound } from "next/navigation";

import { AvatarBadge } from "@/components/avatar-badge";
import { prisma } from "@/lib/prisma";

type PublicProfilePageProps = {
  params: Promise<{
    nickname: string;
  }>;
};

export default async function PublicProfilePage({
  params,
}: PublicProfilePageProps) {
  const { nickname } = await params;

  const user = await prisma.user.findUnique({
    where: {
      nickname: decodeURIComponent(nickname),
    },
    select: {
      nickname: true,
      bio: true,
      createdAt: true,
      applications: {
        select: {
          id: true,
        },
      },
    },
  });

  if (!user) {
    notFound();
  }

  return (
    <div className="space-y-5">
      <section className="panel grid gap-6 p-7 md:grid-cols-[auto_minmax(0,1fr)] md:items-center md:p-8">
        <AvatarBadge nickname={user.nickname} size="xl" />

        <div>
          <p className="text-xs uppercase tracking-[0.34em] text-[#8891dd]">
            Player profile
          </p>
          <h2 className="mt-4 font-heading text-4xl font-bold uppercase tracking-[0.08em] text-white">
            {user.nickname}
          </h2>
          <p className="mt-4 max-w-2xl text-white/58">
            {user.bio || "Пользователь пока не добавил описание профиля."}
          </p>
        </div>
      </section>

      <section className="grid gap-5 md:grid-cols-2">
        <div className="panel p-6">
          <p className="text-xs uppercase tracking-[0.3em] text-white/35">
            Описание
          </p>
          <p className="mt-4 text-white/58">
            {user.bio || "Описание ещё не заполнено."}
          </p>
        </div>
        <div className="panel p-6">
          <p className="text-xs uppercase tracking-[0.3em] text-white/35">
            Активность
          </p>
          <p className="mt-4 text-white/58">
            Всего заявок на события: {user.applications.length}
          </p>
        </div>
      </section>
    </div>
  );
}

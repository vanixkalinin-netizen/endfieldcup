import Link from "next/link";

import { logoutAction } from "@/actions/auth";
import { AvatarBadge } from "@/components/avatar-badge";
import { PasswordForm } from "@/components/forms/password-form";
import { ProfileForm } from "@/components/forms/profile-form";
import { requireUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export default async function ProfilePage() {
  const user = await requireUser();
  const applicationCount = await prisma.eventApplication.count({
    where: { userId: user.id },
  });

  return (
    <div className="space-y-5">
      <section className="panel grid gap-6 p-7 md:grid-cols-[auto_minmax(0,1fr)_auto] md:items-center md:p-8">
        <AvatarBadge nickname={user.nickname} size="xl" />

        <div>
          <p className="text-xs uppercase tracking-[0.34em] text-[#8891dd]">
            Personal cabinet
          </p>
          <h2 className="mt-4 font-heading text-4xl font-bold uppercase tracking-[0.08em] text-white">
            {user.nickname}
          </h2>
          <p className="mt-3 text-white/58">{user.email}</p>
          <p className="mt-4 max-w-2xl text-white/56">
            {user.bio || "Пока без описания. Добавьте пару строк о себе ниже."}
          </p>
        </div>

        <div className="flex flex-col gap-3 md:items-end">
          <Link href={`/players/${encodeURIComponent(user.nickname)}`} className="ghost-button text-center">
            Публичный профиль
          </Link>
          <form action={logoutAction} className="w-full md:w-auto">
            <button type="submit" className="ghost-button w-full">
              Выйти
            </button>
          </form>
        </div>
      </section>

      <section className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_420px]">
        <div className="panel p-7">
          <div className="flex items-center justify-between">
            <h3 className="section-title">Описание профиля</h3>
            <span className="inline-flex items-center gap-1.5 text-sm text-white/45">
              <span>{applicationCount}</span>
              <span>заявок</span>
            </span>
          </div>
          <div className="mt-6">
            <ProfileForm bio={user.bio} />
          </div>
        </div>

        <div className="panel p-7">
          <h3 className="section-title">Смена пароля</h3>
          <p className="mt-3 text-sm text-white/52">
            Для обновления пароля введите текущий пароль, затем новый пароль дважды.
          </p>
          <div className="mt-6">
            <PasswordForm />
          </div>
        </div>
      </section>
    </div>
  );
}

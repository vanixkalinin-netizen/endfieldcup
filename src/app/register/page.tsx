import Link from "next/link";

import { RegisterForm } from "@/components/forms/register-form";

export default function RegisterPage() {
  return (
    <div className="grid gap-5 xl:grid-cols-[minmax(0,1.15fr)_460px]">
      <section className="panel p-7 md:p-8">
        <p className="text-xs uppercase tracking-[0.34em] text-[#8891dd]">
          Recruitment gate
        </p>
        <h2 className="mt-4 font-heading text-4xl font-bold uppercase tracking-[0.08em] text-white md:text-5xl">
          Регистрация нового игрока
        </h2>
        <p className="mt-4 max-w-2xl text-white/60">
          Создайте аккаунт по нику и паролю. После входа вы сможете подключить
          Discord и открыть доступ к участию в турнирах через нужный сервер.
        </p>
      </section>

      <section className="panel p-7">
        <h3 className="font-heading text-2xl font-bold uppercase tracking-[0.08em] text-white">
          Создать аккаунт
        </h3>
        <div className="mt-6">
          <RegisterForm />
        </div>
        <p className="mt-5 text-sm text-white/48">
          Уже есть аккаунт?{" "}
          <Link href="/login" className="text-[#8c96ff]">
            Войти
          </Link>
        </p>
      </section>
    </div>
  );
}

import Link from "next/link";

import { LoginForm } from "@/components/forms/login-form";

export default function LoginPage() {
  return (
    <div className="mx-auto w-full max-w-6xl">
      <section className="panel relative overflow-hidden px-6 py-8 md:px-10 md:py-10 xl:px-14 xl:py-12">
        <div className="pointer-events-none absolute inset-0">
          <div className="absolute -left-24 top-0 h-52 w-52 rounded-full bg-[radial-gradient(circle,rgba(111,123,255,0.22),transparent_68%)] blur-3xl" />
          <div className="absolute right-[-4rem] top-1/2 h-72 w-72 -translate-y-1/2 rounded-full bg-[radial-gradient(circle,rgba(111,123,255,0.18),transparent_72%)] blur-3xl" />
          <div className="absolute inset-y-0 right-[28%] hidden w-px bg-white/6 xl:block" />
        </div>

        <div className="relative grid gap-10 xl:grid-cols-[minmax(0,1.2fr)_minmax(380px,440px)] xl:items-center">
          <div className="max-w-3xl">
            <p className="text-xs uppercase tracking-[0.38em] text-[#95a0ff]">
              Operator access
            </p>
            <h2 className="mt-5 font-heading text-4xl font-bold uppercase tracking-[0.08em] text-white md:text-5xl xl:text-6xl">
              Вход
            </h2>
            <p className="mt-5 max-w-2xl text-base leading-8 text-white/56 md:text-lg">
              Откройте панель турниров, чтобы управлять событиями, следить за
              сеткой и быстро переходить к активным матчам.
            </p>
          </div>

          <div className="rounded-[28px] border border-white/10 bg-[#0c0f17]/88 p-6 shadow-[0_24px_60px_rgba(0,0,0,0.32)] md:p-8">
            <h3 className="font-heading text-2xl font-bold uppercase tracking-[0.08em] text-white">
              Войти
            </h3>
            <p className="mt-2 text-sm text-white/52">
              Вход работает по нику и паролю. Если аккаунт еще не подтвержден,
              мы сразу отправим вас в Telegram-бота для завершения верификации.
            </p>
            <div className="mt-6">
              <LoginForm />
            </div>
            <p className="mt-5 text-sm text-white/48">
              Нет аккаунта?{" "}
              <Link
                href="/register"
                className="text-[#9ca5ff] transition-colors hover:text-white"
              >
                Зарегистрироваться
              </Link>
            </p>
          </div>
        </div>
      </section>
    </div>
  );
}

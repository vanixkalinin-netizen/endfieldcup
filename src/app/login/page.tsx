import Link from "next/link";

import { LoginForm } from "@/components/forms/login-form";

export default function LoginPage() {
  return (
    <div className="grid gap-5 xl:grid-cols-[minmax(0,1.15fr)_460px]">
      <section className="panel p-7 md:p-8">
        <p className="text-xs uppercase tracking-[0.34em] text-[#8891dd]">Operator access</p>
        <h2 className="mt-4 font-heading text-4xl font-bold uppercase tracking-[0.08em] text-white md:text-5xl">
          Вход в систему турниров
        </h2>
        <p className="mt-4 max-w-2xl text-white/60">
          После входа игрок видит свои заявки, а администратор получает отдельную панель для публикации новых событий и контроля всех регистраций.
        </p>

        <div className="mt-8 grid gap-4 md:grid-cols-3">
          {[
            "Авторизация по почте и паролю",
            "Доступ к личному кабинету",
            "Переход в админку для роли ADMIN",
          ].map((item) => (
            <div key={item} className="rounded-[22px] border border-white/8 bg-white/[0.03] p-4 text-sm text-white/58">
              {item}
            </div>
          ))}
        </div>
      </section>

      <section className="panel p-7">
        <h3 className="font-heading text-2xl font-bold uppercase tracking-[0.08em] text-white">
          Войти
        </h3>
        <p className="mt-2 text-sm text-white/52">
          Если аккаунт ещё не подтверждён, сначала завершите подтверждение кода.
        </p>
        <div className="mt-6">
          <LoginForm />
        </div>
        <p className="mt-5 text-sm text-white/48">
          Нет аккаунта?{" "}
          <Link href="/register" className="text-[#8c96ff]">
            Зарегистрироваться
          </Link>
        </p>
      </section>
    </div>
  );
}

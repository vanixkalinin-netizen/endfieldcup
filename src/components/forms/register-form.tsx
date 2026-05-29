"use client";

import Link from "next/link";
import { useActionState } from "react";

import { registerAction } from "@/actions/auth";
import { SubmitButton } from "@/components/forms/submit-button";
import { initialFormState } from "@/lib/validators";

export function RegisterForm() {
  const [state, formAction] = useActionState(registerAction, initialFormState);

  return (
    <form action={formAction} className="space-y-5">
      <div className="space-y-2">
        <label className="field-label" htmlFor="nickname">
          Ник
        </label>
        <input
          id="nickname"
          name="nickname"
          defaultValue={state.values?.nickname ?? ""}
          className="field-input"
          placeholder="Kal'tsit"
        />
        {state.fieldErrors?.nickname ? (
          <p className="field-error">{state.fieldErrors.nickname[0]}</p>
        ) : null}
      </div>

      <div className="space-y-2">
        <label className="field-label" htmlFor="email">
          Почта
        </label>
        <input
          id="email"
          name="email"
          type="email"
          defaultValue={state.values?.email ?? ""}
          className="field-input"
          placeholder="operator@endfield.gg"
        />
        {state.fieldErrors?.email ? (
          <p className="field-error">{state.fieldErrors.email[0]}</p>
        ) : null}
      </div>

      <div className="grid gap-5 md:grid-cols-2">
        <div className="space-y-2">
          <label className="field-label" htmlFor="password">
            Пароль
          </label>
          <input
            id="password"
            name="password"
            type="password"
            className="field-input"
            placeholder="••••••••"
          />
          {state.fieldErrors?.password ? (
            <p className="field-error">{state.fieldErrors.password[0]}</p>
          ) : null}
        </div>

        <div className="space-y-2">
          <label className="field-label" htmlFor="confirmPassword">
            Повтор пароля
          </label>
          <input
            id="confirmPassword"
            name="confirmPassword"
            type="password"
            className="field-input"
            placeholder="••••••••"
          />
          {state.fieldErrors?.confirmPassword ? (
            <p className="field-error">{state.fieldErrors.confirmPassword[0]}</p>
          ) : null}
        </div>
      </div>

      {state.message ? (
        <div className={`form-banner ${state.status === "error" ? "form-banner-error" : "form-banner-success"}`}>
          <p>{state.message}</p>
          {state.debugCode ? (
            <p className="font-mono text-sm text-[#89b4ff]">DEV CODE: {state.debugCode}</p>
          ) : null}
          {state.status === "success" && state.values?.email ? (
            <Link href={`/verify?email=${encodeURIComponent(state.values.email)}`} className="text-sm font-semibold text-white/90 underline">
              Перейти к подтверждению аккаунта
            </Link>
          ) : null}
        </div>
      ) : null}

      <SubmitButton
        idleLabel="Создать аккаунт"
        pendingLabel="Создаём аккаунт..."
        className="primary-button w-full"
      />
    </form>
  );
}

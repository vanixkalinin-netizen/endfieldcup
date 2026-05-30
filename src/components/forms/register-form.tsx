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
        <div
          className={`form-banner ${state.status === "error" ? "form-banner-error" : "form-banner-success"}`}
        >
          <p>{state.message}</p>
          {state.verificationToken ? (
            <Link
              href={`/verify?token=${encodeURIComponent(state.verificationToken)}`}
              className="text-sm font-semibold text-white/90 underline"
            >
              Открыть Telegram-подтверждение
            </Link>
          ) : null}
        </div>
      ) : null}

      <SubmitButton
        idleLabel="Создать аккаунт"
        pendingLabel="Создаем аккаунт..."
        className="primary-button w-full"
      />
    </form>
  );
}

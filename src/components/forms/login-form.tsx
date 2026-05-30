"use client";

import Link from "next/link";
import { useActionState } from "react";

import { loginAction } from "@/actions/auth";
import { SubmitButton } from "@/components/forms/submit-button";
import { initialFormState } from "@/lib/validators";

export function LoginForm() {
  const [state, formAction] = useActionState(loginAction, initialFormState);

  return (
    <form action={formAction} className="space-y-5">
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
              Продолжить в Telegram
            </Link>
          ) : null}
        </div>
      ) : null}

      <SubmitButton
        idleLabel="Войти"
        pendingLabel="Входим..."
        className="primary-button w-full"
      />
    </form>
  );
}

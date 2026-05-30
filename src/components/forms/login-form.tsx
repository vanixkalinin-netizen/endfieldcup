"use client";

import { useActionState } from "react";

import { loginAction } from "@/actions/auth";
import { SubmitButton } from "@/components/forms/submit-button";
import { initialFormState } from "@/lib/validators";

export function LoginForm() {
  const [state, formAction] = useActionState(loginAction, initialFormState);

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

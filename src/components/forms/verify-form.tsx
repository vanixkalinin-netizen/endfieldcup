"use client";

import { useActionState } from "react";

import { verifyAction } from "@/actions/auth";
import { SubmitButton } from "@/components/forms/submit-button";
import { initialFormState } from "@/lib/validators";

type VerifyFormProps = {
  email?: string;
};

export function VerifyForm({ email }: VerifyFormProps) {
  const [state, formAction] = useActionState(verifyAction, initialFormState);

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
          defaultValue={state.values?.email ?? email ?? ""}
          className="field-input"
          placeholder="operator@endfield.gg"
        />
        {state.fieldErrors?.email ? (
          <p className="field-error">{state.fieldErrors.email[0]}</p>
        ) : null}
      </div>

      <div className="space-y-2">
        <label className="field-label" htmlFor="code">
          Код подтверждения
        </label>
        <input
          id="code"
          name="code"
          inputMode="numeric"
          defaultValue={state.values?.code ?? ""}
          className="field-input tracking-[0.4em]"
          placeholder="123456"
        />
        {state.fieldErrors?.code ? (
          <p className="field-error">{state.fieldErrors.code[0]}</p>
        ) : null}
      </div>

      {state.message ? (
        <div className={`form-banner ${state.status === "error" ? "form-banner-error" : "form-banner-success"}`}>
          {state.message}
        </div>
      ) : null}

      <SubmitButton
        idleLabel="Подтвердить аккаунт"
        pendingLabel="Проверяем код..."
        className="primary-button w-full"
      />
    </form>
  );
}

"use client";

import { useActionState } from "react";

import { changePasswordAction } from "@/actions/auth";
import { SubmitButton } from "@/components/forms/submit-button";
import { initialFormState } from "@/lib/validators";

export function PasswordForm() {
  const [state, formAction] = useActionState(
    changePasswordAction,
    initialFormState,
  );

  return (
    <form action={formAction} className="space-y-5">
      <div className="space-y-2">
        <label className="field-label" htmlFor="currentPassword">
          Текущий пароль
        </label>
        <input
          id="currentPassword"
          name="currentPassword"
          type="password"
          className="field-input"
          placeholder="••••••••"
        />
        {state.fieldErrors?.currentPassword ? (
          <p className="field-error">{state.fieldErrors.currentPassword[0]}</p>
        ) : null}
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="min-w-0 space-y-2">
          <label className="field-label" htmlFor="newPassword">
            Новый пароль
          </label>
          <input
            id="newPassword"
            name="newPassword"
            type="password"
            className="field-input"
            placeholder="••••••••"
          />
          {state.fieldErrors?.newPassword ? (
            <p className="field-error">{state.fieldErrors.newPassword[0]}</p>
          ) : null}
        </div>

        <div className="min-w-0 space-y-2">
          <label className="field-label" htmlFor="confirmNewPassword">
            Повтор пароля
          </label>
          <input
            id="confirmNewPassword"
            name="confirmNewPassword"
            type="password"
            className="field-input"
            placeholder="••••••••"
          />
          {state.fieldErrors?.confirmNewPassword ? (
            <p className="field-error">
              {state.fieldErrors.confirmNewPassword[0]}
            </p>
          ) : null}
        </div>
      </div>

      {state.message ? (
        <div
          className={`form-banner ${state.status === "error" ? "form-banner-error" : "form-banner-success"}`}
        >
          {state.message}
        </div>
      ) : null}

      <SubmitButton
        idleLabel="Обновить пароль"
        pendingLabel="Обновляем..."
        className="primary-button w-full md:w-auto"
      />
    </form>
  );
}

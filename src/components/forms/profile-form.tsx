"use client";

import { useActionState } from "react";

import { updateProfileAction } from "@/actions/auth";
import { SubmitButton } from "@/components/forms/submit-button";
import { initialFormState } from "@/lib/validators";

type ProfileFormProps = {
  bio: string;
};

export function ProfileForm({ bio }: ProfileFormProps) {
  const [state, formAction] = useActionState(updateProfileAction, initialFormState);

  return (
    <form action={formAction} className="space-y-5">
      <div className="space-y-2">
        <label className="field-label" htmlFor="bio">
          Описание профиля
        </label>
        <textarea
          id="bio"
          name="bio"
          className="field-input min-h-36"
          defaultValue={state.values?.bio ?? bio}
          placeholder="Расскажите о себе, предпочтениях в игре, ролях в турнирах или своём стиле."
        />
        {state.fieldErrors?.bio ? (
          <p className="field-error">{state.fieldErrors.bio[0]}</p>
        ) : null}
      </div>

      {state.message ? (
        <div className={`form-banner ${state.status === "error" ? "form-banner-error" : "form-banner-success"}`}>
          {state.message}
        </div>
      ) : null}

      <SubmitButton
        idleLabel="Сохранить описание"
        pendingLabel="Сохраняем..."
        className="primary-button w-full md:w-auto"
      />
    </form>
  );
}

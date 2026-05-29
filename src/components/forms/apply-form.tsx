"use client";

import { useActionState } from "react";

import { applyToEventAction } from "@/actions/events";
import { SubmitButton } from "@/components/forms/submit-button";
import { initialFormState } from "@/lib/validators";

type ApplyFormProps = {
  eventId: string;
};

export function ApplyForm({ eventId }: ApplyFormProps) {
  const [state, formAction] = useActionState(
    applyToEventAction,
    initialFormState,
  );

  return (
    <form
      action={formAction}
      className="space-y-4 rounded-[26px] border border-white/8 bg-white/[0.03] p-5"
    >
      <input type="hidden" name="eventId" value={eventId} />

      <div className="space-y-2">
        <label className="field-label" htmlFor={`discord-${eventId}`}>
          Ваш ник в Discord
        </label>
        <input
          id={`discord-${eventId}`}
          name="discordNickname"
          className="field-input"
          defaultValue={state.values?.discordNickname ?? ""}
          placeholder="username#1234 или username"
        />
        {state.fieldErrors?.discordNickname ? (
          <p className="field-error">{state.fieldErrors.discordNickname[0]}</p>
        ) : null}
      </div>

      <div className="space-y-2">
        <label className="field-label" htmlFor={`note-${eventId}`}>
          Комментарий к заявке
        </label>
        <textarea
          id={`note-${eventId}`}
          name="note"
          className="field-input min-h-24"
          defaultValue={state.values?.note ?? ""}
          placeholder="Например: свободен вечером по МСК, могу сыграть все стадии."
        />
        {state.fieldErrors?.note ? (
          <p className="field-error">{state.fieldErrors.note[0]}</p>
        ) : null}
      </div>

      {state.message ? (
        <div
          className={`form-banner ${state.status === "error" ? "form-banner-error" : "form-banner-success"}`}
        >
          {state.message}
        </div>
      ) : null}

      <SubmitButton
        idleLabel="Подать заявку"
        pendingLabel="Отправляем..."
        className="primary-button w-full"
      />
    </form>
  );
}

"use client";

import { useActionState } from "react";

import { createEventAction } from "@/actions/events";
import { SubmitButton } from "@/components/forms/submit-button";
import { initialFormState } from "@/lib/validators";

export function EventForm() {
  const [state, formAction] = useActionState(
    createEventAction,
    initialFormState,
  );

  return (
    <form action={formAction} className="grid gap-5">
      <div className="space-y-2">
        <label className="field-label" htmlFor="title">
          Название события
        </label>
        <input
          id="title"
          name="title"
          className="field-input"
          defaultValue={state.values?.title ?? ""}
          placeholder="Endfield Interference Cup"
        />
        {state.fieldErrors?.title ? (
          <p className="field-error">{state.fieldErrors.title[0]}</p>
        ) : null}
      </div>

      <div className="space-y-2">
        <label className="field-label" htmlFor="description">
          Описание
        </label>
        <textarea
          id="description"
          name="description"
          className="field-input min-h-40"
          defaultValue={state.values?.description ?? ""}
          placeholder="Расскажите о формате, правилах, расписании и любых деталях события."
        />
        {state.fieldErrors?.description ? (
          <p className="field-error">{state.fieldErrors.description[0]}</p>
        ) : null}
      </div>

      <div className="space-y-2">
        <label className="field-label" htmlFor="location">
          Локация
        </label>
        <input
          id="location"
          name="location"
          className="field-input"
          defaultValue={state.values?.location ?? ""}
          placeholder="Online / RU + Global"
        />
        {state.fieldErrors?.location ? (
          <p className="field-error">{state.fieldErrors.location[0]}</p>
        ) : null}
      </div>

      <div className="space-y-2">
        <label className="field-label" htmlFor="startsAt">
          Старт
        </label>
        <input
          id="startsAt"
          name="startsAt"
          type="date"
          className="field-input"
          defaultValue={state.values?.startsAt ?? ""}
        />
        {state.fieldErrors?.startsAt ? (
          <p className="field-error">{state.fieldErrors.startsAt[0]}</p>
        ) : null}
      </div>

      {state.message ? (
        <div
          className={`form-banner ${state.status === "error" ? "form-banner-error" : "form-banner-success"}`}
        >
          {state.message}
        </div>
      ) : null}

      <div>
        <SubmitButton
          idleLabel="Создать событие"
          pendingLabel="Создаём событие..."
          className="primary-button w-full md:w-auto"
        />
      </div>
    </form>
  );
}

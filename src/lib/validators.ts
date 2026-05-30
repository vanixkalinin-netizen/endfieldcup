import { z } from "zod";

export const registerSchema = z
  .object({
    nickname: z
      .string()
      .trim()
      .min(3, "Минимум 3 символа")
      .max(24, "Максимум 24 символа"),
    password: z
      .string()
      .min(8, "Пароль должен быть не короче 8 символов")
      .regex(/[A-Z]/, "Добавьте хотя бы одну заглавную букву")
      .regex(/[0-9]/, "Добавьте хотя бы одну цифру"),
    confirmPassword: z.string(),
  })
  .refine((data) => data.password === data.confirmPassword, {
    path: ["confirmPassword"],
    message: "Пароли не совпадают",
  });

export const loginSchema = z.object({
  nickname: z
    .string()
    .trim()
    .min(3, "Введите ник")
    .max(24, "Максимум 24 символа"),
  password: z.string().min(1, "Введите пароль"),
});

export const eventSchema = z.object({
  title: z
    .string()
    .trim()
    .min(4, "Минимум 4 символа")
    .max(80, "Максимум 80 символов"),
  description: z.string().trim().min(1, "Введите описание события"),
  location: z
    .string()
    .trim()
    .max(80, "Максимум 80 символов")
    .optional()
    .or(z.literal("")),
  startsAt: z.string().min(1, "Укажите дату старта"),
});

export const applicationSchema = z.object({
  eventId: z.string().cuid("Некорректное событие"),
  note: z
    .string()
    .trim()
    .max(240, "Максимум 240 символов")
    .optional()
    .or(z.literal("")),
});

export const profileSchema = z.object({
  bio: z
    .string()
    .trim()
    .max(500, "Максимум 500 символов")
    .optional()
    .or(z.literal("")),
});

export const passwordChangeSchema = z
  .object({
    currentPassword: z.string().min(1, "Введите текущий пароль"),
    newPassword: z
      .string()
      .min(8, "Новый пароль должен быть не короче 8 символов")
      .regex(/[A-Z]/, "Добавьте хотя бы одну заглавную букву")
      .regex(/[0-9]/, "Добавьте хотя бы одну цифру"),
    confirmNewPassword: z.string().min(1, "Повторите новый пароль"),
  })
  .refine((data) => data.newPassword === data.confirmNewPassword, {
    path: ["confirmNewPassword"],
    message: "Пароли не совпадают",
  });

export type FormState = {
  status: "idle" | "error" | "success";
  message?: string;
  fieldErrors?: Record<string, string[] | undefined>;
  values?: Record<string, string>;
};

export const initialFormState: FormState = {
  status: "idle",
};

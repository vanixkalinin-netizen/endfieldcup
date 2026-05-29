import { format } from "date-fns";
import clsx from "clsx";

export function cn(...inputs: Array<string | false | null | undefined>) {
  return clsx(inputs);
}

export function slugify(input: string) {
  return input
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9а-яё]+/gi, "-")
    .replace(/^-+|-+$/g, "");
}

export function formatDateTime(date: Date) {
  return format(date, "dd.MM.yyyy HH:mm");
}

export function formatDate(date: Date) {
  return format(date, "dd.MM.yyyy");
}

export function formatShortDate(date: Date) {
  return format(date, "dd MMM");
}

export function createVerificationCode() {
  return String(Math.floor(100000 + Math.random() * 900000));
}

function isPlaceholderValue(value: string) {
  const normalized = value.trim().toLowerCase();
  return (
    normalized.includes("example.com") ||
    normalized.includes("smtp-user") ||
    normalized.includes("smtp-password") ||
    normalized.includes("replace-with")
  );
}

export function isSmtpConfigured() {
  const values = [
    process.env.SMTP_HOST,
    process.env.SMTP_PORT,
    process.env.SMTP_USER,
    process.env.SMTP_PASS,
    process.env.SMTP_FROM,
  ];

  if (values.some((value) => !value?.trim())) {
    return false;
  }

  return !values.some((value) => isPlaceholderValue(value ?? ""));
}

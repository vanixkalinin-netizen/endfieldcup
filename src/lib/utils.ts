import clsx from "clsx";
import { format } from "date-fns";

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

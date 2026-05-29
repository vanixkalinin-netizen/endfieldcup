import { ApplicationStatus, EventStatus } from "@prisma/client";

import { cn } from "@/lib/utils";

type StatusPillProps = {
  status: ApplicationStatus | EventStatus;
};

const statusLabels: Record<ApplicationStatus | EventStatus, string> = {
  APPROVED: "Участник",
  CLOSED: "Активно",
  COMPLETED: "Завершено",
  DRAFT: "Черновик",
  PENDING: "На рассмотрении",
  PUBLISHED: "Регистрация открыта",
  REJECTED: "Отклонено",
};

export function StatusPill({ status }: StatusPillProps) {
  return (
    <span
      className={cn(
        "inline-flex max-w-[14rem] items-center justify-center rounded-full border px-3 py-1.5 text-center text-[10px] font-semibold uppercase tracking-[0.16em]",
        status === "CLOSED" &&
          "border-[#b9852f] bg-[#b9852f]/18 text-[#f8d79a]",
        status === "COMPLETED" &&
          "border-[#7d2631] bg-[#7d2631]/18 text-[#ffb9c5]",
        status === "PUBLISHED" &&
          "border-[#4158ff] bg-[#4158ff]/18 text-[#aab8ff]",
        status === "APPROVED" &&
          "border-[#4158ff] bg-[#4158ff]/18 text-[#aab8ff]",
        status === "PENDING" &&
          "border-white/10 bg-white/6 text-white/70",
        status === "DRAFT" &&
          "border-white/10 bg-white/6 text-white/70",
        status === "REJECTED" &&
          "border-[#7d2631] bg-[#7d2631]/18 text-[#ffb9c5]",
      )}
    >
      {statusLabels[status]}
    </span>
  );
}

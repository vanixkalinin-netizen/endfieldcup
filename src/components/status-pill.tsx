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
          "border-[#a26b32]/36 bg-[#a26b32]/18 text-[#f0cf9f]",
        status === "COMPLETED" &&
          "border-[#7d1f29]/40 bg-[#7d1f29]/18 text-[#ffc0c9]",
        status === "PUBLISHED" &&
          "border-[#d43c43]/40 bg-[#d43c43]/16 text-[#ffd2d2]",
        status === "APPROVED" &&
          "border-[#d43c43]/40 bg-[#d43c43]/16 text-[#ffd2d2]",
        status === "PENDING" &&
          "border-white/10 bg-white/6 text-white/70",
        status === "DRAFT" &&
          "border-white/10 bg-white/6 text-white/70",
        status === "REJECTED" &&
          "border-[#7d1f29]/40 bg-[#7d1f29]/18 text-[#ffc0c9]",
      )}
    >
      {statusLabels[status]}
    </span>
  );
}

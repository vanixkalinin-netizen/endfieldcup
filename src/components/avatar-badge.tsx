import { cn } from "@/lib/utils";
import { getAvatarGradient, getInitials } from "@/lib/profile";

type AvatarBadgeProps = {
  nickname: string;
  size?: "sm" | "md" | "lg" | "xl";
  className?: string;
};

const sizeClasses = {
  sm: "h-10 w-10 text-sm",
  md: "h-12 w-12 text-base",
  lg: "h-16 w-16 text-xl",
  xl: "h-24 w-24 text-3xl",
};

export function AvatarBadge({
  nickname,
  size = "md",
  className,
}: AvatarBadgeProps) {
  return (
    <div
      className={cn(
        "relative inline-grid place-items-center overflow-hidden rounded-full border border-white/10 bg-gradient-to-br font-heading font-bold uppercase text-white shadow-[0_18px_40px_rgba(52,69,255,0.22)]",
        getAvatarGradient(nickname),
        sizeClasses[size],
        className,
      )}
      aria-hidden="true"
    >
      <span className="avatar-initials">{getInitials(nickname)}</span>
    </div>
  );
}

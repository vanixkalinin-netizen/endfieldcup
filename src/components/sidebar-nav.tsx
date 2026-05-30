"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

import { cn } from "@/lib/utils";

type SidebarNavProps = {
  isAdmin: boolean;
  isAuthenticated: boolean;
};

type NavItem = {
  href: string;
  hint: string;
  index: string;
  label: string;
};

const guestItems: NavItem[] = [
  { href: "/", label: "Главная", hint: "Home", index: "01" },
];

const userItems: NavItem[] = [
  { href: "/", label: "Главная", hint: "Home", index: "01" },
  {
    href: "/dashboard",
    label: "Мои участия",
    hint: "My Participations",
    index: "02",
  },
];

export function SidebarNav({
  isAdmin,
  isAuthenticated,
}: SidebarNavProps) {
  const pathname = usePathname();
  const baseItems = isAuthenticated ? userItems : guestItems;
  const items = isAdmin
    ? [
        ...baseItems,
        {
          href: "/acp",
          label: "Админ-панель",
          hint: "Admin Panel",
          index: "03",
        },
      ]
    : baseItems;

  const isActive = (href: string) => {
    if (href === "/") {
      return pathname === "/";
    }

    return pathname === href || pathname.startsWith(`${href}/`);
  };

  return (
    <nav className="space-y-2">
      {items.map((item) => (
        <Link
          key={item.href}
          href={item.href}
          className={cn("nav-item", isActive(item.href) && "nav-item-active")}
        >
          <span className="font-heading text-base font-bold tracking-[0.08em] text-white/54">
            {item.index}
          </span>
          <span className="min-w-0">
            <span className="block truncate font-heading text-[0.92rem] font-bold uppercase tracking-[0.08em] text-white">
              {item.label}
            </span>
            <span className="mt-1 block text-[10px] uppercase tracking-[0.24em] text-white/28">
              {item.hint}
            </span>
          </span>
        </Link>
      ))}
    </nav>
  );
}

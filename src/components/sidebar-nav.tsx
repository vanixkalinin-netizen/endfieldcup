"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

import { cn } from "@/lib/utils";

type SidebarNavProps = {
  isAdmin: boolean;
  isAuthenticated: boolean;
};

const guestItems = [{ href: "/", label: "Главная" }];

const userItems = [
  { href: "/", label: "Главная" },
  { href: "/dashboard", label: "Мои участия" },
];

export function SidebarNav({
  isAdmin,
  isAuthenticated,
}: SidebarNavProps) {
  const pathname = usePathname();
  const baseItems = isAuthenticated ? userItems : guestItems;
  const items = isAdmin
    ? [...baseItems, { href: "/acp", label: "Админ-панель" }]
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
          {item.label}
        </Link>
      ))}
    </nav>
  );
}

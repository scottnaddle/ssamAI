"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import clsx from "clsx";

interface NavItemProps {
  icon: string;
  label: string;
  href: string;
  badge?: string;
}

export function NavItem({ icon, label, href, badge }: NavItemProps) {
  const pathname = usePathname();
  const active = pathname === href || pathname.startsWith(`${href}/`);

  return (
    <Link
      href={href}
      className={clsx(
        "mb-0.5 flex cursor-pointer items-center gap-2.5 rounded-[10px] px-3 py-2 text-[13.5px] transition-colors",
        active
          ? "bg-primary-light font-semibold text-primary"
          : "font-normal text-text-mid hover:bg-primary-light/50",
      )}
    >
      <span className="text-base">{icon}</span>
      <span className="flex-1">{label}</span>
      {badge && (
        <span className="rounded-full bg-accent px-1.5 py-px text-[10px] font-bold text-white">
          {badge}
        </span>
      )}
    </Link>
  );
}

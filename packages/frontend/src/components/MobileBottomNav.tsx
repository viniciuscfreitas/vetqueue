"use client";

import Link from "next/link";

import { cn } from "@/lib/utils";

interface MobileBottomNavItem {
  id: string;
  label: string;
  href: string;
  icon: React.ComponentType<{ className?: string }>;
}

interface MobileBottomNavProps {
  items: MobileBottomNavItem[];
  activeItemId?: string;
}

export function MobileBottomNav({ items, activeItemId }: MobileBottomNavProps) {
  if (items.length === 0) {
    return null;
  }

  return (
    <nav className="fixed inset-x-0 bottom-0 z-20 border-t border-border bg-white/95 shadow-sm backdrop-blur sm:hidden">
      <ul className="flex h-14 items-center justify-evenly gap-1 px-2">
        {items.map((item) => {
          const Icon = item.icon;
          const isActive = item.id === activeItemId;

          return (
            <li key={item.id} className="flex-1">
              <Link
                href={item.href}
                className={cn(
                  "flex flex-col items-center gap-1 rounded-md px-3 py-2 text-xs font-medium text-muted-foreground transition-colors",
                  isActive && "text-primary",
                )}
              >
                <Icon className="h-5 w-5" />
                <span>{item.label}</span>
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}


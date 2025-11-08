"use client";

import { Suspense, useMemo, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { usePathname, useSearchParams } from "next/navigation";
import { Menu, X, LogOut } from "lucide-react";

import { useAuth } from "@/contexts/AuthContext";
import { shellModules } from "@/app/modules-config";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface AppShellProps {
  header?: React.ReactNode;
  children: React.ReactNode;
}

interface NavigationItem {
  id: string;
  label: string;
  href: string;
  icon: React.ComponentType<{ className?: string }>;
  description?: string;
}

function AppShellInner({ header, children }: AppShellProps) {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const { user, canAccess, logout } = useAuth();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const navigation = useMemo<NavigationItem[]>(() => {
    return shellModules
      .filter((item) => {
        if (!item.requiredModules || item.requiredModules.length === 0) {
          return true;
        }
        if (item.requireAll === false) {
          return item.requiredModules.some((module) => canAccess(module));
        }
        return canAccess(item.requiredModules);
      })
      .map((item) => ({
        id: item.id,
        label: item.label,
        href: item.href,
        icon: item.icon,
        description: item.description,
      }));
  }, [canAccess]);

  const handleLogout = async () => {
    await logout();
  };

  return (
    <div className="min-h-screen bg-muted/30">
      <div className="flex min-h-screen">
        <aside
          className={cn(
            "fixed inset-y-0 left-0 z-40 flex w-64 flex-col border-r border-border/60 bg-white/95 px-3 pb-4 pt-3 shadow-sm backdrop-blur transition-transform duration-200",
            sidebarOpen ? "translate-x-0" : "-translate-x-full sm:translate-x-0",
          )}
          aria-label="Menu principal"
        >
          <div className="flex items-center justify-between px-2">
            <Link href="/" className="flex items-center gap-2">
              <Image
                src="/logo.png"
                alt="FisioPet"
                width={160}
                height={40}
                className="h-9 w-auto"
                priority
              />
            </Link>
            <button
              type="button"
              aria-label="Fechar menu"
              className="rounded-md p-2 text-muted-foreground hover:bg-muted sm:hidden"
              onClick={() => setSidebarOpen(false)}
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          <nav className="mt-6 flex-1 space-y-1 overflow-y-auto">
            {navigation.map((item) => {
              const pathOnly = item.href.split("?")[0];
              const isActive =
                pathname === pathOnly ||
                (pathname.startsWith(pathOnly) && pathOnly !== "/") ||
                (item.href.includes("?") &&
                  pathname === pathOnly &&
                  searchParams?.toString() === item.href.split("?")[1]);

              const Icon = item.icon;
              return (
                <Link
                  key={item.id}
                  href={item.href}
                  className={cn(
                    "group flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm transition-colors duration-150",
                    isActive
                      ? "bg-primary/10 text-primary"
                      : "text-muted-foreground hover:bg-muted/80 hover:text-foreground",
                  )}
                  onClick={() => setSidebarOpen(false)}
                >
                  <span
                    className={cn(
                      "flex h-9 w-9 items-center justify-center rounded-full border border-transparent bg-primary/5 text-primary transition-colors",
                      isActive && "border-primary/40 bg-primary/15",
                    )}
                  >
                    <Icon className="h-4 w-4" />
                  </span>
                  <span className="flex-1">
                    <span className="block font-semibold">{item.label}</span>
                    {item.description && (
                      <span className="block text-xs text-muted-foreground/80">
                        {item.description}
                      </span>
                    )}
                  </span>
                </Link>
              );
            })}
          </nav>

          <div className="space-y-3 rounded-lg border border-dashed border-border/60 bg-muted/40 p-3">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10 text-primary">
                {user?.name ? user.name[0]?.toUpperCase() : "?"}
              </div>
              <div className="min-w-0">
                <p className="truncate text-sm font-semibold text-foreground">
                  {user?.name ?? "Usuário"}
                </p>
                <p className="truncate text-xs uppercase tracking-wide text-muted-foreground">
                  {user?.role?.toLowerCase() ?? "role"}
                </p>
              </div>
            </div>
            <Button
              variant="outline"
              size="sm"
              className="w-full gap-2 border border-border/60"
              onClick={handleLogout}
            >
              <LogOut className="h-4 w-4" />
              Sair
            </Button>
          </div>
        </aside>

        {sidebarOpen && (
          <div
            className="fixed inset-0 z-30 bg-black/30 backdrop-blur-sm sm:hidden"
            onClick={() => setSidebarOpen(false)}
            role="presentation"
          />
        )}

        <div className="flex min-h-screen flex-1 flex-col sm:pl-64">
          <div className="sticky top-0 z-20 border-b border-border/60 bg-white/90 backdrop-blur">
            <div className="flex h-16 items-center gap-3 px-4">
              <button
                type="button"
                aria-label="Abrir menu"
                className="rounded-md p-2 text-muted-foreground hover:bg-muted sm:hidden"
                onClick={() => setSidebarOpen(true)}
              >
                <Menu className="h-5 w-5" />
              </button>
              <div className="flex-1">{header}</div>
            </div>
          </div>
          <main className="flex-1 px-4 py-6 sm:px-6 lg:px-10">{children}</main>
        </div>
      </div>
    </div>
  );
}

export function AppShell(props: AppShellProps) {
  return (
    <Suspense fallback={<div className="min-h-screen bg-muted/20" />}>
      <AppShellInner {...props} />
    </Suspense>
  );
}


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
            "fixed inset-y-0 left-0 z-40 flex w-64 flex-col bg-white px-4 pb-6 pt-4 transition-transform duration-200",
            sidebarOpen ? "translate-x-0" : "-translate-x-full sm:translate-x-0",
          )}
          aria-label="Menu principal"
        >
          <div className="relative flex items-center justify-center px-2 py-1">
            <Link href="/" className="flex items-center justify-center gap-2">
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
              className="absolute right-1 top-1 rounded-md p-2 text-muted-foreground hover:bg-muted sm:hidden"
              onClick={() => setSidebarOpen(false)}
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          <nav className="mt-6 flex-1 space-y-1 overflow-y-auto pr-1">
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
                    "group relative flex items-center gap-3 border-l-2 border-transparent px-3 py-2 text-sm transition-colors",
                    isActive
                      ? "border-primary text-foreground font-semibold"
                      : "text-muted-foreground hover:border-muted hover:text-foreground",
                  )}
                  onClick={() => setSidebarOpen(false)}
                >
                  <span className={cn("flex h-8 w-8 items-center justify-center text-muted-foreground transition-colors", isActive && "text-primary")}>
                    <Icon className="h-4 w-4" />
                  </span>
                  <span className="flex-1">
                    <span className={cn("block", isActive ? "font-semibold" : "font-medium")}>{item.label}</span>
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

          <div className="mt-auto space-y-3">
            <div className="flex items-start gap-3">
              <div className="min-w-0">
                <p className="truncate text-sm font-medium text-muted-foreground">Logado como</p>
                <p className="truncate text-base font-semibold text-foreground">{user?.name ?? "Usuário"}</p>
                <p className="truncate text-xs uppercase tracking-wide text-muted-foreground/70">
                  {user?.role?.toLowerCase() ?? "role"}
                </p>
              </div>
            </div>
            <Button variant="ghost" size="sm" className="w-full justify-start gap-2 px-2" onClick={handleLogout}>
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
          <div className="sticky top-0 z-20 bg-white">
            <div className="flex items-start gap-3 px-4 py-3 sm:px-6 lg:px-10">
              <button
                type="button"
                aria-label="Abrir menu"
                className="mt-1 rounded-md p-2 text-muted-foreground hover:bg-muted sm:hidden"
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


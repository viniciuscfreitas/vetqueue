"use client";

import { Suspense, useMemo, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { usePathname, useSearchParams } from "next/navigation";
import { Menu, X, LogOut } from "lucide-react";

import { useAuth } from "@/contexts/AuthContext";
import { shellModules } from "@/app/modules-config";
import { Button } from "@/components/ui/button";
import { MobileBottomNav } from "@/components/MobileBottomNav";
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
  group?: "core" | "admin";
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
        group: item.group,
      }));
  }, [canAccess]);

  const urlSearchParams = searchParams?.toString() ?? "";

  const isItemActive = (item: NavigationItem) => {
    const [pathOnly, queryString] = item.href.split("?");
    return (
      pathname === pathOnly ||
      (pathname.startsWith(pathOnly) && pathOnly !== "/") ||
      (queryString !== undefined && pathname === pathOnly && urlSearchParams === queryString)
    );
  };

  const activeItemId = useMemo(
    () => navigation.find((item) => isItemActive(item))?.id,
    [navigation, pathname, urlSearchParams],
  );

  const mobileNavigation = useMemo(
    () =>
      navigation
        .filter((item) => item.group !== "admin")
        .slice(0, 4),
    [navigation],
  );

  const handleLogout = async () => {
    await logout();
  };

  return (
    <div className="min-h-screen bg-[#F3F4F6]">
      <div className="flex min-h-screen">
        {/* Slim Sidebar */}
        <aside
          className={cn(
            "fixed inset-y-0 left-0 z-40 flex w-20 flex-col items-center bg-white py-6 shadow-sm border-r border-gray-100 transition-transform duration-200",
            sidebarOpen ? "translate-x-0" : "-translate-x-full sm:translate-x-0",
          )}
          aria-label="Menu principal"
        >
          <div className="mb-10 p-2 bg-orange-500 rounded-xl shadow-lg shadow-orange-200">
             <Link href="/">
                <Image
                  src="/logo.png"
                  alt="FisioPet"
                  width={24}
                  height={24}
                  className="h-6 w-6 text-white brightness-0 invert"
                  priority
                />
             </Link>
          </div>

          <nav className="flex-1 flex flex-col gap-6 w-full px-4">
            {navigation.map((item) => {
              const isActive = isItemActive(item);
              const Icon = item.icon;
              return (
                <Link
                  key={item.id}
                  href={item.href}
                  className={cn(
                    "w-full aspect-square flex items-center justify-center rounded-xl transition-all duration-200 group",
                    isActive
                      ? "text-orange-500 bg-orange-50"
                      : "text-gray-400 hover:bg-gray-50 hover:text-orange-400",
                  )}
                  title={item.label}
                  onClick={() => setSidebarOpen(false)}
                >
                  <Icon className="w-6 h-6" />
                </Link>
              );
            })}
          </nav>

          <div className="mt-auto mb-4 flex flex-col gap-4 items-center">
             <button 
                onClick={handleLogout}
                className="text-gray-400 hover:text-red-500 transition-colors"
                title="Sair"
             >
                <LogOut className="w-5 h-5" />
             </button>
             
            <div className="p-1 rounded-full border-2 border-orange-500 overflow-hidden w-10 h-10">
              <div className="w-full h-full bg-orange-100 flex items-center justify-center text-orange-600 font-bold text-xs">
                 {user?.name?.substring(0, 2).toUpperCase() ?? "US"}
              </div>
            </div>
          </div>
        </aside>

        {sidebarOpen && (
          <div
            className="fixed inset-0 z-30 bg-black/30 backdrop-blur-sm sm:hidden"
            onClick={() => setSidebarOpen(false)}
            role="presentation"
          />
        )}

        <div className="flex min-h-screen flex-1 flex-col sm:pl-20">
           {/* Header Wrapper - Removed sticky white bg to match design */}
           <div className="px-8 pt-8 pb-4">
              {header}
           </div>
           
          <main className="flex-1 px-8 pb-10">{children}</main>
          <MobileBottomNav items={mobileNavigation} activeItemId={activeItemId} />
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


"use client";

import { ReactNode, useEffect, useMemo } from "react";
import { usePathname, useRouter } from "next/navigation";
import { AppShell } from "@/components/AppShell";
import { Header } from "@/components/Header";
import { useAuth } from "@/contexts/AuthContext";
import { Spinner } from "@/components/ui/spinner";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { cn } from "@/lib/utils";
import { ADMIN_NAV_ITEMS } from "./nav-items";
import { Settings } from "lucide-react";

export default function AdminLayout({ children }: { children: ReactNode }) {
  const { user, isLoading, canAccess } = useAuth();
  const router = useRouter();
  const pathname = usePathname();

  const featureItems = useMemo(() => {
    return ADMIN_NAV_ITEMS.filter((item) => item.module && canAccess(item.module));
  }, [canAccess]);

  const navItems = useMemo(() => {
    return ADMIN_NAV_ITEMS.filter((item) => {
      if (!item.module) {
        return featureItems.length > 0;
      }
      return canAccess(item.module);
    });
  }, [featureItems, canAccess]);

  useEffect(() => {
    if (!isLoading && !user) {
      router.replace("/login");
    }
  }, [isLoading, user, router]);

  useEffect(() => {
    if (!isLoading && user && featureItems.length === 0) {
      router.replace("/");
    }
  }, [isLoading, user, featureItems.length, router]);

  if (isLoading || !user) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Spinner size="lg" />
      </div>
    );
  }

  if (featureItems.length === 0) {
    return null;
  }

  const currentItem =
    navItems.find((item) =>
      item.href === "/admin"
        ? pathname === "/admin"
        : pathname === item.href || pathname.startsWith(`${item.href}/`),
    ) ?? navItems[0];

  const currentValue = currentItem?.href ?? "/admin";

  return (
    <AppShell
      header={
        <Header
          title="Administração"
          subtitle="Ajuste configurações essenciais com rapidez."
          subtitleClassName="text-xs whitespace-nowrap truncate"
        />
      }
    >
      <div className="space-y-4">
        <Tabs
          value={currentValue}
          onValueChange={(value) => {
            if (value !== pathname) {
              router.push(value);
            }
          }}
          className="flex flex-col gap-4"
        >
          <TabsList className="w-full justify-start overflow-x-auto bg-background/60 p-1">
            {navItems.map((item) => {
              const Icon = item.icon;
              return (
                <TabsTrigger
                  key={item.href}
                  value={item.href}
                  className={cn(
                    "flex items-center gap-2 whitespace-nowrap",
                    "data-[state=active]:bg-primary data-[state=active]:text-primary-foreground",
                  )}
                >
                  <Icon className="h-4 w-4" />
                  {item.label}
                </TabsTrigger>
              );
            })}
          </TabsList>

          <div className="rounded-lg border border-muted-foreground/20 bg-background/80 p-4 sm:p-6 shadow-sm">
            {children}
          </div>
        </Tabs>
      </div>
    </AppShell>
  );
}



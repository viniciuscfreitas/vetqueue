"use client";

import { ReactNode, useEffect, useMemo } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { Header } from "@/components/Header";
import { useAuth } from "@/contexts/AuthContext";
import { Spinner } from "@/components/ui/spinner";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";
import { ADMIN_NAV_ITEMS } from "./nav-items";

export default function AdminLayout({ children }: { children: ReactNode }) {
  const { user, isLoading, canAccess } = useAuth();
  const router = useRouter();
  const pathname = usePathname();

  const featureItems = useMemo(
    () => ADMIN_NAV_ITEMS.filter((item) => item.module && canAccess(item.module)),
    [canAccess],
  );

  const navItems = useMemo(
    () =>
      ADMIN_NAV_ITEMS.filter((item) => {
        if (!item.module) {
          return featureItems.length > 0;
        }
        return canAccess(item.module);
      }),
    [featureItems.length, canAccess],
  );

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

  return (
    <div className="min-h-screen bg-muted/30">
      <Header />
      <div className="container mx-auto px-4 py-6">
        <div className="mb-4 lg:hidden">
          <Select
            value={currentItem?.href}
            onValueChange={(value) => {
              if (value !== pathname) {
                router.push(value);
              }
            }}
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {navItems.map((item) => (
                <SelectItem key={item.href} value={item.href}>
                  {item.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="grid gap-6 lg:grid-cols-[240px_1fr]">
          <Card className="h-fit hidden lg:block">
            <CardHeader>
              <CardTitle>Administração</CardTitle>
            </CardHeader>
            <CardContent>
              <nav className="flex flex-col gap-2">
                {navItems.map((item) => {
                  const isActive = item.href === currentItem?.href;
                  const Icon = item.icon;

                  return (
                    <Button
                      key={item.href}
                      asChild
                      variant={isActive ? "default" : "ghost"}
                      className={cn(
                        "justify-start gap-2 transition-colors",
                        !isActive && "text-muted-foreground hover:text-foreground",
                      )}
                    >
                      <Link href={item.href}>
                        <Icon className="h-4 w-4" />
                        {item.label}
                      </Link>
                    </Button>
                  );
                })}
              </nav>
            </CardContent>
          </Card>

          <div className="min-w-0 space-y-6">{children}</div>
        </div>
      </div>
    </div>
  );
}



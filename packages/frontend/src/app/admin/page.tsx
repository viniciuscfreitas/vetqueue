"use client";

import Link from "next/link";
import { useMemo } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { ADMIN_NAV_ITEMS } from "./nav-items";

export default function AdminOverviewPage() {
  const { user, canAccess } = useAuth();

  const featureItems = useMemo(
    () =>
      ADMIN_NAV_ITEMS.filter((item) => item.module && canAccess(item.module)),
    [canAccess],
  );

  return (
    <section className="space-y-8">
      <div>
        <h1 className="text-3xl font-semibold tracking-tight">Administração</h1>
        <p className="mt-2 text-muted-foreground">
          {user?.name
            ? `Olá, ${user.name.split(" ")[0]}!`
            : "Controle total da operação em um só lugar."}
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        {featureItems.map((item) => {
          const Icon = item.icon;
          return (
            <Card key={item.href} className="border border-muted-foreground/30 shadow-sm">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
                <CardTitle className="text-lg font-semibold flex items-center gap-2">
                  <span className="inline-flex h-10 w-10 items-center justify-center rounded-full bg-primary/10 text-primary">
                    <Icon className="h-5 w-5" />
                  </span>
                  {item.label}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {item.description && (
                  <CardDescription>{item.description}</CardDescription>
                )}
                <Button asChild variant="outline" className="w-full justify-center">
                  <Link href={item.href}>Acessar {item.label.toLowerCase()}</Link>
                </Button>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {featureItems.length === 0 && (
        <Card>
          <CardContent className="py-6">
            <p className="text-muted-foreground">
              Você ainda não possui módulos administrativos liberados.
            </p>
          </CardContent>
        </Card>
      )}
    </section>
  );
}



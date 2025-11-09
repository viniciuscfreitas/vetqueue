"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { AppShell } from "@/components/AppShell";
import { Header } from "@/components/Header";
import { Spinner } from "@/components/ui/spinner";
import { useAuth } from "@/contexts/AuthContext";
import { ModuleKey } from "@/lib/api";
import { AuditView } from "@/components/AuditView";

export default function AuditPage() {
  const router = useRouter();
  const { user, isLoading: authLoading, canAccess } = useAuth();

  useEffect(() => {
    if (!authLoading && !user) {
      router.push("/login");
    }
  }, [authLoading, user, router]);

  useEffect(() => {
    if (!authLoading && user && !canAccess(ModuleKey.AUDIT)) {
      router.push("/");
    }
  }, [authLoading, user, canAccess, router]);

  if (authLoading || !user) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Spinner size="lg" />
      </div>
    );
  }

  if (!canAccess(ModuleKey.AUDIT)) {
    return null;
  }

  return (
    <AppShell
      header={
        <Header
          title="Auditoria"
          subtitle="Revise atividades e mantenha o time em compliance."
        />
      }
    >
      <div className="space-y-6">
        <AuditView authLoading={authLoading} />
      </div>
    </AppShell>
  );
}


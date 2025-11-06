"use client";

import { useEffect } from "react";
import { Header } from "@/components/Header";
import { useAuth } from "@/contexts/AuthContext";
import { useRouter } from "next/navigation";
import { FinancialTab } from "@/components/FinancialTab";
import { Spinner } from "@/components/ui/spinner";
import { Role } from "@/lib/api";

export default function FinancialPage() {
  const router = useRouter();
  const { user, isLoading: authLoading } = useAuth();

  useEffect(() => {
    if (!authLoading && !user) {
      router.push("/login");
      return;
    }
    if (!authLoading && user?.role !== Role.RECEPCAO) {
      router.push("/");
      return;
    }
  }, [user, authLoading, router]);

  if (authLoading || !user) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Spinner size="lg" />
      </div>
    );
  }

  if (user.role !== Role.RECEPCAO) {
    return null;
  }

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main className="container mx-auto px-4 py-6 md:px-6 md:py-8 lg:px-8 lg:py-10">
        <FinancialTab authLoading={authLoading} />
      </main>
    </div>
  );
}


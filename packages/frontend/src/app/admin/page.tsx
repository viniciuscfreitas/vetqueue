"use client";

import { useEffect } from "react";
import { Spinner } from "@/components/ui/spinner";
import { useAuth } from "@/contexts/AuthContext";
import { useRouter } from "next/navigation";
import { ADMIN_NAV_ITEMS } from "./nav-items";

export default function AdminRedirectPage() {
  const router = useRouter();
  const { user, isLoading, canAccess } = useAuth();

  useEffect(() => {
    if (isLoading) return;

    if (!user) {
      router.replace("/login");
      return;
    }

    const firstModule = ADMIN_NAV_ITEMS.find(
      (item) => item.module && canAccess(item.module),
    );

    router.replace(firstModule ? firstModule.href : "/");
  }, [isLoading, user, canAccess, router]);

  return (
    <div className="flex min-h-[200px] items-center justify-center">
      <Spinner size="lg" />
    </div>
  );
}



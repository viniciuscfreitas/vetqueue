"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { Spinner } from "@/components/ui/spinner";

export default function Home() {
  const router = useRouter();

  useEffect(() => {
    router.replace("/queue");
  }, [router]);

  return (
    <div className="flex min-h-screen items-center justify-center bg-muted/30">
      <Spinner size="lg" />
    </div>
  );
}

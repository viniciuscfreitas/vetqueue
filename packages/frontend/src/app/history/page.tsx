"use client";

import { useQuery } from "@tanstack/react-query";
import { queueApi } from "@/lib/api";
import { QueueList } from "@/components/QueueList";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useState } from "react";

export default function HistoryPage() {
  const [filters, setFilters] = useState({
    tutorName: "",
    serviceType: "",
  });

  const { data: entries = [], isLoading } = useQuery({
    queryKey: ["queue", "history", filters],
    queryFn: () =>
      queueApi
        .getHistory({
          tutorName: filters.tutorName || undefined,
          serviceType: (filters.serviceType as any) || undefined,
        })
        .then((res) => res.data),
  });

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <h1 className="text-2xl font-bold">VetQueue</h1>
            <Link href="/">
              <Button variant="outline">Voltar</Button>
            </Link>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        <h2 className="text-3xl font-bold mb-6">Histórico de Atendimentos</h2>

        <div className="mb-6 flex gap-4">
          <Input
            placeholder="Filtrar por tutor..."
            value={filters.tutorName}
            onChange={(e) =>
              setFilters({ ...filters, tutorName: e.target.value })
            }
            className="max-w-xs"
          />
        </div>

        {isLoading ? (
          <div className="text-center py-12">Carregando...</div>
        ) : (
          <QueueList entries={entries} />
        )}
      </main>
    </div>
  );
}

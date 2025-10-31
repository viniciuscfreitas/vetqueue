"use client";

import { useQuery } from "@tanstack/react-query";
import { queueApi } from "@/lib/api";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { useState } from "react";
import { useToast } from "@/components/ui/use-toast";
import { createErrorHandler } from "@/lib/errors";

export default function ReportsPage() {
  const { toast } = useToast();
  const handleError = createErrorHandler(toast);

  const [startDate, setStartDate] = useState(() => {
    const date = new Date();
    date.setDate(date.getDate() - 30);
    return date.toISOString().split("T")[0];
  });
  
  const [endDate, setEndDate] = useState(() => {
    return new Date().toISOString().split("T")[0];
  });

  const { data: stats, isLoading, isError, error } = useQuery({
    queryKey: ["queue", "reports", startDate, endDate],
    queryFn: () =>
      queueApi
        .getReports({
          startDate,
          endDate,
        })
        .then((res) => res.data),
    onError: handleError,
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
        <h2 className="text-3xl font-bold mb-6">Relatórios</h2>

        <div className="mb-6 flex gap-4 items-end">
          <div className="max-w-xs">
            <label className="text-sm font-medium mb-2 block">Data Inicial</label>
            <Input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
            />
          </div>
          <div className="max-w-xs">
            <label className="text-sm font-medium mb-2 block">Data Final</label>
            <Input
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
            />
          </div>
        </div>

        {isLoading ? (
          <div className="text-center py-12">Carregando...</div>
        ) : (
          <>
            {stats?.total === 0 && (
              <div className="text-center py-12 text-muted-foreground">
                Nenhum atendimento encontrado no período selecionado
              </div>
            )}
            {stats && stats.total > 0 && (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card>
              <CardHeader>
                <CardTitle>Total de Atendimentos</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-3xl font-bold">{stats?.total || 0}</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Tempo Médio de Espera</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-3xl font-bold">
                  {stats?.avgWaitTimeMinutes || 0} min
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Por Tipo de Serviço</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {stats?.byService &&
                    Object.entries(stats.byService).map(([service, count]) => (
                      <div key={service} className="flex justify-between">
                        <span>{service}</span>
                        <span className="font-bold">{count as number}</span>
                      </div>
                    ))}
                </div>
              </CardContent>
            </Card>
          </div>
        )}
          </>
        )}
      </main>
    </div>
  );
}


"use client";

import { useQuery } from "@tanstack/react-query";
import { queueApi } from "@/lib/api";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function ReportsPage() {
  const { data: stats, isLoading } = useQuery({
    queryKey: ["queue", "reports"],
    queryFn: () => queueApi.getReports().then((res) => res.data),
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

        {isLoading ? (
          <div className="text-center py-12">Carregando...</div>
        ) : (
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
      </main>
    </div>
  );
}


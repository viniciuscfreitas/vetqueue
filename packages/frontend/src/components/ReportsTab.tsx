"use client";

import { useQuery } from "@tanstack/react-query";
import { queueApi, ReportStats } from "@/lib/api";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { useDateRange } from "@/hooks/useDateRange";

interface ReportsTabProps {
  authLoading: boolean;
}

export function ReportsTab({ authLoading }: ReportsTabProps) {
  const { startDate, endDate, setStartDate, setEndDate } = useDateRange();

  const { data: stats, isLoading: isLoadingReports } = useQuery<ReportStats>({
    queryKey: ["queue", "reports", startDate, endDate],
    queryFn: () =>
      queueApi
        .getReports({
          startDate,
          endDate,
        })
        .then((res) => res.data),
    enabled: !authLoading,
  });

  return (
    <div className="space-y-6">
      <div className="space-y-4">
        <div>
          <h2 className="text-xl font-semibold">Relatórios</h2>
          <p className="text-sm text-muted-foreground mt-1">
            Estatísticas e métricas de atendimentos
          </p>
        </div>

        <Card>
          <CardContent className="pt-4">
            <div className="flex flex-wrap gap-3 items-end">
              <div className="min-w-0">
                <Label htmlFor="reportsStartDate" className="text-xs mb-1 block text-muted-foreground">
                  Inicial
                </Label>
                <Input
                  id="reportsStartDate"
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                />
              </div>
              <div className="min-w-0">
                <Label htmlFor="reportsEndDate" className="text-xs mb-1 block text-muted-foreground">
                  Final
                </Label>
                <Input
                  id="reportsEndDate"
                  type="date"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {isLoadingReports ? (
        <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className={i === 1 ? "md:col-span-2" : i === 2 ? "md:col-span-2" : "md:col-span-1"}>
              <Card>
                <CardHeader>
                  <Skeleton className="h-6 w-32" />
                </CardHeader>
                <CardContent>
                  <Skeleton className="h-10 w-24" />
                </CardContent>
              </Card>
            </div>
          ))}
        </div>
      ) : (
        <>
          {stats?.total === 0 ? (
            <Card>
              <CardContent className="pt-6">
                <div className="text-center py-8">
                  <p className="text-muted-foreground">
                    Nenhum atendimento encontrado no período selecionado
                  </p>
                </div>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
                <div className="md:col-span-2">
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-base">Total de Atendimentos</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <p className="text-3xl font-bold">{stats?.total || 0}</p>
                      <p className="text-xs text-muted-foreground mt-2">
                        Período selecionado
                      </p>
                    </CardContent>
                  </Card>
                </div>

                <div className="md:col-span-2">
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-base">Tempo Médio de Espera</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <p className="text-3xl font-bold">
                        {stats?.avgWaitTimeMinutes || 0}
                        <span className="text-lg text-muted-foreground ml-1">min</span>
                      </p>
                      <p className="text-xs text-muted-foreground mt-2">
                        Média entre todos os atendimentos
                      </p>
                    </CardContent>
                  </Card>
                </div>

                <div className="md:col-span-1">
                  <Card className="max-h-[200px] flex flex-col">
                    <CardHeader className="flex-shrink-0">
                      <CardTitle className="text-base">Distribuição por Serviço</CardTitle>
                    </CardHeader>
                    <CardContent className="flex-1 overflow-y-auto min-h-0">
                      <div className="space-y-3">
                        {stats?.byService &&
                          Object.entries(stats.byService)
                            .sort(([, a], [, b]) => (b as number) - (a as number))
                            .map(([service, count]) => (
                              <div
                                key={service}
                                className="flex items-center justify-between pb-2 border-b last:border-0"
                              >
                                <span className="text-sm">{service}</span>
                                <span className="text-lg font-semibold">
                                  {count as number}
                                </span>
                              </div>
                            ))}
                      </div>
                    </CardContent>
                  </Card>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
                <div className="md:col-span-2">
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-base">Tempo Médio de Atendimento</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <p className="text-3xl font-bold">
                        {stats?.avgServiceTimeMinutes || 0}
                        <span className="text-lg text-muted-foreground ml-1">min</span>
                      </p>
                      <p className="text-xs text-muted-foreground mt-2">
                        Média do tempo de atendimento
                      </p>
                    </CardContent>
                  </Card>
                </div>

                <div className="md:col-span-2">
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-base">Taxa de Cancelamento</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <p className="text-3xl font-bold">
                        {stats?.cancellationRate != null ? stats.cancellationRate.toFixed(1) : 0}
                        <span className="text-lg text-muted-foreground ml-1">%</span>
                      </p>
                      <p className="text-xs text-muted-foreground mt-2">
                        Cancelados no período
                      </p>
                    </CardContent>
                  </Card>
                </div>

                <div className="md:col-span-1">
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-base">Atendimentos por Dia</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <p className="text-3xl font-bold">
                        {stats?.avgPerDay != null ? stats.avgPerDay.toFixed(1) : 0}
                      </p>
                      <p className="text-xs text-muted-foreground mt-2">
                        Média diária no período
                      </p>
                    </CardContent>
                  </Card>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
                <div className="md:col-span-2">
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-base">Top 3 Veterinários</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-3">
                        {stats?.topVets && stats.topVets.length > 0 ? (
                          stats.topVets.map((vet, index) => (
                            <div
                              key={index}
                              className="flex items-center justify-between pb-2 border-b last:border-0"
                            >
                              <span className="text-sm">{vet.name}</span>
                              <span className="text-lg font-semibold">
                                {vet.count}
                              </span>
                            </div>
                          ))
                        ) : (
                          <p className="text-sm text-muted-foreground">
                            Nenhum veterinário encontrado
                          </p>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                </div>

                <div className="md:col-span-3">
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-base">Distribuição por Prioridade</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-3">
                        <div className="flex items-center justify-between pb-2 border-b">
                          <span className="text-sm">Emergência</span>
                          <span className="text-lg font-semibold">
                            {stats?.byPriority?.emergency || 0}
                          </span>
                        </div>
                        <div className="flex items-center justify-between pb-2 border-b">
                          <span className="text-sm">Alta</span>
                          <span className="text-lg font-semibold">
                            {stats?.byPriority?.high || 0}
                          </span>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-sm">Normal</span>
                          <span className="text-lg font-semibold">
                            {stats?.byPriority?.normal || 0}
                          </span>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}


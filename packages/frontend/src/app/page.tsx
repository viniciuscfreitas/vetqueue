"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { queueApi, ServiceType } from "@/lib/api";
import { QueueList } from "@/components/QueueList";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/use-toast";
import { createErrorHandler } from "@/lib/errors";
import { useEffect, useState } from "react";
import { Header } from "@/components/Header";
import { AddQueueFormInline } from "@/components/AddQueueFormInline";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { SERVICE_TYPE_OPTIONS } from "@/lib/constants";

export default function Home() {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const handleError = createErrorHandler(toast);

  const { data: entries = [], isLoading, isError, error } = useQuery({
    queryKey: ["queue", "active"],
    queryFn: () => queueApi.listActive().then((res) => res.data),
    refetchInterval: (query) => (query.state.error ? false : 3000),
  });

  useEffect(() => {
    if (isError && error) {
      handleError(error);
    }
  }, [isError, error, handleError]);

  const callNextMutation = useMutation({
    mutationFn: () => queueApi.callNext().then((res) => res.data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["queue"] });
    },
    onError: handleError,
  });

  const startServiceMutation = useMutation({
    mutationFn: (id: string) => queueApi.startService(id).then((res) => res.data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["queue"] });
    },
    onError: handleError,
  });

  const completeServiceMutation = useMutation({
    mutationFn: (id: string) =>
      queueApi.completeService(id).then((res) => res.data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["queue"] });
    },
    onError: handleError,
  });

  const cancelEntryMutation = useMutation({
    mutationFn: (id: string) => queueApi.cancelEntry(id).then((res) => res.data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["queue"] });
    },
    onError: handleError,
  });

  const handleCallNext = () => {
    callNextMutation.mutate();
  };

  const handleStart = (id: string) => {
    startServiceMutation.mutate(id);
  };

  const handleComplete = (id: string) => {
    completeServiceMutation.mutate(id);
  };

  const handleCancel = (id: string) => {
    if (confirm("Tem certeza que deseja cancelar esta entrada?")) {
      cancelEntryMutation.mutate(id);
    }
  };

  const [historyStartDate, setHistoryStartDate] = useState(() => {
    const date = new Date();
    date.setDate(date.getDate() - 30);
    return date.toISOString().split("T")[0];
  });

  const [historyEndDate, setHistoryEndDate] = useState(() => {
    return new Date().toISOString().split("T")[0];
  });

  const [historyFilters, setHistoryFilters] = useState({
    tutorName: "",
    serviceType: undefined as ServiceType | undefined,
  });

  const { data: historyEntries = [], isLoading: isLoadingHistory } = useQuery({
    queryKey: ["queue", "history", historyStartDate, historyEndDate, historyFilters],
    queryFn: () =>
      queueApi
        .getHistory({
          startDate: historyStartDate,
          endDate: historyEndDate,
          tutorName: historyFilters.tutorName || undefined,
          serviceType: historyFilters.serviceType || undefined,
        })
        .then((res) => res.data),
  });

  const [reportsStartDate, setReportsStartDate] = useState(() => {
    const date = new Date();
    date.setDate(date.getDate() - 30);
    return date.toISOString().split("T")[0];
  });

  const [reportsEndDate, setReportsEndDate] = useState(() => {
    return new Date().toISOString().split("T")[0];
  });

  const { data: stats, isLoading: isLoadingReports } = useQuery({
    queryKey: ["queue", "reports", reportsStartDate, reportsEndDate],
    queryFn: () =>
      queueApi
        .getReports({
          startDate: reportsStartDate,
          endDate: reportsEndDate,
        })
        .then((res) => res.data),
  });

  return (
    <div className="min-h-screen bg-background">
      <Header />

      <main className="container mx-auto px-4 py-6">
        <Tabs defaultValue="queue" className="space-y-4">
          <TabsList>
            <TabsTrigger value="queue">Fila</TabsTrigger>
            <TabsTrigger value="history">Histórico</TabsTrigger>
            <TabsTrigger value="reports">Relatórios</TabsTrigger>
          </TabsList>

          <TabsContent value="queue" className="space-y-4">
            <div>
              <h2 className="text-2xl font-bold mb-4">Adicionar à Fila</h2>
              <AddQueueFormInline
                onSuccess={() => {
                  queryClient.invalidateQueries({ queryKey: ["queue"] });
                }}
              />
            </div>

            <div className="flex items-center justify-between mb-4">
              <h2 className="text-2xl font-bold">Fila Atual</h2>
              <Button
                onClick={handleCallNext}
                disabled={callNextMutation.isPending}
                size="lg"
              >
                {callNextMutation.isPending ? "Chamando..." : "Chamar Próximo"}
              </Button>
            </div>

        {isLoading ? (
          <div className="text-center py-12">Carregando...</div>
        ) : isError ? (
          <div className="text-center py-12 text-destructive">
            Erro ao carregar fila. Tente recarregar a página.
          </div>
        ) : (
          <QueueList
            entries={entries}
            onStart={handleStart}
            onComplete={handleComplete}
            onCancel={handleCancel}
          />
        )}
          </TabsContent>

          <TabsContent value="history" className="space-y-4">
            <h2 className="text-2xl font-bold mb-4">Histórico de Atendimentos</h2>

            <div className="bg-card p-4 rounded-lg border">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-4">
                <div>
                  <Label htmlFor="historyStartDate" className="text-xs mb-1 block">
                    Data Inicial
                  </Label>
                  <Input
                    id="historyStartDate"
                    type="date"
                    value={historyStartDate}
                    onChange={(e) => setHistoryStartDate(e.target.value)}
                    className="h-9"
                  />
                </div>
                <div>
                  <Label htmlFor="historyEndDate" className="text-xs mb-1 block">
                    Data Final
                  </Label>
                  <Input
                    id="historyEndDate"
                    type="date"
                    value={historyEndDate}
                    onChange={(e) => setHistoryEndDate(e.target.value)}
                    className="h-9"
                  />
                </div>
                <div>
                  <Label htmlFor="historyTutorName" className="text-xs mb-1 block">
                    Tutor
                  </Label>
                  <Input
                    id="historyTutorName"
                    placeholder="Filtrar por tutor..."
                    value={historyFilters.tutorName}
                    onChange={(e) =>
                      setHistoryFilters({ ...historyFilters, tutorName: e.target.value })
                    }
                    className="h-9"
                  />
                </div>
                <div>
                  <Label htmlFor="historyServiceType" className="text-xs mb-1 block">
                    Tipo de Serviço
                  </Label>
                  <Select
                    value={historyFilters.serviceType}
                    onValueChange={(value) =>
                      setHistoryFilters({
                        ...historyFilters,
                        serviceType: value as ServiceType,
                      })
                    }
                  >
                    <SelectTrigger className="h-9">
                      <SelectValue placeholder="Todos" />
                    </SelectTrigger>
                    <SelectContent>
                      {SERVICE_TYPE_OPTIONS.map((option) => (
                        <SelectItem key={option.value} value={option.value}>
                          {option.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>

            {isLoadingHistory ? (
              <div className="text-center py-12">Carregando...</div>
            ) : (
              <QueueList
                entries={historyEntries}
                emptyMessage="Nenhum atendimento concluído"
              />
            )}
          </TabsContent>

          <TabsContent value="reports" className="space-y-4">
            <h2 className="text-2xl font-bold mb-4">Relatórios</h2>

            <div className="bg-card p-4 rounded-lg border mb-4">
              <div className="flex gap-3">
                <div className="flex-1">
                  <Label htmlFor="reportsStartDate" className="text-xs mb-1 block">
                    Data Inicial
                  </Label>
                  <Input
                    id="reportsStartDate"
                    type="date"
                    value={reportsStartDate}
                    onChange={(e) => setReportsStartDate(e.target.value)}
                    className="h-9"
                  />
                </div>
                <div className="flex-1">
                  <Label htmlFor="reportsEndDate" className="text-xs mb-1 block">
                    Data Final
                  </Label>
                  <Input
                    id="reportsEndDate"
                    type="date"
                    value={reportsEndDate}
                    onChange={(e) => setReportsEndDate(e.target.value)}
                    className="h-9"
                  />
                </div>
              </div>
            </div>

            {isLoadingReports ? (
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
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
}

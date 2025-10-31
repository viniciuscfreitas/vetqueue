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
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Skeleton } from "@/components/ui/skeleton";
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
    setEntryToCancel(id);
    setCancelDialogOpen(true);
  };

  const confirmCancel = () => {
    if (entryToCancel) {
      cancelEntryMutation.mutate(entryToCancel);
      setCancelDialogOpen(false);
      setEntryToCancel(null);
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

  const [cancelDialogOpen, setCancelDialogOpen] = useState(false);
  const [entryToCancel, setEntryToCancel] = useState<string | null>(null);

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

  const hasActiveFilters = historyFilters.tutorName || historyFilters.serviceType;

  return (
    <div className="min-h-screen bg-background">
      <Header />

      <main className="container mx-auto px-4 py-6">
        <Tabs defaultValue="queue" className="space-y-6">
          <TabsList className="grid w-full grid-cols-3 h-auto">
            <TabsTrigger
              value="queue"
              className="data-[state=active]:font-semibold py-2.5 text-sm sm:text-base"
            >
              Fila
            </TabsTrigger>
            <TabsTrigger
              value="history"
              className="data-[state=active]:font-semibold py-2.5 text-sm sm:text-base"
            >
              Histórico
            </TabsTrigger>
            <TabsTrigger
              value="reports"
              className="data-[state=active]:font-semibold py-2.5 text-sm sm:text-base"
            >
              Relatórios
            </TabsTrigger>
          </TabsList>

          <TabsContent value="queue" className="space-y-6">
            <div className="space-y-4">
              <div>
                <h2 className="text-xl font-semibold mb-4">Adicionar à Fila</h2>
                <AddQueueFormInline
                  onSuccess={() => {
                    queryClient.invalidateQueries({ queryKey: ["queue"] });
                  }}
                />
              </div>
            </div>

            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-xl font-semibold">Fila Atual</h2>
                  {!isLoading && !isError && (
                    <p className="text-sm text-muted-foreground mt-1">
                      {entries.length} {entries.length === 1 ? "entrada" : "entradas"} na fila
                    </p>
                  )}
                </div>
                <Button
                  onClick={handleCallNext}
                  disabled={callNextMutation.isPending || entries.length === 0}
                  size="lg"
                >
                  {callNextMutation.isPending ? "Chamando..." : "Chamar Próximo"}
                </Button>
              </div>

              {isLoading ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {[1, 2, 3].map((i) => (
                    <Card key={i}>
                      <CardHeader>
                        <Skeleton className="h-6 w-32" />
                      </CardHeader>
                      <CardContent className="space-y-2">
                        <Skeleton className="h-4 w-full" />
                        <Skeleton className="h-4 w-3/4" />
                        <Skeleton className="h-8 w-20" />
                      </CardContent>
                    </Card>
                  ))}
                </div>
              ) : isError ? (
                <Card>
                  <CardContent className="pt-6">
                    <div className="text-center space-y-2">
                      <p className="text-destructive font-medium">
                        Erro ao carregar fila
                      </p>
                      <p className="text-sm text-muted-foreground">
                        Não foi possível carregar a fila. Verifique sua conexão e tente novamente.
                      </p>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => queryClient.invalidateQueries({ queryKey: ["queue"] })}
                        className="mt-4"
                      >
                        Tentar novamente
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ) : (
                <QueueList
                  entries={entries}
                  onStart={handleStart}
                  onComplete={handleComplete}
                  onCancel={handleCancel}
                />
              )}
            </div>
          </TabsContent>

          <TabsContent value="history" className="space-y-6">
            <div className="space-y-4">
              <div>
                <h2 className="text-xl font-semibold">Histórico de Atendimentos</h2>
                <p className="text-sm text-muted-foreground mt-1">
                  Consulte atendimentos concluídos e filtrados
                </p>
              </div>

              <Card>
                <CardContent className="pt-6">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="historyStartDate" className="text-sm mb-2 block font-medium">
                        Data Inicial
                      </Label>
                      <Input
                        id="historyStartDate"
                        type="date"
                        value={historyStartDate}
                        onChange={(e) => setHistoryStartDate(e.target.value)}
                      />
                    </div>
                    <div>
                      <Label htmlFor="historyEndDate" className="text-sm mb-2 block font-medium">
                        Data Final
                      </Label>
                      <Input
                        id="historyEndDate"
                        type="date"
                        value={historyEndDate}
                        onChange={(e) => setHistoryEndDate(e.target.value)}
                      />
                    </div>
                    <div>
                      <Label htmlFor="historyTutorName" className="text-sm mb-2 block font-medium">
                        Tutor
                      </Label>
                      <Input
                        id="historyTutorName"
                        placeholder="Nome do tutor..."
                        value={historyFilters.tutorName}
                        onChange={(e) =>
                          setHistoryFilters({ ...historyFilters, tutorName: e.target.value })
                        }
                      />
                    </div>
                    <div>
                      <Label htmlFor="historyServiceType" className="text-sm mb-2 block font-medium">
                        Tipo de Serviço
                      </Label>
                      <Select
                        value={historyFilters.serviceType || undefined}
                        onValueChange={(value) =>
                          setHistoryFilters({
                            ...historyFilters,
                            serviceType: value as ServiceType,
                          })
                        }
                      >
                        <SelectTrigger>
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
                  {hasActiveFilters && (
                    <div className="mt-4 pt-4 border-t">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() =>
                          setHistoryFilters({ tutorName: "", serviceType: undefined })
                        }
                      >
                        Limpar filtros
                      </Button>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>

            {isLoadingHistory ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {[1, 2, 3].map((i) => (
                  <Card key={i}>
                    <CardHeader>
                      <Skeleton className="h-6 w-32" />
                    </CardHeader>
                    <CardContent className="space-y-2">
                      <Skeleton className="h-4 w-full" />
                      <Skeleton className="h-4 w-3/4" />
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : (
              <div className="space-y-4">
                {historyEntries.length > 0 && (
                  <p className="text-sm text-muted-foreground">
                    {historyEntries.length}{" "}
                    {historyEntries.length === 1
                      ? "atendimento encontrado"
                      : "atendimentos encontrados"}
                  </p>
                )}
                <QueueList
                  entries={historyEntries}
                  emptyMessage={
                    hasActiveFilters
                      ? "Nenhum atendimento encontrado com os filtros aplicados"
                      : "Nenhum atendimento concluído no período selecionado"
                  }
                />
              </div>
            )}
          </TabsContent>

          <TabsContent value="reports" className="space-y-6">
            <div className="space-y-4">
              <div>
                <h2 className="text-xl font-semibold">Relatórios</h2>
                <p className="text-sm text-muted-foreground mt-1">
                  Estatísticas e métricas de atendimentos
                </p>
              </div>

              <Card>
                <CardContent className="pt-6">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="reportsStartDate" className="text-sm mb-2 block font-medium">
                        Data Inicial
                      </Label>
                      <Input
                        id="reportsStartDate"
                        type="date"
                        value={reportsStartDate}
                        onChange={(e) => setReportsStartDate(e.target.value)}
                      />
                    </div>
                    <div>
                      <Label htmlFor="reportsEndDate" className="text-sm mb-2 block font-medium">
                        Data Final
                      </Label>
                      <Input
                        id="reportsEndDate"
                        type="date"
                        value={reportsEndDate}
                        onChange={(e) => setReportsEndDate(e.target.value)}
                      />
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {isLoadingReports ? (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {[1, 2, 3].map((i) => (
                  <Card key={i}>
                    <CardHeader>
                      <Skeleton className="h-6 w-32" />
                    </CardHeader>
                    <CardContent>
                      <Skeleton className="h-10 w-24" />
                    </CardContent>
                  </Card>
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
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
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

                      <Card>
                        <CardHeader>
                          <CardTitle className="text-base">Distribuição por Serviço</CardTitle>
                        </CardHeader>
                        <CardContent>
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
                )}
              </>
            )}
          </TabsContent>
        </Tabs>
      </main>

      <AlertDialog open={cancelDialogOpen} onOpenChange={setCancelDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Cancelar entrada da fila?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta ação não pode ser desfeita. A entrada será removida permanentemente da fila.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Manter</AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmCancel}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Cancelar entrada
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { queueApi, Status, serviceApi } from "@/lib/api";
import { QueueList } from "@/components/QueueList";
import { Pagination } from "@/components/Pagination";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/use-toast";
import { createErrorHandler } from "@/lib/errors";
import { useEffect, useState } from "react";
import { Header } from "@/components/Header";
import { AddQueueFormInline } from "@/components/AddQueueFormInline";
import { useAuth } from "@/contexts/AuthContext";
import { useRouter } from "next/navigation";
import { RoomSelectModal } from "@/components/RoomSelectModal";
import { Role } from "@/lib/api";
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
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Skeleton } from "@/components/ui/skeleton";
import { Plus } from "lucide-react";

function formatDateLocal(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function getDefaultDates() {
  const today = new Date();
  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(today.getDate() - 30);
  return {
    start: formatDateLocal(thirtyDaysAgo),
    end: formatDateLocal(today),
  };
}

export default function Home() {
  const router = useRouter();
  const { user, currentRoom, isLoading: authLoading } = useAuth();
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const handleError = createErrorHandler(toast);
  const [showRoomModal, setShowRoomModal] = useState(false);
  const [showAddQueueModal, setShowAddQueueModal] = useState(false);
  const [entryToCall, setEntryToCall] = useState<string | null>(null);

  const defaultDates = getDefaultDates();
  const [historyStartDate, setHistoryStartDate] = useState(defaultDates.start);
  const [historyEndDate, setHistoryEndDate] = useState(defaultDates.end);
  const [historyFilters, setHistoryFilters] = useState({
    tutorName: "",
    patientName: "",
    serviceType: "__ALL__",
  });
  const [historyPage, setHistoryPage] = useState(1);

  const [cancelDialogOpen, setCancelDialogOpen] = useState(false);
  const [entryToCancel, setEntryToCancel] = useState<string | null>(null);

  const [callNextConfirmDialogOpen, setCallNextConfirmDialogOpen] = useState(false);

  const [reportsStartDate, setReportsStartDate] = useState(defaultDates.start);
  const [reportsEndDate, setReportsEndDate] = useState(defaultDates.end);

  const { data: entries = [], isLoading, isError, error } = useQuery({
    queryKey: ["queue", "active", user?.role === "VET" ? user.id : undefined],
    queryFn: () => queueApi.listActive(
      user?.role === "VET" ? user.id : undefined
    ).then((res) => res.data),
    refetchInterval: (query) => (query.state.error ? false : 3000),
    enabled: !authLoading && !!user,
  });

  const { data: historyData, isLoading: isLoadingHistory } = useQuery({
    queryKey: ["queue", "history", historyStartDate, historyEndDate, historyFilters, historyPage],
    queryFn: () =>
      queueApi
        .getHistory({
          startDate: historyStartDate,
          endDate: historyEndDate,
          tutorName: historyFilters.tutorName || undefined,
          patientName: historyFilters.patientName || undefined,
          serviceType: historyFilters.serviceType === "__ALL__" ? undefined : historyFilters.serviceType,
          page: historyPage,
          limit: 20,
        })
        .then((res) => res.data),
    enabled: !authLoading && !!user,
  });

  const historyEntries = Array.isArray(historyData) ? historyData : (historyData?.entries || []);
  const historyPaginated = Array.isArray(historyData) ? null : historyData;

  const { data: services = [] } = useQuery({
    queryKey: ["services"],
    queryFn: () => serviceApi.list().then((res) => res.data),
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
    enabled: !authLoading && !!user,
  });

  const callNextMutation = useMutation({
    mutationFn: (roomId: string) => queueApi.callNext(roomId, user?.role === Role.VET ? user.id : undefined).then((res) => res.data),
    onSuccess: (data) => {
      if ("message" in data) {
        toast({
          variant: "default",
          title: "Fila vazia",
          description: data.message,
        });
      } else {
        toast({
          variant: "default",
          title: "Paciente chamado",
          description: `${data.patientName} foi chamado com sucesso`,
        });
      }
      queryClient.invalidateQueries({ queryKey: ["queue"] });
      setShowRoomModal(false);
    },
    onError: handleError,
  });

  const callPatientMutation = useMutation({
    mutationFn: ({ entryId, roomId }: { entryId: string; roomId: string }) => 
      queueApi.callPatient(entryId, roomId, user?.role === Role.VET ? user.id : undefined).then((res) => res.data),
    onSuccess: (data) => {
      toast({
        variant: "default",
        title: "Paciente chamado",
        description: `${data.patientName} foi chamado com sucesso`,
      });
      queryClient.invalidateQueries({ queryKey: ["queue"] });
      setShowRoomModal(false);
    },
    onError: handleError,
  });

  const startServiceMutation = useMutation({
    mutationFn: (id: string) => queueApi.startService(id).then((res) => res.data),
    onSuccess: () => {
      toast({
        variant: "default",
        title: "Atendimento iniciado",
        description: "O atendimento foi iniciado com sucesso",
      });
      queryClient.invalidateQueries({ queryKey: ["queue"] });
    },
    onError: handleError,
  });

  const completeServiceMutation = useMutation({
    mutationFn: (id: string) =>
      queueApi.completeService(id).then((res) => res.data),
    onSuccess: () => {
      toast({
        variant: "default",
        title: "Atendimento finalizado",
        description: "O atendimento foi concluído com sucesso",
      });
      queryClient.invalidateQueries({ queryKey: ["queue"] });
    },
    onError: handleError,
  });

  const cancelEntryMutation = useMutation({
    mutationFn: (id: string) => queueApi.cancelEntry(id).then((res) => res.data),
    onSuccess: () => {
      toast({
        variant: "default",
        title: "Entrada cancelada",
        description: "A entrada foi removida da fila",
      });
      queryClient.invalidateQueries({ queryKey: ["queue"] });
    },
    onError: handleError,
  });

  useEffect(() => {
    if (!authLoading && !user) {
      router.push("/login");
    }
  }, [user, authLoading, router]);

  useEffect(() => {
    if (isError && error) {
      handleError(error);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isError, error]);

  const handleCallNext = () => {
    if (user?.role !== Role.RECEPCAO) {
      const activeEntries = entries.filter((e) => e.status === Status.IN_PROGRESS || e.status === Status.CALLED);
      
      if (activeEntries.length > 0) {
        setCallNextConfirmDialogOpen(true);
        return;
      }
    }

    if (currentRoom) {
      callNextMutation.mutate(currentRoom.id);
    } else {
      setShowRoomModal(true);
    }
  };

  const handleStart = (id: string) => {
    startServiceMutation.mutate(id);
  };

  const handleComplete = (id: string) => {
    completeServiceMutation.mutate(id);
  };

  const handleCall = (entryId: string) => {
    if (currentRoom) {
      callPatientMutation.mutate({ entryId, roomId: currentRoom.id });
    } else {
      setEntryToCall(entryId);
      setShowRoomModal(true);
    }
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

  const handleConfirmCallNext = () => {
    setCallNextConfirmDialogOpen(false);
    if (currentRoom) {
      callNextMutation.mutate(currentRoom.id);
    } else {
      setShowRoomModal(true);
    }
  };

  useEffect(() => {
    setHistoryPage(1);
  }, [historyStartDate, historyEndDate, historyFilters]);

  const hasActiveFilters = historyFilters.tutorName || historyFilters.patientName || (historyFilters.serviceType && historyFilters.serviceType !== "__ALL__");

  const waitingCount = entries.filter((entry) => entry.status === Status.WAITING).length;
  const activeEntries = entries.filter((e) => e.status === Status.IN_PROGRESS || e.status === Status.CALLED);

  if (authLoading || !user) {
    return <div className="min-h-screen flex items-center justify-center">Carregando...</div>;
  }

  return (
    <div className="min-h-screen bg-background">
      <Header />

      <main className="container mx-auto px-4 py-8">
        <Tabs defaultValue="queue" className="space-y-8">
          <TabsList className={`grid w-full h-auto ${user?.role === Role.RECEPCAO ? 'grid-cols-3' : 'grid-cols-1'}`}>
            <TabsTrigger
              value="queue"
              className="data-[state=active]:font-semibold py-2.5 text-sm sm:text-base"
            >
              Fila
            </TabsTrigger>
            {user?.role === Role.RECEPCAO && (
              <>
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
              </>
            )}
          </TabsList>

          <TabsContent value="queue" className="space-y-6 mt-6">
            <div className="space-y-4">
              <div className="flex items-center justify-between gap-4">
                <div>
                  <h2 className="text-xl font-semibold">Fila Atual</h2>
                  {!isLoading && !isError && (
                    <p className="text-sm text-muted-foreground mt-1">
                      {entries.length} {entries.length === 1 ? "entrada" : "entradas"} na fila
                      {waitingCount > 0 && (
                        <span className="ml-2 inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-amber-100 text-amber-800">
                          {waitingCount} aguardando
                        </span>
                      )}
                    </p>
                  )}
                </div>
                <div className="flex gap-2">
                  {user?.role === Role.RECEPCAO && (
                    <Button
                      onClick={() => setShowAddQueueModal(true)}
                      variant="outline"
                      size="lg"
                      className="px-6 py-6 text-base"
                    >
                      <Plus className="mr-2 h-5 w-5" />
                      Adicionar
                    </Button>
                  )}
                  <Button
                    onClick={handleCallNext}
                    disabled={callNextMutation.isPending || waitingCount === 0}
                    size="lg"
                    className="bg-blue-600 hover:bg-blue-700 text-white font-semibold px-6 py-6 text-base shadow-lg hover:shadow-xl transition-all"
                  >
                    {callNextMutation.isPending ? (
                      "Chamando..."
                    ) : waitingCount > 0 ? (
                      <span className="flex items-center gap-2">
                        <span>Chamar Próximo</span>
                        <span className="bg-white/20 px-2 py-0.5 rounded-full text-sm font-bold">
                          {waitingCount}
                        </span>
                      </span>
                    ) : (
                      "Nenhum aguardando"
                    )}
                  </Button>
                </div>
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
                  onCancel={user?.role === Role.RECEPCAO ? handleCancel : undefined}
                  onCall={(user?.role === Role.RECEPCAO || user?.role === Role.VET) ? handleCall : undefined}
                />
              )}
            </div>
          </TabsContent>

          {user?.role === Role.RECEPCAO && (
            <>
              <TabsContent value="history" className="space-y-6 mt-6">
            <div className="space-y-4">
              <div>
                <h2 className="text-xl font-semibold">Histórico de Atendimentos</h2>
                <p className="text-sm text-muted-foreground mt-1">
                  Consulte atendimentos concluídos e filtrados
                </p>
              </div>

              <Card>
                <CardContent className="pt-4">
                  <div className="flex flex-wrap gap-3 items-end">
                    <div className="min-w-0">
                      <Label htmlFor="historyStartDate" className="text-xs mb-1 block text-muted-foreground">
                        Inicial
                      </Label>
                      <Input
                        id="historyStartDate"
                        type="date"
                        value={historyStartDate}
                        onChange={(e) => setHistoryStartDate(e.target.value)}
                        className="w-[130px]"
                      />
                    </div>
                    <div className="min-w-0">
                      <Label htmlFor="historyEndDate" className="text-xs mb-1 block text-muted-foreground">
                        Final
                      </Label>
                      <Input
                        id="historyEndDate"
                        type="date"
                        value={historyEndDate}
                        onChange={(e) => setHistoryEndDate(e.target.value)}
                        className="w-[130px]"
                      />
                    </div>
                    <div className="min-w-0">
                      <Label htmlFor="historyServiceType" className="text-xs mb-1 block text-muted-foreground">
                        Serviço
                      </Label>
                      <Select
                        value={historyFilters.serviceType}
                        onValueChange={(value) =>
                          setHistoryFilters({
                            ...historyFilters,
                            serviceType: value,
                          })
                        }
                      >
                        <SelectTrigger className="w-[140px]">
                          <SelectValue placeholder="Todos" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="__ALL__">Todos</SelectItem>
                          {services.map((service) => (
                            <SelectItem key={service.id} value={service.name}>
                              {service.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="min-w-0 flex-1 min-w-[180px]">
                      <Label htmlFor="historyPatientName" className="text-xs mb-1 block text-muted-foreground">
                        Pet
                      </Label>
                      <Input
                        id="historyPatientName"
                        placeholder="Nome do pet..."
                        value={historyFilters.patientName}
                        onChange={(e) =>
                          setHistoryFilters({ ...historyFilters, patientName: e.target.value })
                        }
                        className="w-full"
                      />
                    </div>
                    <div className="min-w-0 flex-1 min-w-[180px]">
                      <Label htmlFor="historyTutorName" className="text-xs mb-1 block text-muted-foreground">
                        Tutor
                      </Label>
                      <Input
                        id="historyTutorName"
                        placeholder="Nome do tutor..."
                        value={historyFilters.tutorName}
                        onChange={(e) =>
                          setHistoryFilters({ ...historyFilters, tutorName: e.target.value })
                        }
                        className="w-full"
                      />
                    </div>
                    {hasActiveFilters && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() =>
                          setHistoryFilters({ tutorName: "", patientName: "", serviceType: "__ALL__" })
                        }
                        className="h-10"
                      >
                        Limpar
                      </Button>
                    )}
                  </div>
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
              <>
                <div className="space-y-4">
                  {historyEntries.length > 0 && (
                    <p className="text-sm text-muted-foreground">
                      {historyPaginated ? `${historyPaginated.total} atendimentos encontrados` : `${historyEntries.length} atendimentos encontrados`}
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
                {historyPaginated && (
                  <Pagination
                    currentPage={historyPaginated.page}
                    totalPages={historyPaginated.totalPages}
                    total={historyPaginated.total}
                    onPageChange={setHistoryPage}
                  />
                )}
              </>
            )}
          </TabsContent>

          <TabsContent value="reports" className="space-y-6 mt-6">
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
                        Data Inicial
                      </Label>
                      <Input
                        id="reportsStartDate"
                        type="date"
                        value={reportsStartDate}
                        onChange={(e) => setReportsStartDate(e.target.value)}
                        className="w-[140px]"
                      />
                    </div>
                    <div className="min-w-0">
                      <Label htmlFor="reportsEndDate" className="text-xs mb-1 block text-muted-foreground">
                        Data Final
                      </Label>
                      <Input
                        id="reportsEndDate"
                        type="date"
                        value={reportsEndDate}
                        onChange={(e) => setReportsEndDate(e.target.value)}
                        className="w-[140px]"
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
          </TabsContent>
            </>
          )}
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

      <AlertDialog open={callNextConfirmDialogOpen} onOpenChange={setCallNextConfirmDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Pacientes ativos</AlertDialogTitle>
            <AlertDialogDescription>
              Você tem pacientes ainda não finalizados:
            </AlertDialogDescription>
          </AlertDialogHeader>
          <div className="py-4">
            <ul className="space-y-2">
              {activeEntries.map((entry) => (
                <li key={entry.id} className="flex items-center justify-between p-2 bg-muted rounded-md">
                  <span className="font-medium">{entry.patientName}</span>
                  <span className={`text-xs px-2 py-1 rounded-full ${
                    entry.status === Status.IN_PROGRESS 
                      ? 'bg-purple-100 text-purple-800' 
                      : 'bg-blue-100 text-blue-800'
                  }`}>
                    {entry.status === Status.IN_PROGRESS ? 'Em Atendimento' : 'Chamado'}
                  </span>
                </li>
              ))}
            </ul>
          </div>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={handleConfirmCallNext}>
              Chamar Próximo
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <RoomSelectModal
        open={showRoomModal}
        onSelect={(roomId) => {
          if (entryToCall) {
            callPatientMutation.mutate({ entryId: entryToCall, roomId });
            setEntryToCall(null);
          } else {
            callNextMutation.mutate(roomId);
          }
        }}
        onCancel={() => {
          setShowRoomModal(false);
          setEntryToCall(null);
        }}
      />

      <Dialog open={showAddQueueModal} onOpenChange={setShowAddQueueModal}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Adicionar à Fila</DialogTitle>
          </DialogHeader>
          <AddQueueFormInline
            inline={false}
            onSuccess={() => {
              queryClient.invalidateQueries({ queryKey: ["queue"] });
              toast({
                variant: "default",
                title: "Sucesso",
                description: "Entrada adicionada à fila com sucesso",
              });
            }}
            onClose={() => setShowAddQueueModal(false)}
          />
        </DialogContent>
      </Dialog>
    </div>
  );
}

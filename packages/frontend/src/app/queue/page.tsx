"use client";

import { AddQueueFormInline } from "@/components/AddQueueFormInline";
import { AppShell } from "@/components/AppShell";
import { Header } from "@/components/Header";
import { KPICard } from "@/components/KPICard";
import { PatientRecordDialog } from "@/components/PatientRecordDialog";
import { FilaWorkflow } from "@/components/FilaWorkflow";
import { RoomSelectModal } from "@/components/RoomSelectModal";
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
import { Spinner } from "@/components/ui/spinner";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/use-toast";
import { useAuth } from "@/contexts/AuthContext";
import { useQueueMutations } from "@/hooks/useQueueMutations";
import { ModuleKey, patientApi, Priority, queueApi, Role, Status, QueueEntry } from "@/lib/api";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useRef, useState } from "react";
import { BellRing, ClipboardList, DollarSign, AlertTriangle, Package } from "lucide-react";
import type { HeaderAction, HeaderHelper } from "@/components/Header";
import { QueuePaymentDialog } from "@/components/QueuePaymentDialog";
import { createErrorHandler } from "@/lib/errors";

export default function QueuePage() {
  const router = useRouter();
  const { user, currentRoom, isLoading: authLoading, canAccess } = useAuth();
  const queryClient = useQueryClient();
  const { toast: toastFn } = useToast();
  const toastRef = useRef(toastFn);
  toastRef.current = toastFn;

  const [showRoomModal, setShowRoomModal] = useState(false);
  const [showAddQueueModal, setShowAddQueueModal] = useState(false);
  const [entryToCall, setEntryToCall] = useState<string | null>(null);
  const [cancelDialogOpen, setCancelDialogOpen] = useState(false);
  const [entryToCancel, setEntryToCancel] = useState<string | null>(null);
  const [recordPatientId, setRecordPatientId] = useState<string | null>(null);
  const [recordQueueEntryId, setRecordQueueEntryId] = useState<string | null>(null);
  const [paymentDialogOpen, setPaymentDialogOpen] = useState(false);
  const [paymentEntry, setPaymentEntry] = useState<QueueEntry | null>(null);

  const previousEntriesRef = useRef<QueueEntry[]>([]);

  const isVet = user?.role === Role.VET;
  const canManageQueue = canAccess(ModuleKey.QUEUE);
  const canCallOrManageQueue = canManageQueue || isVet;

  const {
    data: entries = [],
    isLoading: entriesLoading,
    isError: entriesError,
  } = useQuery({
    queryKey: ["queue", "active", isVet ? user?.id : undefined],
    queryFn: () => queueApi
      .listActive(isVet ? user?.id : undefined)
      .then((res) => res.data),
    refetchInterval: (query) => (query.state.error ? false : 3000),
    enabled: !authLoading && !!user,
  });

  const onCallNextSuccess = useCallback(() => {
    setShowRoomModal(false);
  }, []);

  const onCallPatientSuccess = useCallback(() => {
    setShowRoomModal(false);
  }, []);

  const queueMutations = useQueueMutations({
    user,
    onCallNextSuccess,
    onCallPatientSuccess,
  });

  useEffect(() => {
    if (!authLoading && !user) {
      router.push("/login");
    }
  }, [user, authLoading, router]);

  useEffect(() => {
    if (!authLoading && user && !canCallOrManageQueue) {
      router.push("/");
    }
  }, [authLoading, user, canCallOrManageQueue, router]);

  useEffect(() => {
    if (entries.length > 0 && previousEntriesRef.current.length > 0) {
      entries.forEach((newEntry) => {
        const oldEntry = previousEntriesRef.current.find((e) => e.id === newEntry.id);
        if (
          oldEntry &&
          oldEntry.priority !== Priority.HIGH &&
          newEntry.priority === Priority.HIGH &&
          newEntry.hasScheduledAppointment
        ) {
          toastRef.current({
            variant: "default",
            title: "Prioridade Atualizada",
            description: `${newEntry.patientName} agora tem prioridade ALTA (horário agendado)`,
          });
        }
      });
    }
    previousEntriesRef.current = entries;
  }, [entries]);

  const callNextFnRef = useRef(queueMutations.callNext);
  callNextFnRef.current = queueMutations.callNext;

  const handleCallNext = useCallback(() => {
    if (currentRoom) {
      callNextFnRef.current(currentRoom.id);
    } else {
      setShowRoomModal(true);
    }
  }, [currentRoom]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement;
      const isInputFocused = target.tagName === "INPUT" || target.tagName === "TEXTAREA" || target.isContentEditable;

      if (e.ctrlKey && e.key === "n") {
        e.preventDefault();
        if (canManageQueue) {
          setShowAddQueueModal(true);
        }
        return;
      }

      if (e.key === "Enter" && !isInputFocused && !showRoomModal && !showAddQueueModal) {
        const waitingCount = entries.filter((e) => e.status === Status.WAITING).length;
        if (waitingCount > 0 && canCallOrManageQueue) {
          handleCallNext();
        }
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [canManageQueue, canCallOrManageQueue, entries, showRoomModal, showAddQueueModal, handleCallNext]);

  const startServiceFnRef = useRef(queueMutations.startService);
  const completeServiceFnRef = useRef(queueMutations.completeService);
  const callPatientFnRef = useRef(queueMutations.callPatient);
  const cancelEntryFnRef = useRef(queueMutations.cancelEntry);

  startServiceFnRef.current = queueMutations.startService;
  completeServiceFnRef.current = queueMutations.completeService;
  callPatientFnRef.current = queueMutations.callPatient;
  cancelEntryFnRef.current = queueMutations.cancelEntry;

  const handleStart = useCallback((id: string) => {
    startServiceFnRef.current(id);
  }, []);

  const handleComplete = useCallback((id: string) => {
    completeServiceFnRef.current(id);
  }, []);

  const handleViewRecord = useCallback((patientId: string, queueEntryId: string) => {
    setRecordPatientId(patientId);
    setRecordQueueEntryId(queueEntryId);
  }, []);

  const handleRegisterConsultation = useCallback((patientId: string, queueEntryId: string) => {
    setRecordPatientId(patientId);
    setRecordQueueEntryId(queueEntryId);
  }, []);

  const handleCall = useCallback((entryId: string) => {
    if (currentRoom) {
      callPatientFnRef.current({ entryId, roomId: currentRoom.id });
    } else {
      if (canManageQueue) {
        setShowRoomModal(true);
        setEntryToCall(entryId);
      } else {
        toastRef.current({
          variant: "destructive",
          title: "Check-in necessário",
          description: "Você precisa fazer check-in em uma sala antes de chamar pacientes.",
        });
      }
    }
  }, [currentRoom, canManageQueue]);

  const handleShowAddQueueModal = useCallback(() => {
    setShowAddQueueModal(true);
  }, []);

  const handleCancel = useCallback((id: string) => {
    setEntryToCancel(id);
    setCancelDialogOpen(true);
  }, []);

  const confirmCancel = useCallback(() => {
    if (entryToCancel) {
      cancelEntryFnRef.current(entryToCancel);
      setCancelDialogOpen(false);
      setEntryToCancel(null);
    }
  }, [entryToCancel]);

  const handleReceivePayment = useCallback((entry: QueueEntry) => {
    setPaymentEntry(entry);
    setPaymentDialogOpen(true);
  }, []);

  const addPaymentMutation = useMutation({
    mutationFn: ({
      id,
      payload,
    }: {
      id: string;
      payload: {
        amount?: string;
        paymentMethod?: string;
        paymentTotal?: string | null;
        installments?: number | null;
        paymentReceivedAt?: string | null;
        paymentNotes?: string | null;
        paymentReceivedById?: string | null;
      };
    }) => queueApi.addPayment(id, payload).then((res) => res.data),
    onError: (error) => {
      createErrorHandler(toastRef.current)(error);
    },
  });

  const handleSubmitPayment = useCallback(
    (payload: {
      amount?: string;
      paymentMethod?: string;
      paymentTotal?: string | null;
      installments?: number | null;
      paymentReceivedAt?: string | null;
      paymentNotes?: string | null;
      paymentReceivedById?: string | null;
    }) => {
      if (!paymentEntry) return;
      const isPayment = Boolean(payload.amount);
      addPaymentMutation.mutate(
        { id: paymentEntry.id, payload },
        {
          onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["queue"] });
            queryClient.invalidateQueries({ queryKey: ["financial"] });
            toastRef.current({
              variant: "default",
              title: isPayment ? "Pagamento registrado" : "Total atualizado",
              description: isPayment
                ? "O pagamento foi lançado com sucesso."
                : "Valor total do atendimento atualizado.",
            });
            setPaymentDialogOpen(false);
            setPaymentEntry(null);
          },
        },
      );
    },
    [addPaymentMutation, paymentEntry],
  );

  if (authLoading || !user) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Spinner size="lg" />
      </div>
    );
  }

  if (!canCallOrManageQueue) {
    return null;
  }

  const waitingCount = entries.filter((entry) => entry.status === Status.WAITING).length;
  const inProgressCount = entries.filter(
    (entry) => entry.status === Status.CALLED || entry.status === Status.IN_PROGRESS,
  ).length;

  // Mock Data for KPIs - In a real app, these would come from an API
  const kpis = [
    {
      title: "Faturamento",
      value: "R$ 57.257,00",
      growth: "6.2%",
      icon: DollarSign,
      iconColor: "text-green-600",
      bgColor: "bg-green-100",
      description: "vs mês passado",
    },
    {
      title: "Internações Críticas",
      value: "12 Pacientes",
      growth: "2 Novos",
      icon: AlertTriangle,
      iconColor: "text-yellow-600",
      bgColor: "bg-yellow-100",
      description: "hoje",
      isUrgent: true,
    },
    {
      title: "Farmácia & Estoque",
      value: "R$ 47.257,00",
      growth: "6.2%",
      icon: Package,
      iconColor: "text-blue-600",
      bgColor: "bg-blue-100",
      description: "vs mês passado",
    }
  ];

  return (
    <AppShell
      header={
        <Header
          title="Fila de atendimentos"
          subtitle="Organize a fila e chame o próximo paciente com fluidez."
          actions={[
            canManageQueue ? {
              label: "Novo Atendimento",
              onClick: () => setShowAddQueueModal(true),
              variant: "primary"
            } : undefined
          ].filter(Boolean) as any}
        />
      }
    >
      <div className="space-y-8">
        {/* KPI Section */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {kpis.map((kpi, index) => (
            <KPICard
              key={index}
              title={kpi.title}
              value={kpi.value}
              growth={kpi.growth}
              icon={kpi.icon}
              iconColor={kpi.iconColor}
              bgColor={kpi.bgColor}
              description={kpi.description}
              isUrgent={kpi.isUrgent}
            />
          ))}
        </div>

        {entriesLoading ? (
          <div className="space-y-6 rounded-2xl border border-border bg-card p-6 shadow-sm">
            <div className="space-y-3">
              <Skeleton className="h-6 w-48" />
              <Skeleton className="h-4 w-64" />
            </div>
            <div className="grid gap-4 md:grid-cols-3">
              {Array.from({ length: 3 }).map((_, index) => (
                <Skeleton key={index} className="h-28 rounded-xl" />
              ))}
            </div>
            <div className="grid gap-3 md:grid-cols-2 2xl:grid-cols-3">
              {Array.from({ length: 3 }).map((_, index) => (
                <Skeleton key={index} className="h-60 rounded-xl" />
              ))}
            </div>
          </div>
        ) : entriesError ? (
          <div className="rounded-2xl border border-destructive/40 bg-destructive/5 p-10 text-center">
            <p className="text-lg font-semibold text-destructive">
              Erro ao carregar fila
            </p>
            <p className="mt-2 text-sm text-destructive/80">
              Não foi possível carregar os atendimentos em andamento. Tente novamente.
            </p>
            <Button
              variant="outline"
              className="mt-4"
              onClick={() => queryClient.invalidateQueries({ queryKey: ["queue", "active"] })}
            >
              Tentar novamente
            </Button>
          </div>
        ) : (
          <FilaWorkflow
            user={user}
            entries={entries}
            canManageQueue={canManageQueue}
            onCall={canCallOrManageQueue ? handleCall : undefined}
            onStart={isVet ? handleStart : undefined}
            onComplete={handleComplete}
            onCancel={canManageQueue ? handleCancel : undefined}
            onViewRecord={handleViewRecord}
            onRegisterConsultation={isVet ? handleRegisterConsultation : undefined}
            onReceivePayment={!isVet && canManageQueue ? handleReceivePayment : undefined}
          />
        )}
      </div>

      <AlertDialog open={cancelDialogOpen} onOpenChange={setCancelDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Cancelar entrada da fila?</AlertDialogTitle>
            <AlertDialogDescription>
              O paciente será removido da fila e o status será marcado como cancelado. Esta ação pode ser visualizada no histórico de atendimentos.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Manter na fila</AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmCancel}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Sim, cancelar entrada
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <RoomSelectModal
        open={showRoomModal}
        onSelect={(roomId) => {
          if (entryToCall) {
            queueMutations.callPatient({ entryId: entryToCall, roomId });
            setEntryToCall(null);
          } else {
            queueMutations.callNext(roomId);
          }
        }}
        onCancel={() => {
          setShowRoomModal(false);
          setEntryToCall(null);
        }}
      />

      <Dialog open={showAddQueueModal} onOpenChange={setShowAddQueueModal}>
        <DialogContent className="max-h-[90vh] max-w-2xl overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Adicionar à Fila</DialogTitle>
          </DialogHeader>
          <AddQueueFormInline
            inline={false}
            onSuccess={() => {
              queryClient.invalidateQueries({ queryKey: ["queue"] });
              toastRef.current({
                variant: "default",
                title: "Sucesso",
                description: "Entrada adicionada à fila com sucesso",
              });
            }}
            onClose={() => setShowAddQueueModal(false)}
          />
        </DialogContent>
      </Dialog>

      {recordPatientId && (
        <PatientRecordDialogWrapper
          patientId={recordPatientId}
          queueEntryId={recordQueueEntryId || undefined}
          open={!!recordPatientId}
          onOpenChange={(open) => {
            if (!open) {
              setRecordPatientId(null);
              setRecordQueueEntryId(null);
            }
          }}
        />
      )}

      <QueuePaymentDialog
        entry={paymentEntry}
        open={paymentDialogOpen}
        onOpenChange={(open) => {
          setPaymentDialogOpen(open);
          if (!open) {
            setPaymentEntry(null);
          }
        }}
        onSubmit={handleSubmitPayment}
        isSubmitting={addPaymentMutation.isPending}
      />
    </AppShell>
  );
}

function PatientRecordDialogWrapper({
  patientId,
  queueEntryId,
  open,
  onOpenChange,
}: {
  patientId: string;
  queueEntryId?: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const { data: patient, isLoading } = useQuery({
    queryKey: ["patient", patientId],
    queryFn: () => patientApi.getById(patientId).then((res) => res.data),
    enabled: open && !!patientId,
  });

  if (isLoading || !patient) {
    return (
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-4xl">
          <div className="flex justify-center items-center py-8">
            <Spinner />
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <PatientRecordDialog
      patient={patient}
      open={open}
      onOpenChange={onOpenChange}
      initialTab="consultations"
      prefillQueueEntryId={queueEntryId}
    />
  );
}


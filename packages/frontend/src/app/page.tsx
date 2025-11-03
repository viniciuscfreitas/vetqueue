"use client";

import { useQuery } from "@tanstack/react-query";
import { queueApi, Status, Role, Priority } from "@/lib/api";
import { useEffect, useState, useRef, useCallback } from "react";
import { Header } from "@/components/Header";
import { AddQueueFormInline } from "@/components/AddQueueFormInline";
import { useAuth } from "@/contexts/AuthContext";
import { useRouter } from "next/navigation";
import { RoomSelectModal } from "@/components/RoomSelectModal";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
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
import { useToast } from "@/components/ui/use-toast";
import { useQueryClient } from "@tanstack/react-query";
import { QueueTab } from "@/components/QueueTab";
import { HistoryTab } from "@/components/HistoryTab";
import { ReportsTab } from "@/components/ReportsTab";
import { AuditTab } from "@/components/AuditTab";
import { useQueueMutations } from "@/hooks/useQueueMutations";
import { Spinner } from "@/components/ui/spinner";

export default function Home() {
  const router = useRouter();
  const { user, currentRoom, isLoading: authLoading } = useAuth();
  const queryClient = useQueryClient();
  const { toast } = useToast();
  
  const [showRoomModal, setShowRoomModal] = useState(false);
  const [showAddQueueModal, setShowAddQueueModal] = useState(false);
  const [entryToCall, setEntryToCall] = useState<string | null>(null);
  const [cancelDialogOpen, setCancelDialogOpen] = useState(false);
  const [entryToCancel, setEntryToCancel] = useState<string | null>(null);

  const previousEntriesRef = useRef<any[]>([]);
  const renderCountRef = useRef(0);
  renderCountRef.current += 1;
  
  console.log("[DEBUG page.tsx] Component render #", renderCountRef.current);

  const { data: entries = [] } = useQuery({
    queryKey: ["queue", "active", user?.role === "VET" ? user.id : undefined],
    queryFn: () => queueApi.listActive(
      user?.role === "VET" ? user.id : undefined
    ).then((res) => res.data),
    refetchInterval: (query) => (query.state.error ? false : 3000),
    enabled: !authLoading && !!user,
  });

  const onCallNextSuccessRef = useRef<() => void>();
  const onCallPatientSuccessRef = useRef<() => void>();

  const onCallNextSuccess = useCallback(() => {
    console.log("[DEBUG page.tsx] onCallNextSuccess called");
    setShowRoomModal(false);
  }, []);

  const onCallPatientSuccess = useCallback(() => {
    console.log("[DEBUG page.tsx] onCallPatientSuccess called");
    setShowRoomModal(false);
  }, []);

  useEffect(() => {
    if (onCallNextSuccessRef.current !== onCallNextSuccess) {
      console.log("[DEBUG page.tsx] onCallNextSuccess callback RECRIADO");
      onCallNextSuccessRef.current = onCallNextSuccess;
    }
  }, [onCallNextSuccess]);
  
  useEffect(() => {
    if (onCallPatientSuccessRef.current !== onCallPatientSuccess) {
      console.log("[DEBUG page.tsx] onCallPatientSuccess callback RECRIADO");
      onCallPatientSuccessRef.current = onCallPatientSuccess;
    }
  }, [onCallPatientSuccess]);

  const queueMutations = useQueueMutations({
    user,
    onCallNextSuccess,
    onCallPatientSuccess,
  });

  const queueMutationsRef = useRef(queueMutations);
  
  useEffect(() => {
    const prevQueueMutations = queueMutationsRef.current;
    if (prevQueueMutations !== queueMutations) {
      console.log("[DEBUG page.tsx] queueMutations objeto RECRIADO", {
        callNextChanged: prevQueueMutations.callNext !== queueMutations.callNext,
        callPatientChanged: prevQueueMutations.callPatient !== queueMutations.callPatient,
        callNextPendingChanged: prevQueueMutations.callNextPending !== queueMutations.callNextPending,
        isPending: queueMutations.callNextPending,
        prevCallNextFn: prevQueueMutations.callNext,
        newCallNextFn: queueMutations.callNext,
      });
      queueMutationsRef.current = queueMutations;
    }
  }, [queueMutations]);
  
  console.log("[DEBUG page.tsx] Durante render - verificando queueMutations", {
    callNextFn: queueMutations.callNext,
    callPatientFn: queueMutations.callPatient,
    callNextPending: queueMutations.callNextPending,
    user: user?.id,
    currentRoom: currentRoom?.id,
  });

  useEffect(() => {
    if (!authLoading && !user) {
      router.push("/login");
    }
  }, [user, authLoading, router]);

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
          toast({
            variant: "default",
            title: "Prioridade Atualizada",
            description: `${newEntry.patientName} agora tem prioridade ALTA (horário agendado)`,
          });
        }
      });
    }
    previousEntriesRef.current = entries;
  }, [entries, toast]);

  const callNextFnRef = useRef(queueMutations.callNext);
  
  useEffect(() => {
    if (callNextFnRef.current !== queueMutations.callNext) {
      console.log("[DEBUG page.tsx] callNextFnRef MUDOU", {
        prevFn: callNextFnRef.current,
        newFn: queueMutations.callNext,
      });
      callNextFnRef.current = queueMutations.callNext;
    }
  }, [queueMutations.callNext]);
  
  console.log("[DEBUG page.tsx] Criando handleCallNext useCallback", {
    currentRoom: currentRoom?.id,
    callNextFnRef: !!callNextFnRef.current,
    renderCount: renderCountRef.current,
  });
  
  const handleCallNext = useCallback(() => {
    console.log("[DEBUG page.tsx] handleCallNext EXECUTADO", { currentRoom: currentRoom?.id });
    if (currentRoom) {
      console.log("[DEBUG page.tsx] handleCallNext - chamando callNext", { roomId: currentRoom.id });
      callNextFnRef.current(currentRoom.id);
    } else {
      console.log("[DEBUG page.tsx] handleCallNext - opening room modal (no currentRoom)");
      setShowRoomModal(true);
    }
  }, [currentRoom]);
  
  console.log("[DEBUG page.tsx] handleCallNext criado", { 
    functionName: handleCallNext.name,
    renderCount: renderCountRef.current 
  });
  
  const handleCallNextRef = useRef(handleCallNext);
  
  useEffect(() => {
    if (handleCallNextRef.current !== handleCallNext) {
      console.log("[DEBUG page.tsx] handleCallNext callback RECRIADO");
      handleCallNextRef.current = handleCallNext;
    }
  }, [handleCallNext]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement;
      const isInputFocused = target.tagName === "INPUT" || target.tagName === "TEXTAREA" || target.isContentEditable;

      if (e.ctrlKey && e.key === "n") {
        e.preventDefault();
        if (user?.role === Role.RECEPCAO) {
          setShowAddQueueModal(true);
        }
        return;
      }

      if (e.key === "Enter" && !isInputFocused && !showRoomModal && !showAddQueueModal) {
        const waitingCount = entries.filter((e) => e.status === Status.WAITING).length;
        if (waitingCount > 0 && (user?.role === Role.RECEPCAO || user?.role === Role.VET)) {
          handleCallNext();
        }
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [user?.role, entries, showRoomModal, showAddQueueModal, handleCallNext]);

  const handleStart = (id: string) => {
    queueMutations.startService(id);
  };

  const handleComplete = (id: string) => {
    queueMutations.completeService(id);
  };

  const callPatientFnRef = useRef(queueMutations.callPatient);
  
  useEffect(() => {
    if (callPatientFnRef.current !== queueMutations.callPatient) {
      console.log("[DEBUG page.tsx] callPatientFnRef MUDOU", {
        prevFn: callPatientFnRef.current,
        newFn: queueMutations.callPatient,
      });
      callPatientFnRef.current = queueMutations.callPatient;
    }
  }, [queueMutations.callPatient]);
  
  console.log("[DEBUG page.tsx] Criando handleCall useCallback", {
    currentRoom: currentRoom?.id,
    userRole: user?.role,
    callPatientFnRef: !!callPatientFnRef.current,
    toastFn: !!toast,
    renderCount: renderCountRef.current,
  });
  
  const handleCall = useCallback((entryId: string) => {
    console.log("[DEBUG page.tsx] handleCall EXECUTADO", { entryId, currentRoom: currentRoom?.id, userRole: user?.role });
    if (currentRoom) {
      console.log("[DEBUG page.tsx] handleCall - chamando callPatient", { entryId, roomId: currentRoom.id });
      callPatientFnRef.current({ entryId, roomId: currentRoom.id });
    } else {
      if (user?.role === Role.RECEPCAO) {
        console.log("[DEBUG page.tsx] handleCall - opening room modal for RECEPCAO");
        setShowRoomModal(true);
        setEntryToCall(entryId);
      } else {
        console.log("[DEBUG page.tsx] handleCall - showing check-in required toast");
        toast({
          variant: "destructive",
          title: "Check-in necessário",
          description: "Você precisa fazer check-in em uma sala antes de chamar pacientes.",
        });
      }
    }
  }, [currentRoom, user?.role, toast]);
  
  console.log("[DEBUG page.tsx] handleCall criado", { 
    functionName: handleCall.name,
    renderCount: renderCountRef.current 
  });
  
  const handleCallRef = useRef(handleCall);
  
  useEffect(() => {
    if (handleCallRef.current !== handleCall) {
      console.log("[DEBUG page.tsx] handleCall callback RECRIADO");
      handleCallRef.current = handleCall;
    }
  }, [handleCall]);

  const handleShowRoomModal = useCallback(() => {
    console.log("[DEBUG page.tsx] handleShowRoomModal called");
    setShowRoomModal(true);
  }, []);

  const handleShowAddQueueModal = useCallback(() => {
    console.log("[DEBUG page.tsx] handleShowAddQueueModal called");
    setShowAddQueueModal(true);
  }, []);

  const handleCancel = (id: string) => {
    setEntryToCancel(id);
    setCancelDialogOpen(true);
  };

  const confirmCancel = () => {
    if (entryToCancel) {
      queueMutations.cancelEntry(entryToCancel);
      setCancelDialogOpen(false);
      setEntryToCancel(null);
    }
  };

  if (authLoading || !user) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Spinner size="lg" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Header />

      <main className="container mx-auto px-4 py-8">
        <Tabs defaultValue="queue" className="space-y-8">
          <TabsList className={`grid w-full h-auto ${user?.role === Role.RECEPCAO ? 'grid-cols-4' : 'grid-cols-1'}`}>
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
                <TabsTrigger
                  value="audit"
                  className="data-[state=active]:font-semibold py-2.5 text-sm sm:text-base"
                >
                  Auditoria
                </TabsTrigger>
              </>
            )}
          </TabsList>

          <TabsContent value="queue" className="space-y-6 mt-6">
            <QueueTab
              user={user}
              currentRoom={currentRoom}
              authLoading={authLoading}
              onShowRoomModal={handleShowRoomModal}
              onShowAddQueueModal={handleShowAddQueueModal}
              onStart={user?.role === Role.VET ? handleStart : undefined}
              onComplete={handleComplete}
              onCancel={user?.role === Role.RECEPCAO ? handleCancel : undefined}
              onCall={(user?.role === Role.RECEPCAO || user?.role === Role.VET) ? handleCall : undefined}
              onCallNext={handleCallNext}
              callNextPending={queueMutations.callNextPending}
            />
          </TabsContent>

          {user?.role === Role.RECEPCAO && (
            <>
              <TabsContent value="history" className="space-y-6 mt-6">
                <HistoryTab authLoading={authLoading} />
              </TabsContent>

              <TabsContent value="reports" className="space-y-6 mt-6">
                <ReportsTab authLoading={authLoading} />
              </TabsContent>

              <TabsContent value="audit" className="space-y-6 mt-6">
                <AuditTab authLoading={authLoading} />
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

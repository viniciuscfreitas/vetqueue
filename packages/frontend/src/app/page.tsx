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

  const { data: entries = [] } = useQuery({
    queryKey: ["queue", "active", user?.role === "VET" ? user.id : undefined],
    queryFn: () => queueApi.listActive(
      user?.role === "VET" ? user.id : undefined
    ).then((res) => res.data),
    refetchInterval: (query) => (query.state.error ? false : 3000),
    enabled: !authLoading && !!user,
  });

  const queueMutations = useQueueMutations({
    user,
    onCallNextSuccess: () => setShowRoomModal(false),
    onCallPatientSuccess: () => setShowRoomModal(false),
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

  const handleCallNext = useCallback(() => {
    if (currentRoom) {
      queueMutations.callNext(currentRoom.id);
    } else {
      setShowRoomModal(true);
    }
  }, [currentRoom, queueMutations]);

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

  const handleCall = (entryId: string) => {
    if (currentRoom) {
      queueMutations.callPatient({ entryId, roomId: currentRoom.id });
    } else {
      if (user?.role === Role.RECEPCAO) {
        setShowRoomModal(true);
        setEntryToCall(entryId);
      } else {
        toast({
          variant: "destructive",
          title: "Check-in necessário",
          description: "Você precisa fazer check-in em uma sala antes de chamar pacientes.",
        });
      }
    }
  };

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
              onShowRoomModal={() => setShowRoomModal(true)}
              onShowAddQueueModal={() => setShowAddQueueModal(true)}
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

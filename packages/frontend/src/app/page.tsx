"use client";

import { useQuery } from "@tanstack/react-query";
import { queueApi, Status, Role, Priority } from "@/lib/api";
import { useEffect, useState, useRef } from "react";
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
  const [callNextConfirmDialogOpen, setCallNextConfirmDialogOpen] = useState(false);

  const previousEntriesRef = useRef<any[]>([]);

  const { data: entries = [] } = useQuery({
    queryKey: ["queue", "active", user?.role === "VET" ? user.id : undefined],
    queryFn: () => queueApi.listActive(
      user?.role === "VET" ? user.id : undefined
    ).then((res) => res.data),
    refetchInterval: (query) => (query.state.error ? false : 3000),
    enabled: !authLoading && !!user,
  });

  const activeEntries = entries.filter((e) => e.status === Status.IN_PROGRESS || e.status === Status.CALLED);

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

  const handleCallNext = () => {
    if (user?.role !== Role.RECEPCAO) {
      if (activeEntries.length > 0) {
        setCallNextConfirmDialogOpen(true);
        return;
      }
    }

    if (currentRoom) {
      queueMutations.callNext(currentRoom.id);
    } else {
      setShowRoomModal(true);
    }
  };

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
      const entry = entries.find(e => e.id === entryId);
      if (user?.role === Role.RECEPCAO) {
        if (entry?.assignedVet) {
          toast({
            variant: "destructive",
            title: "Erro",
            description: `Veterinário ${entry.assignedVet.name} deve fazer check-in na sala primeiro`,
          });
        } else {
          setShowRoomModal(true);
          setEntryToCall(entryId);
        }
      } else {
        toast({
          variant: "destructive",
          title: "Erro",
          description: "Você precisa fazer check-in em uma sala primeiro",
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

  const handleConfirmCallNext = () => {
    setCallNextConfirmDialogOpen(false);
    if (currentRoom) {
      queueMutations.callNext(currentRoom.id);
    } else {
      setShowRoomModal(true);
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
                  <span 
                    className="text-xs px-2 py-1 rounded-full"
                    style={{
                      backgroundColor: entry.status === Status.IN_PROGRESS 
                        ? 'rgba(91, 150, 183, 0.15)' 
                        : 'rgba(37, 157, 227, 0.15)',
                      color: entry.status === Status.IN_PROGRESS 
                        ? '#5B96B7' 
                        : '#259DE3',
                    }}
                  >
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

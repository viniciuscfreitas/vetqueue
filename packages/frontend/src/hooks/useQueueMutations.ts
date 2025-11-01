import { useMutation, useQueryClient } from "@tanstack/react-query";
import { queueApi, Role, QueueEntry } from "@/lib/api";
import { useToast } from "@/components/ui/use-toast";
import { createErrorHandler } from "@/lib/errors";
import { User } from "@/lib/api";

interface UseQueueMutationsProps {
  user: User | null;
  onCallNextSuccess?: () => void;
  onCallPatientSuccess?: () => void;
}

export function useQueueMutations({ user, onCallNextSuccess, onCallPatientSuccess }: UseQueueMutationsProps) {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const handleError = createErrorHandler(toast);

  const callNextMutation = useMutation({
    mutationFn: (roomId: string) => 
      queueApi.callNext(roomId, user?.role === Role.VET ? user.id : undefined).then((res) => res.data),
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
      onCallNextSuccess?.();
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
      onCallPatientSuccess?.();
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

  return {
    callNext: callNextMutation.mutate,
    callNextAsync: callNextMutation.mutateAsync,
    callNextPending: callNextMutation.isPending,
    callPatient: callPatientMutation.mutate,
    callPatientAsync: callPatientMutation.mutateAsync,
    startService: startServiceMutation.mutate,
    completeService: completeServiceMutation.mutate,
    cancelEntry: cancelEntryMutation.mutate,
  };
}


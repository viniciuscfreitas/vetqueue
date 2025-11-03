import { useMutation, useQueryClient } from "@tanstack/react-query";
import { queueApi, Role, QueueEntry } from "@/lib/api";
import { useToast } from "@/components/ui/use-toast";
import { createErrorHandler } from "@/lib/errors";
import { User } from "@/lib/api";
import { useRef, useMemo, useEffect } from "react";

interface UseQueueMutationsProps {
  user: User | null;
  onCallNextSuccess?: () => void;
  onCallPatientSuccess?: () => void;
}

export function useQueueMutations({ user, onCallNextSuccess, onCallPatientSuccess }: UseQueueMutationsProps) {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const handleError = createErrorHandler(toast);
  
  const hookRenderCountRef = useRef(0);
  hookRenderCountRef.current += 1;
  console.log("[DEBUG useQueueMutations] Hook executado #", hookRenderCountRef.current);
  
  const onCallNextSuccessRef = useRef(onCallNextSuccess);
  const onCallPatientSuccessRef = useRef(onCallPatientSuccess);
  
  useEffect(() => {
    if (onCallNextSuccessRef.current !== onCallNextSuccess) {
      console.log("[DEBUG useQueueMutations] onCallNextSuccess callback MUDOU");
      onCallNextSuccessRef.current = onCallNextSuccess;
    }
  }, [onCallNextSuccess]);
  
  useEffect(() => {
    if (onCallPatientSuccessRef.current !== onCallPatientSuccess) {
      console.log("[DEBUG useQueueMutations] onCallPatientSuccess callback MUDOU");
      onCallPatientSuccessRef.current = onCallPatientSuccess;
    }
  }, [onCallPatientSuccess]);

  const callNextMutation = useMutation({
    mutationFn: (roomId: string) => {
      console.log("[DEBUG useQueueMutations] callNext mutation executando", { roomId, userId: user?.id, userRole: user?.role });
      return queueApi.callNext(roomId, user?.role === Role.VET ? user.id : undefined).then((res) => res.data);
    },
    onSuccess: (data) => {
      console.log("[DEBUG useQueueMutations] callNext onSuccess", { hasMessage: "message" in data });
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
      queryClient.invalidateQueries({ queryKey: ["room-occupations"] });
      console.log("[DEBUG useQueueMutations] Chamando onCallNextSuccess callback", { hasCallback: !!onCallNextSuccessRef.current });
      onCallNextSuccessRef.current?.();
    },
    onError: (error) => {
      console.log("[DEBUG useQueueMutations] callNext onError", error);
      handleError(error);
    },
  });

  const callPatientMutation = useMutation({
    mutationFn: ({ entryId, roomId }: { entryId: string; roomId: string }) => {
      console.log("[DEBUG useQueueMutations] callPatient mutation executando", { entryId, roomId, userId: user?.id, userRole: user?.role });
      return queueApi.callPatient(entryId, roomId, user?.role === Role.VET ? user.id : undefined).then((res) => res.data);
    },
    onSuccess: (data) => {
      console.log("[DEBUG useQueueMutations] callPatient onSuccess", { patientName: data.patientName });
      toast({
        variant: "default",
        title: "Paciente chamado",
        description: `${data.patientName} foi chamado com sucesso`,
      });
      queryClient.invalidateQueries({ queryKey: ["queue"] });
      queryClient.invalidateQueries({ queryKey: ["room-occupations"] });
      console.log("[DEBUG useQueueMutations] Chamando onCallPatientSuccess callback", { hasCallback: !!onCallPatientSuccessRef.current });
      onCallPatientSuccessRef.current?.();
    },
    onError: (error) => {
      console.log("[DEBUG useQueueMutations] callPatient onError", error);
      handleError(error);
    },
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

  console.log("[DEBUG useQueueMutations] Antes do useMemo - verificando mutações", {
    callNextMutationMutate: callNextMutation.mutate,
    callNextMutationPending: callNextMutation.isPending,
    callPatientMutationMutate: callPatientMutation.mutate,
    hookRenderCount: hookRenderCountRef.current,
  });

  const result = useMemo(() => {
    const obj = {
      callNext: callNextMutation.mutate,
      callNextAsync: callNextMutation.mutateAsync,
      callNextPending: callNextMutation.isPending,
      callPatient: callPatientMutation.mutate,
      callPatientAsync: callPatientMutation.mutateAsync,
      startService: startServiceMutation.mutate,
      completeService: completeServiceMutation.mutate,
      cancelEntry: cancelEntryMutation.mutate,
    };
    console.log("[DEBUG useQueueMutations] Objeto result criado/atualizado dentro useMemo", {
      callNextPending: obj.callNextPending,
      callNextFn: !!obj.callNext,
      callPatientFn: !!obj.callPatient,
      callNextFnReference: obj.callNext,
      callPatientFnReference: obj.callPatient,
    });
    return obj;
  }, [
    callNextMutation.mutate,
    callNextMutation.mutateAsync,
    callNextMutation.isPending,
    callPatientMutation.mutate,
    callPatientMutation.mutateAsync,
    startServiceMutation.mutate,
    completeServiceMutation.mutate,
    cancelEntryMutation.mutate,
  ]);
  
  console.log("[DEBUG useQueueMutations] Depois do useMemo - result", {
    callNextPending: result.callNextPending,
    callNextFn: result.callNext,
    callPatientFn: result.callPatient,
  });

  const resultRef = useRef(result);
  const prevResult = resultRef.current;
  
  const resultChanged = 
    prevResult.callNext !== result.callNext ||
    prevResult.callPatient !== result.callPatient ||
    prevResult.callNextPending !== result.callNextPending;
  
  if (resultChanged) {
    console.log("[DEBUG useQueueMutations] Objeto retornado MUDOU", {
      callNextChanged: prevResult.callNext !== result.callNext,
      callPatientChanged: prevResult.callPatient !== result.callPatient,
      callNextPendingChanged: prevResult.callNextPending !== result.callNextPending,
      newPendingValue: result.callNextPending,
    });
    resultRef.current = result;
  }

  return result;
}


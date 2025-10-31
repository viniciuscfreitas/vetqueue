"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { queueApi } from "@/lib/api";
import { QueueList } from "@/components/QueueList";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/use-toast";
import { createErrorHandler } from "@/lib/errors";
import { useEffect } from "react";
import { Header } from "@/components/Header";

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

  return (
    <div className="min-h-screen bg-background">
      <Header showNavigation />

      <main className="container mx-auto px-4 py-8">
        <div className="mb-6 flex items-center justify-between">
          <h2 className="text-3xl font-bold">Fila Atual</h2>
          <Button
            onClick={handleCallNext}
            disabled={callNextMutation.isPending}
            size="lg"
          >
            {callNextMutation.isPending
              ? "Chamando..."
              : "Chamar Próximo"}
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
      </main>
    </div>
  );
}


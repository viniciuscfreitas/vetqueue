"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { queueApi, QueueEntry } from "@/lib/api";
import { QueueList } from "@/components/QueueList";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useToast } from "@/components/ui/use-toast";
import { createErrorHandler } from "@/lib/errors";

export default function Home() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const handleError = createErrorHandler(toast);

  const { data: entries = [], isLoading } = useQuery({
    queryKey: ["queue", "active"],
    queryFn: () => queueApi.listActive().then((res) => res.data),
    refetchInterval: (query) => (query.state.error ? false : 3000),
  });

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
      <header className="border-b">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <h1 className="text-2xl font-bold">VetQueue</h1>
            <nav className="flex gap-4">
              <Link href="/add">
                <Button variant="outline">Adicionar à Fila</Button>
              </Link>
              <Link href="/history">
                <Button variant="outline">Histórico</Button>
              </Link>
              <Link href="/reports">
                <Button variant="outline">Relatórios</Button>
              </Link>
            </nav>
          </div>
        </div>
      </header>

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


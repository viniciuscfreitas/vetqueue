"use client";

import { useQuery } from "@tanstack/react-query";
import { queueApi, Status, QueueEntry, Role } from "@/lib/api";
import { QueueList } from "@/components/QueueList";
import { QueueHeader } from "@/components/QueueHeader";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { useQueryClient } from "@tanstack/react-query";

interface QueueTabProps {
  user: { id: string; role: Role } | null;
  currentRoom: { id: string } | null;
  authLoading: boolean;
  onShowRoomModal: () => void;
  onShowAddQueueModal: () => void;
  onStart?: (id: string) => void;
  onComplete: (id: string) => void;
  onCancel?: (id: string) => void;
  onCall?: (entryId: string) => void;
  onCallNext: () => void;
  callNextPending: boolean;
}

export function QueueTab({
  user,
  currentRoom,
  authLoading,
  onShowRoomModal,
  onShowAddQueueModal,
  onStart,
  onComplete,
  onCancel,
  onCall,
  onCallNext,
  callNextPending,
}: QueueTabProps) {
  const queryClient = useQueryClient();

  const { data: entries = [], isLoading, isError } = useQuery<QueueEntry[]>({
    queryKey: ["queue", "active", user?.role === "VET" ? user.id : undefined],
    queryFn: () => queueApi.listActive(
      user?.role === "VET" ? user.id : undefined
    ).then((res) => res.data),
    refetchInterval: (query) => (query.state.error ? false : 3000),
    enabled: !authLoading && !!user,
  });

  const waitingCount = entries.filter((entry) => entry.status === Status.WAITING).length;

  return (
    <div className="space-y-4">
      <QueueHeader
        entries={entries}
        isLoading={isLoading}
        isError={isError}
        waitingCount={waitingCount}
        userRole={user?.role}
        onAddClick={onShowAddQueueModal}
        onCallNextClick={onCallNext}
        callNextPending={callNextPending}
      />

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
          onStart={onStart}
          onComplete={onComplete}
          onCancel={onCancel}
          onCall={onCall}
        />
      )}
    </div>
  );
}


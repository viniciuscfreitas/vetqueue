import { QueueEntry, Priority, Status, Role } from "@/lib/api";
import { QueueCard } from "./QueueCard";
import { Button } from "./ui/button";
import { Plus } from "lucide-react";

interface QueueListProps {
  entries: QueueEntry[];
  onStart?: (id: string) => void;
  onComplete?: (id: string) => void;
  onCancel?: (id: string) => void;
  onCall?: (id: string) => void;
  emptyMessage?: string;
  userRole?: Role;
  onAddClick?: () => void;
}

export function QueueList({
  entries,
  onStart,
  onComplete,
  onCancel,
  onCall,
  emptyMessage = "Nenhuma entrada na fila no momento",
  userRole,
  onAddClick,
}: QueueListProps) {
  if (entries.length === 0) {
    return (
      <div className="text-center py-12 space-y-4">
        <p className="text-muted-foreground">{emptyMessage}</p>
        {userRole === Role.RECEPCAO && onAddClick && (
          <Button onClick={onAddClick} size="lg" className="mt-4">
            <Plus className="mr-2 h-4 w-4" />
            Adicionar primeiro paciente
          </Button>
        )}
      </div>
    );
  }

  const sortedEntries = [...entries].sort((a, b) => {
    if (a.status !== b.status) {
      const statusOrder = {
        [Status.WAITING]: 1,
        [Status.CALLED]: 2,
        [Status.IN_PROGRESS]: 3,
        [Status.COMPLETED]: 4,
        [Status.CANCELLED]: 5,
      };
      return statusOrder[a.status] - statusOrder[b.status];
    }

    if (a.priority !== b.priority) {
      return a.priority - b.priority;
    }

    return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
  });

  const waitingEntries = sortedEntries.filter(e => e.status === Status.WAITING);

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      {sortedEntries.map((entry, index) => {
        const position = entry.status === Status.WAITING 
          ? waitingEntries.findIndex(e => e.id === entry.id) + 1 
          : undefined;
        return (
          <QueueCard
            key={entry.id}
            entry={entry}
            position={position}
            onStart={onStart}
            onComplete={onComplete}
            onCancel={onCancel}
            onCall={onCall}
          />
        );
      })}
    </div>
  );
}


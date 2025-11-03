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
  onViewRecord?: (patientId: string, queueEntryId: string) => void;
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
  onViewRecord,
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

  const sortEntries = (entries: QueueEntry[]) => {
    return [...entries].sort((a, b) => {
      if (a.priority !== b.priority) {
        return a.priority - b.priority;
      }
      return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
    });
  };

  const inProgress = sortEntries(
    entries.filter(e => e.status === Status.CALLED || e.status === Status.IN_PROGRESS)
  ).sort((a, b) => {
    if (a.status === Status.CALLED && b.status === Status.IN_PROGRESS) return -1;
    if (a.status === Status.IN_PROGRESS && b.status === Status.CALLED) return 1;
    return 0;
  });

  const waiting = sortEntries(
    entries.filter(e => e.status === Status.WAITING)
  );

  const renderSection = (title: string, sectionEntries: QueueEntry[], showPosition: boolean) => {
    if (sectionEntries.length === 0) return null;

    return (
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold">{title}</h3>
          <span className="text-sm text-muted-foreground">
            {sectionEntries.length} {sectionEntries.length === 1 ? "entrada" : "entradas"}
          </span>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {sectionEntries.map((entry, index) => {
            const position = showPosition ? index + 1 : undefined;
            return (
              <QueueCard
                key={entry.id}
                entry={entry}
                position={position}
                userRole={userRole}
                onStart={onStart}
                onComplete={onComplete}
                onCancel={onCancel}
                onCall={onCall}
                onViewRecord={onViewRecord}
              />
            );
          })}
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-8">
      {renderSection("Em Atendimento", inProgress, false)}
      {renderSection("Fila de Espera", waiting, true)}
    </div>
  );
}


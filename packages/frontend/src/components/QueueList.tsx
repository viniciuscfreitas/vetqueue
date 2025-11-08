import { QueueEntry } from "@/lib/api";
import { QueueCard } from "./QueueCard";
import { Button } from "./ui/button";
import { Plus } from "lucide-react";
import { sortQueueEntries, splitActiveEntries } from "@/lib/queueHelpers";

interface QueueListProps {
  entries: QueueEntry[];
  onStart?: (id: string) => void;
  onComplete?: (id: string) => void;
  onCancel?: (id: string) => void;
  onCall?: (id: string) => void;
  onViewRecord?: (patientId: string, queueEntryId: string) => void;
  onRegisterConsultation?: (patientId: string, queueEntryId: string) => void;
  emptyMessage?: string;
  canManageQueue?: boolean;
  onAddClick?: () => void;
  mode?: "history";
}

export function QueueList({
  entries,
  onStart,
  onComplete,
  onCancel,
  onCall,
  onViewRecord,
  onRegisterConsultation,
  emptyMessage = "Nenhuma entrada na fila no momento",
  canManageQueue = false,
  onAddClick,
  mode,
}: QueueListProps) {
  if (entries.length === 0) {
    return (
      <div className="text-center py-12 space-y-4">
        <p className="text-muted-foreground">{emptyMessage}</p>
        {canManageQueue && onAddClick && (
          <Button onClick={onAddClick} size="lg" className="mt-4">
            <Plus className="mr-2 h-4 w-4" />
            Adicionar primeiro paciente
          </Button>
        )}
      </div>
    );
  }

  if (mode === "history") {
    const sortedHistory = sortQueueEntries(entries).reverse();

    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {sortedHistory.map((entry) => (
          <QueueCard
            key={entry.id}
            entry={entry}
            canManageQueue={canManageQueue}
            onStart={onStart}
            onComplete={onComplete}
            onCancel={onCancel}
            onCall={onCall}
            onViewRecord={onViewRecord}
            onRegisterConsultation={onRegisterConsultation}
          />
        ))}
      </div>
    );
  }

  const { inProgress, waiting } = splitActiveEntries(entries);

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
                canManageQueue={canManageQueue}
                onStart={onStart}
                onComplete={onComplete}
                onCancel={onCancel}
                onCall={onCall}
                onViewRecord={onViewRecord}
                onRegisterConsultation={onRegisterConsultation}
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


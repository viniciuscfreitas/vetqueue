import { QueueEntry } from "@/lib/api";
import { QueueCard } from "./QueueCard";

interface QueueListProps {
  entries: QueueEntry[];
  onStart?: (id: string) => void;
  onComplete?: (id: string) => void;
  onCancel?: (id: string) => void;
  onCall?: (id: string) => void;
  emptyMessage?: string;
}

export function QueueList({
  entries,
  onStart,
  onComplete,
  onCancel,
  onCall,
  emptyMessage = "Nenhuma entrada na fila no momento",
}: QueueListProps) {
  if (entries.length === 0) {
    return (
      <div className="text-center py-12 text-muted-foreground">
        {emptyMessage}
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      {entries.map((entry) => (
        <QueueCard
          key={entry.id}
          entry={entry}
          onStart={onStart}
          onComplete={onComplete}
          onCancel={onCancel}
          onCall={onCall}
        />
      ))}
    </div>
  );
}


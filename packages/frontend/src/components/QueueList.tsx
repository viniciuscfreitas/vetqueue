import { QueueEntry } from "@/lib/api";
import { QueueCard } from "./QueueCard";

interface QueueListProps {
  entries: QueueEntry[];
  onStart?: (id: string) => void;
  onComplete?: (id: string) => void;
  onCancel?: (id: string) => void;
  emptyMessage?: string;
}

export function QueueList({
  entries,
  onStart,
  onComplete,
  onCancel,
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
    <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
      {entries.map((entry, index) => {
        const isLast = index === entries.length - 1;
        const colSpan = isLast && entries.length % 2 === 1 ? "md:col-span-1" : "md:col-span-2";
        return (
          <div key={entry.id} className={colSpan}>
            <QueueCard
              entry={entry}
              onStart={onStart}
              onComplete={onComplete}
              onCancel={onCancel}
            />
          </div>
        );
      })}
    </div>
  );
}


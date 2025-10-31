import { QueueEntry, Status } from "@/lib/api";
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";
import { PriorityBadge } from "./PriorityBadge";
import { Badge } from "./ui/badge";

interface QueueCardProps {
  entry: QueueEntry;
  onStart?: (id: string) => void;
  onComplete?: (id: string) => void;
  onCancel?: (id: string) => void;
}

const statusConfig = {
  [Status.WAITING]: {
    label: "Aguardando",
    className: "bg-yellow-100 text-yellow-800",
  },
  [Status.CALLED]: {
    label: "Chamado",
    className: "bg-blue-100 text-blue-800",
  },
  [Status.IN_PROGRESS]: {
    label: "Em Atendimento",
    className: "bg-purple-100 text-purple-800",
  },
  [Status.COMPLETED]: {
    label: "Finalizado",
    className: "bg-green-100 text-green-800",
  },
  [Status.CANCELLED]: {
    label: "Cancelado",
    className: "bg-gray-100 text-gray-800",
  },
};

export function QueueCard({
  entry,
  onStart,
  onComplete,
  onCancel,
}: QueueCardProps) {
  const status = statusConfig[entry.status];
  const canStart = entry.status === Status.CALLED || entry.status === Status.WAITING;
  const canComplete = entry.status === Status.IN_PROGRESS || entry.status === Status.CALLED;

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg">{entry.patientName}</CardTitle>
          <PriorityBadge priority={entry.priority} />
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-2">
          <div>
            <p className="text-sm text-muted-foreground">Tutor</p>
            <p className="font-medium">{entry.tutorName}</p>
          </div>
          <div>
            <p className="text-sm text-muted-foreground">Serviço</p>
            <p className="font-medium">{entry.serviceType}</p>
          </div>
          <div>
            <Badge className={status.className} variant="outline">
              {status.label}
            </Badge>
          </div>
          {entry.calledAt && (
            <div>
              <p className="text-xs text-muted-foreground">
                Chamado às {new Date(entry.calledAt).toLocaleTimeString()}
              </p>
            </div>
          )}
          {entry.completedAt && (
            <div>
              <p className="text-xs text-muted-foreground">
                Finalizado em {new Date(entry.completedAt).toLocaleString()}
              </p>
            </div>
          )}
          {(canStart || canComplete) && 
           (onStart || onComplete || onCancel) && (
            <div className="flex gap-2 pt-2">
              {canStart && onStart && (
                <button
                  onClick={() => onStart(entry.id)}
                  className="rounded bg-blue-600 px-3 py-1 text-sm text-white hover:bg-blue-700"
                >
                  Iniciar
                </button>
              )}
              {canComplete && onComplete && (
                <button
                  onClick={() => onComplete(entry.id)}
                  className="rounded bg-green-600 px-3 py-1 text-sm text-white hover:bg-green-700"
                >
                  Finalizar
                </button>
              )}
              {entry.status !== Status.COMPLETED && entry.status !== Status.CANCELLED && onCancel && (
                <button
                  onClick={() => onCancel(entry.id)}
                  className="rounded bg-red-600 px-3 py-1 text-sm text-white hover:bg-red-700"
                >
                  Cancelar
                </button>
              )}
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}


import { QueueEntry, Status } from "@/lib/api";
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";
import { PriorityBadge } from "./PriorityBadge";
import { Badge } from "./ui/badge";
import { Button } from "./ui/button";

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
          {entry.assignedVetId && (
            <div>
              <p className="text-xs text-muted-foreground">
                Atribuído a veterinário
              </p>
            </div>
          )}
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
          {onStart || onComplete || onCancel ? (
            <div className="flex gap-2 pt-2 flex-wrap">
              {entry.status === Status.CALLED && onStart && (
                <Button
                  onClick={() => onStart(entry.id)}
                  size="sm"
                  className="flex-1 min-w-[80px]"
                >
                  Iniciar
                </Button>
              )}
              {entry.status === Status.IN_PROGRESS && onComplete && (
                <Button
                  onClick={() => onComplete(entry.id)}
                  size="sm"
                  variant="default"
                  className="flex-1 min-w-[80px] bg-green-600 hover:bg-green-700"
                >
                  Finalizar
                </Button>
              )}
              {entry.status !== Status.COMPLETED &&
                entry.status !== Status.CANCELLED &&
                onCancel && (
                  <Button
                    onClick={() => onCancel(entry.id)}
                    size="sm"
                    variant="destructive"
                    className="flex-1 min-w-[80px]"
                  >
                    Cancelar
                  </Button>
                )}
            </div>
          ) : null}
        </div>
      </CardContent>
    </Card>
  );
}


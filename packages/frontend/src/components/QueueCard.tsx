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
  userRole?: string;
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
  userRole,
}: QueueCardProps) {
  const status = statusConfig[entry.status];
  const canStart = entry.status === Status.CALLED || entry.status === Status.WAITING;
  const canComplete = entry.status === Status.IN_PROGRESS || entry.status === Status.CALLED;
  const isVet = userRole === "VET";

  return (
    <Card className={isVet ? "border-2 border-blue-500 shadow-lg" : ""}>
      <CardHeader className={isVet ? "bg-blue-50 border-b-2 border-blue-200" : ""}>
        <div className="flex items-center justify-between">
          <CardTitle className={`${isVet ? "text-xl font-bold text-blue-900" : "text-lg"}`}>
            {entry.patientName}
          </CardTitle>
          <PriorityBadge priority={entry.priority} />
        </div>
      </CardHeader>
      <CardContent className={isVet ? "bg-blue-50/50" : ""}>
        <div className={isVet ? "space-y-3" : "space-y-2"}>
          <div>
            <p className={`${isVet ? "text-xs font-semibold text-blue-700" : "text-sm text-muted-foreground"}`}>Tutor</p>
            <p className={`${isVet ? "font-bold text-base" : "font-medium"}`}>{entry.tutorName}</p>
          </div>
          <div>
            <p className={`${isVet ? "text-xs font-semibold text-blue-700" : "text-sm text-muted-foreground"}`}>Serviço</p>
            <p className={`${isVet ? "font-bold text-base" : "font-medium"}`}>{entry.serviceType}</p>
          </div>
          <div>
            <Badge className={status.className} variant="outline">
              {status.label}
            </Badge>
          </div>
          {entry.assignedVet && (
            <div className={isVet ? "bg-blue-100 p-2 rounded-md border border-blue-300" : ""}>
              <p className={`${isVet ? "text-xs font-bold text-blue-800" : "text-xs text-muted-foreground"}`}>Veterinário</p>
              <p className={`${isVet ? "font-bold text-sm text-blue-900" : "font-medium text-sm"}`}>{entry.assignedVet.name}</p>
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


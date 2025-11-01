import { QueueEntry, Status } from "@/lib/api";
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";
import { PriorityBadge } from "./PriorityBadge";
import { Badge } from "./ui/badge";
import { Button } from "./ui/button";
import { calculateWaitTime, calculateServiceTime } from "@/lib/utils";
import { useState, useEffect } from "react";
import { Clock, User, Stethoscope, CheckCircle2, XCircle, UserCircle } from "lucide-react";

interface QueueCardProps {
  entry: QueueEntry;
  onStart?: (id: string) => void;
  onComplete?: (id: string) => void;
  onCancel?: (id: string) => void;
  onCall?: (id: string) => void;
}

const statusConfig = {
  [Status.WAITING]: {
    label: "Aguardando",
    className: "bg-amber-100 text-amber-800 border-amber-300",
    icon: Clock,
  },
  [Status.CALLED]: {
    label: "Chamado",
    className: "bg-blue-100 text-blue-800 border-blue-300",
    icon: UserCircle,
  },
  [Status.IN_PROGRESS]: {
    label: "Em Atendimento",
    className: "bg-purple-100 text-purple-800 border-purple-300",
    icon: Stethoscope,
  },
  [Status.COMPLETED]: {
    label: "Finalizado",
    className: "bg-green-100 text-green-800 border-green-300",
    icon: CheckCircle2,
  },
  [Status.CANCELLED]: {
    label: "Cancelado",
    className: "bg-gray-100 text-gray-800 border-gray-300",
    icon: XCircle,
  },
};

export function QueueCard({
  entry,
  onStart,
  onComplete,
  onCancel,
  onCall,
}: QueueCardProps) {
  const status = statusConfig[entry.status];
  const canStart = entry.status === Status.CALLED || entry.status === Status.WAITING;
  const canComplete = entry.status === Status.IN_PROGRESS || entry.status === Status.CALLED;
  
  const [, setCurrentTime] = useState(Date.now());
  
  useEffect(() => {
    if (entry.status === Status.WAITING || entry.status === Status.IN_PROGRESS) {
      const interval = setInterval(() => setCurrentTime(Date.now()), 1000);
      return () => clearInterval(interval);
    }
  }, [entry.status]);
  
  const waitTime = calculateWaitTime(entry.createdAt, entry.calledAt);
  const serviceTime = calculateServiceTime(entry.calledAt, entry.completedAt);

  const StatusIcon = status.icon;
  
  return (
    <Card className="transition-all hover:shadow-md">
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between gap-2">
          <div className="flex-1 min-w-0">
            <CardTitle className="text-xl font-bold mb-1 truncate">
              {entry.patientName}
            </CardTitle>
            <div className="flex items-center gap-2 mt-1">
              <PriorityBadge priority={entry.priority} />
              <Badge className={`${status.className} border flex items-center gap-1`} variant="outline">
                <StatusIcon className="h-3 w-3" />
                {status.label}
              </Badge>
            </div>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="space-y-2.5">
          <div className="flex items-start gap-2">
            <User className="h-4 w-4 text-muted-foreground mt-0.5 flex-shrink-0" />
            <div className="flex-1 min-w-0">
              <p className="text-xs text-muted-foreground uppercase tracking-wide">Tutor</p>
              <p className="font-semibold text-sm">{entry.tutorName}</p>
            </div>
          </div>
          
          <div className="flex items-start gap-2">
            <Stethoscope className="h-4 w-4 text-muted-foreground mt-0.5 flex-shrink-0" />
            <div className="flex-1 min-w-0">
              <p className="text-xs text-muted-foreground uppercase tracking-wide">Serviço</p>
              <p className="font-semibold text-sm">{entry.serviceType}</p>
            </div>
          </div>

          {entry.status === Status.WAITING && waitTime && (
            <div className="flex items-start gap-2 bg-amber-50 p-2 rounded-md border border-amber-200">
              <Clock className="h-4 w-4 text-amber-700 mt-0.5 flex-shrink-0" />
              <div className="flex-1 min-w-0">
                <p className="text-xs text-amber-700 font-medium">Tempo de espera</p>
                <p className="font-bold text-amber-900">{waitTime}</p>
              </div>
            </div>
          )}

          <div className="grid grid-cols-2 gap-3 pt-1">
            {waitTime && entry.status !== Status.WAITING && (
              <div>
                <p className="text-xs text-muted-foreground">Espera</p>
                <p className="font-semibold text-sm">{waitTime}</p>
              </div>
            )}
            {(entry.status === Status.IN_PROGRESS || entry.status === Status.COMPLETED) && serviceTime && (
              <div>
                <p className="text-xs text-muted-foreground">Atendimento</p>
                <p className="font-semibold text-sm">{serviceTime}</p>
              </div>
            )}
          </div>

          {entry.assignedVet && (
            <div className="pt-1 border-t">
              <p className="text-xs text-muted-foreground mb-1">Veterinário</p>
              <p className="font-medium text-sm">{entry.assignedVet.name}</p>
            </div>
          )}
        </div>

        {onStart || onComplete || onCancel || onCall ? (
          <div className="flex gap-2 pt-3 border-t">
            {entry.status === Status.WAITING && onCall && (
              <Button
                onClick={() => onCall(entry.id)}
                size="sm"
                className="flex-1 bg-blue-600 hover:bg-blue-700 text-white"
              >
                Chamar
              </Button>
            )}
            {entry.status === Status.CALLED && onStart && (
              <Button
                onClick={() => onStart(entry.id)}
                size="sm"
                className="flex-1"
              >
                Iniciar
              </Button>
            )}
            {entry.status === Status.IN_PROGRESS && onComplete && (
              <Button
                onClick={() => onComplete(entry.id)}
                size="sm"
                className="flex-1 bg-green-600 hover:bg-green-700 text-white"
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
                  className="flex-1"
                >
                  Cancelar
                </Button>
              )}
          </div>
        ) : null}
      </CardContent>
    </Card>
  );
}


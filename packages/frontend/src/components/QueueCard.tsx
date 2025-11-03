import { QueueEntry, Status, Role } from "@/lib/api";
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";
import { PriorityBadge } from "./PriorityBadge";
import { Badge } from "./ui/badge";
import { Button } from "./ui/button";
import { calculateWaitTime, calculateServiceTime } from "@/lib/utils";
import { useState, useEffect } from "react";
import { Clock, User, Stethoscope, CheckCircle2, XCircle, UserCircle, DoorOpen, Pencil, FileText } from "lucide-react";
import { EditQueueDialog } from "./EditQueueDialog";
import { useQueryClient } from "@tanstack/react-query";

interface QueueCardProps {
  entry: QueueEntry;
  position?: number;
  userRole?: Role;
  onStart?: (id: string) => void;
  onComplete?: (id: string) => void;
  onCancel?: (id: string) => void;
  onCall?: (id: string) => void;
  onViewRecord?: (patientId: string, queueEntryId: string) => void;
}

const statusConfig = {
  [Status.WAITING]: {
    label: "Aguardando",
    bgColor: "rgba(183, 136, 68, 0.15)",
    textColor: "#B78844",
    borderColor: "#B78844",
    icon: Clock,
  },
  [Status.CALLED]: {
    label: "Chamado",
    bgColor: "rgba(37, 157, 227, 0.15)",
    textColor: "#259DE3",
    borderColor: "#259DE3",
    icon: UserCircle,
  },
  [Status.IN_PROGRESS]: {
    label: "Em Atendimento",
    bgColor: "rgba(91, 150, 183, 0.15)",
    textColor: "#5B96B7",
    borderColor: "#5B96B7",
    icon: Stethoscope,
  },
  [Status.COMPLETED]: {
    label: "Finalizado",
    bgColor: "rgba(34, 197, 94, 0.15)",
    textColor: "#22c55e",
    borderColor: "#22c55e",
    icon: CheckCircle2,
  },
  [Status.CANCELLED]: {
    label: "Cancelado",
    bgColor: "rgba(107, 114, 128, 0.15)",
    textColor: "#6b7280",
    borderColor: "#6b7280",
    icon: XCircle,
  },
};

export function QueueCard({
  entry,
  position,
  userRole,
  onStart,
  onComplete,
  onCancel,
  onCall,
  onViewRecord,
}: QueueCardProps) {
  const status = statusConfig[entry.status];
  const canStart = entry.status === Status.CALLED || entry.status === Status.WAITING;
  const canComplete = entry.status === Status.IN_PROGRESS || entry.status === Status.CALLED;
  
  const [, setCurrentTime] = useState(Date.now());
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  
  useEffect(() => {
    if (entry.status === Status.WAITING || entry.status === Status.IN_PROGRESS) {
      const interval = setInterval(() => setCurrentTime(Date.now()), 1000);
      return () => clearInterval(interval);
    }
  }, [entry.status]);
  
  const waitTime = calculateWaitTime(entry.createdAt, entry.calledAt);
  const serviceTime = calculateServiceTime(entry.calledAt, entry.completedAt);

  const StatusIcon = status.icon;
  const canEdit = entry.status === Status.WAITING && userRole === Role.RECEPCAO;
  const queryClient = useQueryClient();
  
  return (
    <>
      <Card className="transition-all hover:shadow-md">
        <CardHeader className="pb-3">
          <div className="flex items-start justify-between gap-2">
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-1">
                <CardTitle className="text-xl font-bold truncate">
                  {entry.patientName}
                </CardTitle>
                {position !== undefined && entry.status === Status.WAITING && (
                  <Badge 
                    className="flex-shrink-0 font-semibold"
                    style={{
                      backgroundColor: '#3B3839',
                      color: 'white',
                    }}
                  >
                    #{position}
                  </Badge>
                )}
              </div>
              <div className="flex items-center gap-2 mt-1">
                <PriorityBadge priority={entry.priority} />
                <Badge 
                  className="border flex items-center gap-1" 
                  variant="outline"
                  style={{
                    backgroundColor: status.bgColor,
                    color: status.textColor,
                    borderColor: status.borderColor,
                  }}
                >
                  <StatusIcon className="h-3 w-3" />
                  {status.label}
                </Badge>
              </div>
            </div>
            {canEdit && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setEditDialogOpen(true)}
                className="flex-shrink-0"
              >
                <Pencil className="h-4 w-4" />
              </Button>
            )}
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
            <div 
              className="flex items-start gap-2 p-2 rounded-md border"
              style={{
                backgroundColor: "rgba(183, 136, 68, 0.1)",
                borderColor: "#B78844",
              }}
            >
              <Clock className="h-4 w-4 mt-0.5 flex-shrink-0" style={{ color: '#B78844' }} />
              <div className="flex-1 min-w-0">
                <p className="text-xs font-medium" style={{ color: '#B78844' }}>Tempo de espera</p>
                <p className="font-bold" style={{ color: '#B78844' }}>{waitTime}</p>
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
            <div className="pt-1 border-t space-y-2">
              <div>
                <p className="text-xs text-muted-foreground mb-1">Veterinário</p>
                <p className="font-medium text-sm">{entry.assignedVet.name}</p>
              </div>
              {entry.room && (
                <div className="flex items-center gap-2">
                  <DoorOpen className="h-3 w-3 text-muted-foreground" />
                  <p className="text-xs text-muted-foreground">Sala: <span className="font-medium">{entry.room.name}</span></p>
                </div>
              )}
            </div>
          )}
        </div>

        {onStart || onComplete || onCancel || onCall ? (
          <div className="flex gap-2 pt-3 border-t">
            {entry.status === Status.WAITING && onCall && (
              <Button
                onClick={() => onCall(entry.id)}
                size="sm"
                className="flex-1"
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
            {entry.status === Status.IN_PROGRESS && entry.patientId && onViewRecord && (
              <Button
                onClick={() => onViewRecord(entry.patientId!, entry.id)}
                size="sm"
                variant="outline"
                className="flex-1"
              >
                <FileText className="h-4 w-4 mr-1" />
                Ver Prontuário
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

    <EditQueueDialog
      entry={entry}
      open={editDialogOpen}
      onOpenChange={setEditDialogOpen}
      onSuccess={() => {
        queryClient.invalidateQueries({ queryKey: ["queue"] });
      }}
    />
    </>
  );
}


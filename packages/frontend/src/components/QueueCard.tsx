import { QueueEntry, Status, ServiceType, PaymentStatus } from "@/lib/api";
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";
import { PriorityBadge } from "./PriorityBadge";
import { Badge } from "./ui/badge";
import { Button } from "./ui/button";
import { calculateWaitTime, calculateServiceTime, cn } from "@/lib/utils";
import { useState, useEffect } from "react";
import { Clock, User, Stethoscope, CheckCircle2, DoorOpen, Pencil, FileText, ChevronDown, ChevronUp } from "lucide-react";
import { EditQueueDialog } from "./EditQueueDialog";
import { useQueryClient } from "@tanstack/react-query";

interface QueueCardProps {
  entry: QueueEntry;
  position?: number;
  canManageQueue?: boolean;
  onStart?: (id: string) => void;
  onComplete?: (id: string) => void;
  onCancel?: (id: string) => void;
  onCall?: (id: string) => void;
  onViewRecord?: (patientId: string, queueEntryId: string) => void;
  onRegisterConsultation?: (patientId: string, queueEntryId: string) => void;
  onRequeue?: (id: string) => void;
  tabContext?: "emergency" | "triage" | "in-progress" | "completed" | "paid";
}

const statusConfig = {
  [Status.WAITING]: {
    label: "Aguardando",
    badgeClass: "bg-amber-100 text-amber-800 border-amber-200",
  },
  [Status.CALLED]: {
    label: "Chamado",
    badgeClass: "bg-sky-100 text-sky-700 border-sky-200",
  },
  [Status.IN_PROGRESS]: {
    label: "Em atendimento",
    badgeClass: "bg-blue-100 text-blue-700 border-blue-200",
  },
  [Status.COMPLETED]: {
    label: "Finalizado",
    badgeClass: "bg-emerald-100 text-emerald-700 border-emerald-200",
  },
  [Status.CANCELLED]: {
    label: "Cancelado",
    badgeClass: "bg-slate-100 text-slate-600 border-slate-200",
  },
} as const;

export function QueueCard({
  entry,
  position,
  canManageQueue = false,
  onStart,
  onComplete,
  onCancel,
  onCall,
  onViewRecord,
  onRegisterConsultation: _onRegisterConsultation,
  onRequeue,
  tabContext,
}: QueueCardProps) {
  const status = statusConfig[entry.status];
  const canStart = entry.status === Status.CALLED || entry.status === Status.WAITING;
  const canComplete = entry.status === Status.IN_PROGRESS || entry.status === Status.CALLED;

  const [, setCurrentTime] = useState(Date.now());
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [showDetails, setShowDetails] = useState(false);

  useEffect(() => {
    if (entry.status === Status.WAITING || entry.status === Status.IN_PROGRESS) {
      const interval = setInterval(() => setCurrentTime(Date.now()), 1000);
      return () => clearInterval(interval);
    }
  }, [entry.status]);

  useEffect(() => {
    setShowDetails(false);
  }, [entry.id]);

  const waitTime = calculateWaitTime(entry.createdAt, entry.calledAt);
  const serviceTime = calculateServiceTime(entry.calledAt, entry.completedAt);

  const canEdit = entry.status === Status.WAITING && canManageQueue;
  const queryClient = useQueryClient();
  const tabAccent = {
    emergency: "ring-1 ring-red-200",
    triage: "ring-1 ring-sky-200",
    "in-progress": "ring-1 ring-orange-200",
    completed: "ring-1 ring-emerald-200",
    paid: "ring-1 ring-emerald-300",
  } as const;

  const waitCardHighlight =
    entry.status === Status.WAITING
      ? "border-amber-200 bg-amber-50"
      : "border-border bg-background";
  const serviceCardHighlight =
    entry.status === Status.IN_PROGRESS
      ? "border-blue-200 bg-blue-50"
      : "border-border bg-background";

  return (
     <>
      <Card
        className={cn(
          "transition-all hover:shadow-md border border-border bg-background",
          tabContext && tabAccent[tabContext] ? tabAccent[tabContext] : null,
        )}
      >
        <CardHeader className="pb-3">
          <div className="flex items-start justify-between gap-3">
            <div className="flex-1 min-w-0 space-y-2">
              <div className="flex flex-wrap items-center gap-2">
                <CardTitle className="text-lg font-semibold truncate">
                  {entry.patientName}
                </CardTitle>
                {entry.simplesVetId && (
                  <Badge variant="outline" className="text-xs font-medium">
                    #{entry.simplesVetId}
                  </Badge>
                )}
                {position !== undefined && entry.status === Status.WAITING && (
                  <Badge variant="secondary" className="text-xs font-semibold uppercase tracking-wide">
                    Fila #{position}
                  </Badge>
                )}
              </div>
              <div className="flex flex-wrap items-center gap-2 text-sm text-muted-foreground">
                <span className="font-medium">{entry.serviceType}</span>
                <PriorityBadge priority={entry.priority} />
                <Badge
                  variant="outline"
                  className={cn(
                    "border text-xs font-medium uppercase tracking-wide",
                    status.badgeClass
                  )}
                >
                  {status.label}
                </Badge>
              </div>
              <p className="text-sm text-muted-foreground truncate">{entry.tutorName}</p>
            </div>
            <div className="flex items-start gap-2">
              {canEdit && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setEditDialogOpen(true)}
                  aria-label="Editar atendimento"
                >
                  <Pencil className="h-4 w-4" />
                </Button>
              )}
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowDetails((prev) => !prev)}
                aria-label={showDetails ? "Ocultar detalhes" : "Mostrar detalhes"}
              >
                {showDetails ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <div className={cn("rounded-md border p-3 transition-colors", waitCardHighlight)}>
              <div className="flex items-center gap-2 text-xs text-muted-foreground uppercase tracking-wide">
                <Clock className="h-3 w-3" />
                Espera
              </div>
              <p className="mt-1 text-sm font-semibold">{waitTime || "—"}</p>
            </div>
            <div className={cn("rounded-md border p-3 transition-colors", serviceCardHighlight)}>
              <div className="flex items-center gap-2 text-xs text-muted-foreground uppercase tracking-wide">
                <Stethoscope className="h-3 w-3" />
                Atendimento
              </div>
              <p className="mt-1 text-sm font-semibold">{serviceTime || "—"}</p>
            </div>
          </div>

          {(onStart || onComplete || onCancel || onCall || onViewRecord) && (
            <div className="flex flex-wrap gap-2">
              {entry.status === Status.WAITING && onCall && (
                <Button onClick={() => onCall(entry.id)} size="sm" className="flex-1 sm:flex-none">
                  Chamar
                </Button>
              )}
              {entry.status === Status.CALLED && onStart && (
                <Button onClick={() => onStart(entry.id)} size="sm" className="flex-1 sm:flex-none">
                  Iniciar
                </Button>
              )}
              {tabContext === "in-progress" && onRequeue && (
                <Button
                  onClick={() => onRequeue(entry.id)}
                  size="sm"
                  variant="outline"
                  className="flex-1 sm:flex-none"
                >
                  Reenfileirar
                </Button>
              )}
              {entry.status === Status.IN_PROGRESS &&
                entry.serviceType !== ServiceType.CONSULTA &&
                entry.serviceType !== "Consulta" &&
                entry.patientId &&
                onViewRecord && (
                  <Button
                    onClick={() => onViewRecord(entry.patientId!, entry.id)}
                    size="sm"
                    variant="outline"
                    className="flex-1 sm:flex-none"
                  >
                    <FileText className="mr-2 h-4 w-4" />
                    Ver Prontuário
                  </Button>
                )}
              {entry.status === Status.IN_PROGRESS && onComplete && (
                <Button
                  onClick={() => onComplete(entry.id)}
                  size="sm"
                  className="flex-1 sm:flex-none bg-green-600 text-white hover:bg-green-700"
                >
                  Finalizar
                </Button>
              )}
              {tabContext === "completed" && entry.paymentStatus !== PaymentStatus.PAID && onRequeue && (
                <Button
                  onClick={() => onRequeue(entry.id)}
                  size="sm"
                  variant="outline"
                  className="flex-1 sm:flex-none"
                >
                  Retornar à fila
                </Button>
              )}
              {entry.status !== Status.COMPLETED &&
                entry.status !== Status.CANCELLED &&
                onCancel && (
                  <Button
                    onClick={() => onCancel(entry.id)}
                    size="sm"
                    variant="destructive"
                    className="flex-1 sm:flex-none"
                  >
                    Cancelar
                  </Button>
                )}
            </div>
          )}

          {showDetails && (
            <div className="space-y-3 border-t pt-3">
              <div className="flex items-start gap-2">
                <User className="mt-0.5 h-4 w-4 text-muted-foreground" />
                <div className="flex-1 min-w-0">
                  <p className="text-xs text-muted-foreground uppercase tracking-wide">Tutor</p>
                  <p className="text-sm font-medium break-words">{entry.tutorName}</p>
                </div>
              </div>

              <div className="flex items-start gap-2">
                <Stethoscope className="mt-0.5 h-4 w-4 text-muted-foreground" />
                <div className="flex-1 min-w-0">
                  <p className="text-xs text-muted-foreground uppercase tracking-wide">Serviço</p>
                  <p className="text-sm font-medium break-words">{entry.serviceType}</p>
                </div>
              </div>

              {entry.assignedVet && (
                <div className="flex items-start gap-2">
                  <CheckCircle2 className="mt-0.5 h-4 w-4 text-muted-foreground" />
                  <div className="flex-1 min-w-0">
                    <p className="text-xs text-muted-foreground uppercase tracking-wide">Veterinário</p>
                    <p className="text-sm font-medium break-words">{entry.assignedVet.name}</p>
                    {entry.room && (
                      <div className="mt-1 flex items-center gap-2 text-xs text-muted-foreground">
                        <DoorOpen className="h-3 w-3" />
                        Sala {entry.room.name}
                      </div>
                    )}
                  </div>
                </div>
              )}

              {!entry.assignedVet && entry.room && (
                <div className="flex items-start gap-2">
                  <DoorOpen className="mt-0.5 h-4 w-4 text-muted-foreground" />
                  <div className="flex-1 min-w-0">
                    <p className="text-xs text-muted-foreground uppercase tracking-wide">Sala</p>
                    <p className="text-sm font-medium break-words">{entry.room.name}</p>
                  </div>
                </div>
              )}

              {entry.simplesVetId && (
                <div className="flex items-start gap-2">
                  <FileText className="mt-0.5 h-4 w-4 text-muted-foreground" />
                  <div className="flex-1 min-w-0">
                    <p className="text-xs text-muted-foreground uppercase tracking-wide">Ficha SimplesVet</p>
                    <p className="text-sm font-medium break-words">#{entry.simplesVetId}</p>
                  </div>
                </div>
              )}
              {entry.paymentAmount && (
                <div className="flex items-start gap-2">
                  <CheckCircle2 className="mt-0.5 h-4 w-4 text-muted-foreground" />
                  <div className="flex-1 min-w-0">
                    <p className="text-xs text-muted-foreground uppercase tracking-wide">Valor estimado</p>
                    <p className="text-sm font-medium break-words" title={`Status: ${entry.paymentStatus ?? "PENDENTE"}`}>
                      {entry.paymentAmount}
                    </p>
                  </div>
                </div>
              )}
            </div>
          )}
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


import { QueueEntry, Status, ServiceType, PaymentStatus } from "@/lib/api";
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";
import { PriorityBadge } from "./PriorityBadge";
import { Badge } from "./ui/badge";
import { Button } from "./ui/button";
import { calculateWaitTime, calculateServiceTime, cn } from "@/lib/utils";
import { useState, useEffect } from "react";
import {
  Calendar,
  Clock,
  CreditCard,
  User,
  Stethoscope,
  CheckCircle2,
  DoorOpen,
  Pencil,
  FileText,
  Hash,
} from "lucide-react";
import { EditQueueDialog } from "./EditQueueDialog";
import { useQueryClient } from "@tanstack/react-query";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "./ui/dialog";

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
  tabContext?: "queue" | "in-progress" | "completed" | "paid";
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

const SERVICE_LABELS: Record<string, string> = {
  [ServiceType.CONSULTA]: "Consulta",
  [ServiceType.VACINACAO]: "Vacinação",
  [ServiceType.CIRURGIA]: "Cirurgia",
  [ServiceType.EXAME]: "Exame",
  [ServiceType.BANHO_TOSA]: "Banho e Tosa",
};

const PAYMENT_STATUS_LABELS: Record<PaymentStatus, string> = {
  [PaymentStatus.PENDING]: "Pendente",
  [PaymentStatus.PARTIAL]: "Parcial",
  [PaymentStatus.PAID]: "Pago",
  [PaymentStatus.CANCELLED]: "Cancelado",
};

function getServiceLabel(serviceType: string): string {
  if (!serviceType) {
    return "Serviço";
  }
  return SERVICE_LABELS[serviceType] ?? serviceType;
}

function getPaymentStatusLabel(status?: PaymentStatus): string | undefined {
  if (!status) return undefined;
  return PAYMENT_STATUS_LABELS[status] ?? status;
}

export function QueueCard({
  entry,
  position,
  canManageQueue = false,
  onStart,
  onComplete,
  onCancel,
  onCall,
  onViewRecord,
  onRegisterConsultation,
  onRequeue,
  tabContext,
}: QueueCardProps) {
  const status = statusConfig[entry.status];
  const canStart = entry.status === Status.CALLED || entry.status === Status.WAITING;
  const canComplete = entry.status === Status.IN_PROGRESS || entry.status === Status.CALLED;

  const [, setCurrentTime] = useState(Date.now());
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [detailsDialogOpen, setDetailsDialogOpen] = useState(false);

  useEffect(() => {
    if (entry.status === Status.WAITING || entry.status === Status.IN_PROGRESS) {
      const interval = setInterval(() => setCurrentTime(Date.now()), 1000);
      return () => clearInterval(interval);
    }
  }, [entry.status]);

  const waitTime = calculateWaitTime(entry.createdAt, entry.calledAt);
  const serviceTime = calculateServiceTime(entry.calledAt, entry.completedAt);
  const serviceLabel = getServiceLabel(entry.serviceType);
  const paymentStatusLabel = getPaymentStatusLabel(entry.paymentStatus);

  const canEdit = entry.status === Status.WAITING && canManageQueue;
  const queryClient = useQueryClient();
  const tabAccent = {
    queue: "ring-1 ring-slate-200",
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

  const formatTime = (value?: string | null) => {
    if (!value) return undefined;
    try {
      return new Date(value).toLocaleTimeString("pt-BR", {
        hour: "2-digit",
        minute: "2-digit",
      });
    } catch {
      return undefined;
    }
  };

  const primaryActions: JSX.Element[] = [];
  const secondaryActions: JSX.Element[] = [];

  if (entry.status === Status.WAITING && onCall) {
    primaryActions.push(
      <Button key="call" onClick={() => onCall(entry.id)} size="sm" className="flex-1 sm:flex-none">
        Chamar
      </Button>
    );
  }

  if (entry.status === Status.CALLED && onStart) {
    primaryActions.push(
      <Button key="start" onClick={() => onStart(entry.id)} size="sm" className="flex-1 sm:flex-none">
        Iniciar
      </Button>
    );
  }

  if (entry.status === Status.IN_PROGRESS && onComplete) {
    primaryActions.push(
      <Button
        key="complete"
        onClick={() => onComplete(entry.id)}
        size="sm"
        className="flex-1 sm:flex-none bg-green-600 text-white hover:bg-green-700"
      >
        Finalizar
      </Button>
    );
  }

  if (tabContext === "in-progress" && onRequeue) {
    secondaryActions.push(
      <Button
        key="requeue-in-progress"
        onClick={() => onRequeue(entry.id)}
        size="sm"
        variant="outline"
        className="flex-1 sm:flex-none"
      >
        Reenfileirar
      </Button>
    );
  }

  if (
    entry.status === Status.IN_PROGRESS &&
    entry.serviceType === ServiceType.CONSULTA &&
    entry.patientId &&
    onRegisterConsultation
  ) {
    secondaryActions.push(
      <Button
        key="register-consultation"
        onClick={() => onRegisterConsultation(entry.patientId!, entry.id)}
        size="sm"
        variant="outline"
        className="flex-1 sm:flex-none"
      >
        Registrar consulta
      </Button>
    );
  }

  if (
    entry.status === Status.IN_PROGRESS &&
    entry.serviceType !== ServiceType.CONSULTA &&
    entry.patientId &&
    onViewRecord
  ) {
    secondaryActions.push(
      <Button
        key="view-record"
        onClick={() => onViewRecord(entry.patientId!, entry.id)}
        size="sm"
        variant="outline"
        className="flex-1 sm:flex-none"
      >
        <FileText className="mr-2 h-4 w-4" />
        Ver Prontuário
      </Button>
    );
  }

  if (tabContext === "completed" && entry.paymentStatus !== PaymentStatus.PAID && onRequeue) {
    secondaryActions.push(
      <Button
        key="requeue-completed"
        onClick={() => onRequeue(entry.id)}
        size="sm"
        variant="outline"
        className="flex-1 sm:flex-none"
      >
        Retornar à fila
      </Button>
    );
  }

  if (entry.status !== Status.COMPLETED && entry.status !== Status.CANCELLED && onCancel) {
    secondaryActions.push(
      <Button
        key="cancel"
        onClick={() => onCancel(entry.id)}
        size="sm"
        variant="destructive"
        className="flex-1 sm:flex-none"
      >
        Cancelar
      </Button>
    );
  }

  return (
    <>
      <Card
        className={cn(
          "w-full max-w-xl rounded-xl border border-border bg-background transition-shadow hover:shadow-md sm:mx-auto",
          tabContext && tabAccent[tabContext] ? tabAccent[tabContext] : null,
        )}
      >
        <CardHeader className="pb-2">
          <div className="flex items-start justify-between gap-3">
            <div className="flex flex-wrap items-center gap-2 text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
              {entry.simplesVetId && (
                <Badge variant="outline" className="flex items-center gap-1 rounded-md px-2 py-0.5">
                  <Hash className="h-3 w-3" />
                  {entry.simplesVetId}
                </Badge>
              )}
              {position !== undefined && entry.status === Status.WAITING && (
                <Badge variant="secondary" className="rounded-md px-2 py-0.5">
                  Fila #{position}
                </Badge>
              )}
              <PriorityBadge priority={entry.priority} />
              <Badge
                variant="outline"
                className={cn(
                  "rounded-md border px-2 py-0.5 text-[11px] font-semibold uppercase tracking-wide",
                  status.badgeClass
                )}
              >
                {status.label}
              </Badge>
            </div>

            <Dialog open={detailsDialogOpen} onOpenChange={setDetailsDialogOpen}>
              <div className="flex items-center gap-1">
                {canEdit && (
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => setEditDialogOpen(true)}
                    aria-label="Editar atendimento"
                    className="h-7 w-7 rounded-full"
                  >
                    <Pencil className="h-3.5 w-3.5" />
                  </Button>
                )}
                <DialogTrigger asChild>
                  <Button
                    variant="ghost"
                    size="icon"
                    aria-label="Ver detalhes do atendimento"
                    className="h-7 w-7 rounded-full"
                  >
                    <FileText className="h-3.5 w-3.5" />
                  </Button>
                </DialogTrigger>
              </div>

              <DialogContent className="max-w-2xl">
                <DialogHeader>
                  <DialogTitle>Detalhes do atendimento</DialogTitle>
                </DialogHeader>

                <div className="space-y-4">
                  <div className="space-y-3">
                    <div className="flex items-start gap-2">
                      <User className="mt-0.5 h-4 w-4 text-muted-foreground" />
                      <div className="flex-1 min-w-0 space-y-1">
                        <p className="text-xs text-muted-foreground uppercase tracking-wide">Tutor</p>
                        <p className="text-sm font-medium break-words">{entry.tutorName}</p>
                        {entry.simplesVetId && (
                          <p className="text-xs text-muted-foreground">Ficha #{entry.simplesVetId}</p>
                        )}
                      </div>
                    </div>

                    <div className="flex items-start gap-2">
                      <Stethoscope className="mt-0.5 h-4 w-4 text-muted-foreground" />
                      <div className="flex-1 min-w-0 space-y-1">
                        <p className="text-xs text-muted-foreground uppercase tracking-wide">Serviço</p>
                        <p className="text-sm font-medium break-words">{serviceLabel}</p>
                        {entry.hasScheduledAppointment && (
                          <p className="text-xs text-muted-foreground">
                            {entry.scheduledAt
                              ? `Agendado para ${new Date(entry.scheduledAt).toLocaleString("pt-BR", {
                                  hour: "2-digit",
                                  minute: "2-digit",
                                  day: "2-digit",
                                  month: "2-digit",
                                })}`
                              : "Agendamento confirmado"}
                          </p>
                        )}
                      </div>
                    </div>

                    {entry.assignedVet && (
                      <div className="flex items-start gap-2">
                        <CheckCircle2 className="mt-0.5 h-4 w-4 text-muted-foreground" />
                        <div className="flex-1 min-w-0 space-y-1">
                          <p className="text-xs text-muted-foreground uppercase tracking-wide">Veterinário</p>
                          <p className="text-sm font-medium break-words">{entry.assignedVet.name}</p>
                        </div>
                      </div>
                    )}

                    {entry.room && (
                      <div className="flex items-start gap-2">
                        <DoorOpen className="mt-0.5 h-4 w-4 text-muted-foreground" />
                        <div className="flex-1 min-w-0 space-y-1">
                          <p className="text-xs text-muted-foreground uppercase tracking-wide">Sala</p>
                          <p className="text-sm font-medium break-words">{entry.room.name}</p>
                        </div>
                      </div>
                    )}
                  </div>

                  {(entry.paymentAmount || paymentStatusLabel) && (
                    <div className="space-y-1 rounded-md border border-border bg-muted/30 p-3 text-sm">
                      <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Pagamento</p>
                      {entry.paymentAmount && <p className="font-medium">Valor: R$ {entry.paymentAmount}</p>}
                      {paymentStatusLabel && (
                        <p className="text-xs uppercase tracking-wide text-muted-foreground">Status: {paymentStatusLabel}</p>
                      )}
                    </div>
                  )}
                </div>
              </DialogContent>
            </Dialog>
          </div>
        </CardHeader>
        <CardContent className="space-y-3 pb-4 pt-0">
          <div className="flex flex-col gap-1">
            <CardTitle className="text-lg font-semibold leading-tight text-foreground">
              {entry.patientName}
            </CardTitle>
            <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-sm text-muted-foreground">
              <span className="font-medium text-foreground">{serviceLabel}</span>
              <span className="flex items-center gap-1">
                <User className="h-3.5 w-3.5" />
                {entry.tutorName}
              </span>
              {entry.assignedVet && (
                <span className="flex items-center gap-1">
                  <Stethoscope className="h-3.5 w-3.5" />
                  {entry.assignedVet.name}
                </span>
              )}
              {entry.room && (
                <span className="flex items-center gap-1">
                  <DoorOpen className="h-3.5 w-3.5" />
                  Sala {entry.room.name}
                </span>
              )}
            </div>
          </div>

          {(() => {
            const metrics: Array<{
              key: string;
              label: string;
              icon: JSX.Element;
              value: string;
              highlightClass?: string;
            }> = [];

            if (tabContext === "queue" || !tabContext) {
              metrics.push({
                key: "wait",
                label: "Espera",
                icon: <Clock className="h-3 w-3" />,
                value: waitTime || "—",
                highlightClass: waitCardHighlight,
              });

              const scheduledValue = entry.hasScheduledAppointment
                ? entry.scheduledAt
                  ? formatTime(entry.scheduledAt) ?? "Agendado"
                  : "Agendado"
                : formatTime(entry.createdAt) ?? "—";

              metrics.push({
                key: "schedule",
                label: entry.hasScheduledAppointment ? "Agendamento" : "Chegada",
                icon: <Calendar className="h-3 w-3" />,
                value: scheduledValue,
              });
            } else if (tabContext === "in-progress") {
              metrics.push({
                key: "service",
                label: "Atendimento",
                icon: <Stethoscope className="h-3 w-3" />,
                value: serviceTime || "—",
                highlightClass: serviceCardHighlight,
              });

              const calledAtTime = formatTime(entry.calledAt);
              if (calledAtTime) {
                metrics.push({
                  key: "called-at",
                  label: "Chamado às",
                  icon: <Clock className="h-3 w-3" />,
                  value: calledAtTime,
                });
              }
            } else {
              metrics.push({
                key: "service",
                label: "Atendimento",
                icon: <Stethoscope className="h-3 w-3" />,
                value: serviceTime || "—",
              });

              const paymentSummary = [
                entry.paymentAmount ? `R$ ${entry.paymentAmount}` : null,
                paymentStatusLabel ? `Status ${paymentStatusLabel}` : null,
              ]
                .filter(Boolean)
                .join(" • ") || "—";

              metrics.push({
                key: "payment",
                label: "Pagamento",
                icon: <CreditCard className="h-3 w-3" />,
                value: paymentSummary,
              });
            }

            if (metrics.length === 0) {
              return null;
            }

            return metrics.length > 0 ? (
              <div className="flex flex-wrap items-center gap-2 text-[11px] font-medium text-muted-foreground">
                {metrics.map((metric) => (
                  <div
                    key={metric.key}
                    className={cn(
                      "flex items-center gap-1 rounded-md border border-transparent px-2 py-1",
                      metric.highlightClass ?? "bg-muted/40"
                    )}
                  >
                    {metric.icon}
                    <span className="uppercase">{metric.label}:</span>
                    <span className="font-semibold text-foreground">{metric.value}</span>
                  </div>
                ))}
              </div>
            ) : null;
          })()}

          {(primaryActions.length > 0 || secondaryActions.length > 0) && (
            <div className="flex flex-wrap justify-end gap-2">
              {[...primaryActions, ...secondaryActions].map((action) => action)}
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


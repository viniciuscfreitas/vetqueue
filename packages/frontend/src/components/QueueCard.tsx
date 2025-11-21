import React from "react";
import { QueueEntry, Status, ServiceType, PaymentStatus, Priority } from "@/lib/api";
import { Card, CardContent } from "./ui/card";
import { Button } from "./ui/button";
import { calculateWaitTime, calculateServiceTime } from "@/lib/utils";
import { useState, useEffect } from "react";
import { EditQueueDialog } from "./EditQueueDialog";
import { useQueryClient } from "@tanstack/react-query";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "./ui/dialog";
import {
  CheckCircle2,
  Clock,
  CreditCard,
  DoorOpen,
  FileText,
  Hash,
  Pencil,
  Stethoscope,
  User,
  MoreHorizontal,
  Timer,
  AlertCircle
} from "lucide-react";
import { cn } from "@/lib/utils";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

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
  onReceivePayment?: (entry: QueueEntry) => void;
  tabContext?: "queue" | "in-progress" | "completed" | "paid";
}

const statusConfig = {
  [Status.WAITING]: {
    label: "Aguardando",
    badgeClass: "bg-amber-50 text-amber-700 border-amber-100",
    icon: Clock
  },
  [Status.CALLED]: {
    label: "Chamado",
    badgeClass: "bg-sky-50 text-sky-700 border-sky-100",
    icon: AlertCircle
  },
  [Status.IN_PROGRESS]: {
    label: "Em atendimento",
    badgeClass: "bg-blue-50 text-blue-700 border-blue-100",
    icon: Stethoscope
  },
  [Status.COMPLETED]: {
    label: "Finalizado",
    badgeClass: "bg-emerald-50 text-emerald-700 border-emerald-100",
    icon: CheckCircle2
  },
  [Status.CANCELLED]: {
    label: "Cancelado",
    badgeClass: "bg-slate-50 text-slate-600 border-slate-100",
    icon: FileText
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
  onReceivePayment,
  tabContext,
}: QueueCardProps) {
  const status = statusConfig[entry.status];
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
  const priorityLabels = {
    [Priority.EMERGENCY]: "Emergência",
    [Priority.HIGH]: "Alta",
    [Priority.NORMAL]: "Normal",
  } as const;

  // Actions Logic
  const primaryActions: JSX.Element[] = [];
  const secondaryActions: JSX.Element[] = [];

  if (entry.status === Status.WAITING && onCall) {
    primaryActions.push(
      <Button key="call" onClick={() => onCall(entry.id)} size="sm" className="bg-blue-600 hover:bg-blue-700 text-white shadow-md shadow-blue-100 rounded-full px-6">
        Chamar
      </Button>
    );
  }

  if (entry.status === Status.CALLED && onStart) {
    primaryActions.push(
      <Button key="start" onClick={() => onStart(entry.id)} size="sm" className="bg-blue-600 hover:bg-blue-700 text-white shadow-md shadow-blue-100 rounded-full px-6">
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
        className="bg-green-600 hover:bg-green-700 text-white shadow-md shadow-green-100 rounded-full px-6"
      >
        Finalizar
      </Button>
    );
  }

  // Secondary Actions (Dropdown or extra buttons)
  const menuActions = [];

  if (tabContext === "in-progress" && onRequeue) {
    menuActions.push({ label: "Reenfileirar", onClick: () => onRequeue(entry.id) });
  }

  if (entry.status === Status.IN_PROGRESS && entry.serviceType === ServiceType.CONSULTA && entry.patientId && onRegisterConsultation) {
    secondaryActions.push(
      <Button key="reg-consult" variant="outline" size="sm" onClick={() => onRegisterConsultation(entry.patientId!, entry.id)} className="rounded-full border-gray-200 text-gray-600 hover:bg-gray-50">
        Registrar consulta
      </Button>
    )
  }

  if (entry.status === Status.IN_PROGRESS && entry.serviceType !== ServiceType.CONSULTA && entry.patientId && onViewRecord) {
    secondaryActions.push(
      <Button key="view-record" variant="outline" size="sm" onClick={() => onViewRecord(entry.patientId!, entry.id)} className="rounded-full border-gray-200 text-gray-600 hover:bg-gray-50">
        Ver Prontuário
      </Button>
    )
  }

  if (tabContext === "completed" && entry.paymentStatus !== PaymentStatus.PAID && onRequeue) {
    menuActions.push({ label: "Retornar à fila", onClick: () => onRequeue(entry.id) });
  }

  if (entry.status !== Status.COMPLETED && entry.status !== Status.CANCELLED && onCancel) {
    menuActions.push({ label: "Cancelar", onClick: () => onCancel(entry.id), destructive: true });
  }

  if (canEdit) {
    menuActions.push({ label: "Editar", onClick: () => setEditDialogOpen(true) });
  }

  if (tabContext === "completed" && entry.paymentStatus !== PaymentStatus.PAID && onReceivePayment) {
    menuActions.push({ label: "Registrar Pagamento", onClick: () => onReceivePayment(entry) });
  }


  return (
    <>
      <Card className="w-full bg-white rounded-3xl border border-gray-100 shadow-sm hover:shadow-md transition-all duration-200 overflow-hidden group">
        <CardContent className="p-0">
          <div className="p-5 flex flex-col gap-4">
            {/* Header: Status & Time */}
            <div className="flex items-center justify-between">
              <div className={cn("px-3 py-1 rounded-full text-xs font-semibold flex items-center gap-1.5 border", status.badgeClass)}>
                <status.icon className="w-3 h-3" />
                {status.label}
              </div>

              <div className="flex items-center gap-2 text-gray-400 text-xs font-medium">
                <Timer className="w-3.5 h-3.5" />
                {tabContext === "in-progress" ? serviceTime : waitTime || "00:00"}
              </div>
            </div>

            {/* Main Content: Patient & Tutor */}
            <div className="flex items-start justify-between gap-4">
              <div>
                <h3 className="text-lg font-bold text-gray-900 leading-tight mb-1">
                  {entry.patientName}
                </h3>
                <div className="flex items-center gap-2 text-sm text-gray-500">
                  <User className="w-3.5 h-3.5" />
                  {entry.tutorName}
                </div>
              </div>

              {/* Service Badge */}
              <div className="bg-gray-50 px-3 py-1.5 rounded-lg text-xs font-medium text-gray-600 border border-gray-100">
                {serviceLabel}
              </div>
            </div>

            {/* Footer Info: Vet, Room, Priority */}
            <div className="flex items-center gap-4 text-xs text-gray-500 border-t border-gray-50 pt-4 mt-1">
              {entry.assignedVet && (
                <div className="flex items-center gap-1.5" title="Veterinário">
                  <Stethoscope className="w-3.5 h-3.5 text-gray-400" />
                  <span className="truncate max-w-[100px]">{entry.assignedVet.name}</span>
                </div>
              )}
              {entry.room && (
                <div className="flex items-center gap-1.5" title="Sala">
                  <DoorOpen className="w-3.5 h-3.5 text-gray-400" />
                  <span>Sala {entry.room.name}</span>
                </div>
              )}
              {entry.priority !== Priority.NORMAL && (
                <div className={cn("flex items-center gap-1.5 font-medium",
                  entry.priority === Priority.EMERGENCY ? "text-red-600" : "text-orange-600"
                )}>
                  <AlertCircle className="w-3.5 h-3.5" />
                  {priorityLabels[entry.priority]}
                </div>
              )}
            </div>
          </div>

          {/* Actions Footer */}
          {(primaryActions.length > 0 || secondaryActions.length > 0 || menuActions.length > 0) && (
            <div className="bg-gray-50/50 px-5 py-3 border-t border-gray-100 flex items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                {secondaryActions}

                {menuActions.length > 0 && (
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon" className="h-8 w-8 rounded-full hover:bg-gray-100 text-gray-500">
                        <MoreHorizontal className="w-4 h-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="start">
                      {menuActions.map((action, idx) => (
                        <DropdownMenuItem
                          key={idx}
                          onClick={action.onClick}
                          className={action.destructive ? "text-red-600 focus:text-red-600" : ""}
                        >
                          {action.label}
                        </DropdownMenuItem>
                      ))}
                    </DropdownMenuContent>
                  </DropdownMenu>
                )}
              </div>

              <div className="flex items-center gap-2">
                {primaryActions}
              </div>
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


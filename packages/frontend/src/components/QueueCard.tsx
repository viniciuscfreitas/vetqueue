import React from "react";
import { QueueEntry, Status, ServiceType, PaymentStatus, Priority } from "@/lib/api";
import { Card, CardContent } from "./ui/card";
import { Button } from "./ui/button";
import { calculateWaitTime, calculateServiceTime } from "@/lib/utils";
import { useState, useEffect } from "react";
import { EditQueueDialog } from "./EditQueueDialog";
import { useQueryClient } from "@tanstack/react-query";
import {
  Calendar,
  User,
  MoreVertical,
  Activity,
  AlertCircle,
  DoorOpen,
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
  },
  [Status.CALLED]: {
    label: "Chamado",
    badgeClass: "bg-sky-50 text-sky-700 border-sky-100",
  },
  [Status.IN_PROGRESS]: {
    label: "Em atendimento",
    badgeClass: "bg-blue-50 text-blue-700 border-blue-100",
  },
  [Status.COMPLETED]: {
    label: "Finalizado",
    badgeClass: "bg-emerald-50 text-emerald-700 border-emerald-100",
  },
  [Status.CANCELLED]: {
    label: "Cancelado",
    badgeClass: "bg-slate-50 text-slate-600 border-slate-100",
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

const priorityLabels = {
  [Priority.EMERGENCY]: "Emergência",
  [Priority.HIGH]: "Alta",
  [Priority.NORMAL]: "Normal",
} as const;

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

// Helper to format date
function formatDate(dateString?: string | null): string {
  if (!dateString) return "";
  const date = new Date(dateString);
  return date.toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit", year: "numeric" });
}

// Helper to format currency
function formatCurrency(amount?: string | null): string {
  if (!amount) return "";
  const num = parseFloat(amount);
  if (isNaN(num)) return "";
  return `R$ ${num.toFixed(2).replace(".", ",")}`;
}

// Calculate steps completed based on status
function getStepsCompleted(status: Status): number {
  switch (status) {
    case Status.WAITING:
      return 0;
    case Status.CALLED:
      return 1;
    case Status.IN_PROGRESS:
      return 2;
    case Status.COMPLETED:
      return 5;
    case Status.CANCELLED:
      return 0;
    default:
      return 0;
  }
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

  // Actions Logic
  const primaryActions: JSX.Element[] = [];
  const secondaryActions: JSX.Element[] = [];

  if (entry.status === Status.WAITING && onCall) {
    primaryActions.push(
      <Button key="call" onClick={() => onCall(entry.id)} size="sm" className="bg-primary hover:bg-primary/90 text-white shadow-md shadow-primary/20 rounded-full px-6">
        Chamar
      </Button>
    );
  }

  if (entry.status === Status.CALLED && onStart) {
    primaryActions.push(
      <Button key="start" onClick={() => onStart(entry.id)} size="sm" className="bg-primary hover:bg-primary/90 text-white shadow-md shadow-primary/20 rounded-full px-6">
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

  const stepsCompleted = getStepsCompleted(entry.status);
  const totalSteps = 5;

  return (
    <>
      <Card className="w-full bg-white rounded-2xl shadow-sm border border-gray-100 hover:shadow-md transition-shadow cursor-pointer group">
        <CardContent className="p-4">
          {/* Header: ID and Steps/Status */}
          <div className="flex justify-between items-start mb-3">
            <div className="flex items-center gap-2">
              {entry.simplesVetId && (
                <span className="text-xs font-bold text-gray-400">#{entry.simplesVetId}</span>
              )}
              <div className="flex items-center gap-1 text-xs text-gray-400 bg-gray-50 px-2 py-0.5 rounded-full">
                {stepsCompleted}/{totalSteps}
                <Activity className="w-3 h-3" />
              </div>
            </div>

            {menuActions.length > 0 && (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <button className="text-gray-300 hover:text-gray-600 p-1 rounded-full hover:bg-gray-50 transition-colors">
                    <MoreVertical className="w-4 h-4" />
                  </button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
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

          {/* Main Content: Patient Info */}
          <div className="mb-3">
            <div className="flex items-center gap-2 mb-1">
              <h3 className="font-bold text-gray-800 text-lg">{entry.patientName}</h3>
              <span className="text-sm text-gray-500">• {entry.patient?.breed || serviceLabel}</span>
            </div>
            <div className="flex items-center gap-2 text-sm text-gray-500">
              <User className="w-3 h-3" />
              {entry.tutorName}
            </div>
          </div>

          {/* Footer: Date/Value & Vet */}
          <div className="pt-3 border-t border-gray-50 flex justify-between items-end">
            <div className="flex flex-col gap-1">
              <div className="flex items-center gap-2 text-xs text-gray-400">
                <Calendar className="w-3 h-3" />
                {formatDate(entry.createdAt)}
              </div>
              {entry.paymentAmount && (
                <div className="text-sm font-bold text-gray-700">{formatCurrency(entry.paymentAmount)}</div>
              )}
              {entry.priority !== Priority.NORMAL && (
                <div className={cn("text-xs font-bold flex items-center gap-1",
                  entry.priority === Priority.EMERGENCY ? "text-red-600" : "text-orange-600"
                )}>
                  <AlertCircle className="w-3 h-3" />
                  {priorityLabels[entry.priority]}
                </div>
              )}
              {entry.room && (
                <div className="flex items-center gap-1 text-xs text-gray-500">
                  <DoorOpen className="w-3 h-3" />
                  {entry.room.name}
                </div>
              )}
            </div>

            {entry.assignedVet && (
              <div className="flex items-center gap-2">
                <div className="text-right">
                  <p className="text-[10px] text-gray-400">Resp.</p>
                  <p className="text-xs font-medium text-gray-600 truncate max-w-[80px]">
                    {entry.assignedVet.name.split(' ')[0]}
                  </p>
                </div>
                <div className="w-8 h-8 rounded-full bg-gradient-to-br from-primary/20 to-primary/10 border-2 border-white shadow-sm flex items-center justify-center text-xs font-bold text-primary">
                  {entry.assignedVet.name.substring(0, 2).toUpperCase()}
                </div>
              </div>
            )}
          </div>

          {/* Primary Actions */}
          {primaryActions.length > 0 && (
            <div className="mt-3 pt-3 border-t border-gray-50 flex items-center justify-end gap-2">
              {primaryActions}
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

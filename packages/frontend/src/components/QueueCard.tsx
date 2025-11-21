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
  Clock,
  Stethoscope,
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
    badgeClass: "bg-orange-100 text-orange-600",
  },
  [Status.CALLED]: {
    label: "Chamado",
    badgeClass: "bg-blue-100 text-blue-600",
  },
  [Status.IN_PROGRESS]: {
    label: "Em Atendimento",
    badgeClass: "bg-purple-100 text-purple-600",
  },
  [Status.COMPLETED]: {
    label: "Concluído",
    badgeClass: "bg-green-100 text-green-600",
  },
  [Status.CANCELLED]: {
    label: "Cancelado",
    badgeClass: "bg-gray-100 text-gray-600",
  },
} as const;

const SERVICE_LABELS: Record<string, string> = {
  [ServiceType.CONSULTA]: "Consulta",
  [ServiceType.VACINACAO]: "Vacinação",
  [ServiceType.CIRURGIA]: "Cirurgia",
  [ServiceType.EXAME]: "Exame",
  [ServiceType.BANHO_TOSA]: "Banho e Tosa",
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

// Helper to format date
function formatDate(dateString?: string | null): string {
  if (!dateString) return "";
  const date = new Date(dateString);
  return date.toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit", year: "numeric" });
}

// Helper to format time
function formatTime(dateString?: string | null): string {
  if (!dateString) return "";
  const date = new Date(dateString);
  return date.toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" });
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
      return 3;
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

  const canEdit = entry.status === Status.WAITING && canManageQueue;
  const queryClient = useQueryClient();

  // Actions Logic
  const primaryActions: JSX.Element[] = [];

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

  // Menu Actions
  const menuActions = [];

  if (tabContext === "in-progress" && onRequeue) {
    menuActions.push({ label: "Reenfileirar", onClick: () => onRequeue(entry.id) });
  }

  if (entry.status === Status.IN_PROGRESS && entry.serviceType === ServiceType.CONSULTA && entry.patientId && onRegisterConsultation) {
    menuActions.push({ label: "Registrar Consulta", onClick: () => onRegisterConsultation(entry.patientId!, entry.id) });
  }

  if (entry.status === Status.IN_PROGRESS && entry.serviceType !== ServiceType.CONSULTA && entry.patientId && onViewRecord) {
    menuActions.push({ label: "Ver Prontuário", onClick: () => onViewRecord(entry.patientId!, entry.id) });
  }

  if (tabContext === "completed" && entry.paymentStatus !== PaymentStatus.PAID && onRequeue) {
    menuActions.push({ label: "Retornar à Fila", onClick: () => onRequeue(entry.id) });
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
  const totalSteps = 3;

  return (
    <>
      <Card className="bg-white rounded-2xl shadow-sm border border-gray-100 hover:shadow-md transition-shadow cursor-pointer mb-4 group">
        <CardContent className="p-4">
          {/* Header: ID, Steps, Status Badge, Menu */}
          <div className="flex justify-between items-start mb-3">
            <div className="flex items-center gap-2">
              {entry.simplesVetId && (
                <span className="text-xs font-bold text-gray-400">#{entry.simplesVetId}</span>
              )}
              <div className="flex items-center gap-1 text-xs text-gray-400 bg-gray-50 px-2 py-0.5 rounded-full">
                {stepsCompleted}/{totalSteps}
                <Activity className="w-3 h-3" />
              </div>
              <span className={cn("px-3 py-1 rounded-full text-xs font-bold", status.badgeClass)}>
                {status.label}
              </span>
            </div>

            {menuActions.length > 0 && (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <button className="text-gray-300 hover:text-gray-600">
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

          {/* Main Content: Patient & Breed */}
          <div className="mb-3">
            <div className="flex items-center gap-2 mb-1">
              <h3 className="font-bold text-gray-800 text-lg">{entry.patientName}</h3>
              <span className="text-sm text-gray-500">• {entry.patient?.breed || serviceLabel}</span>
            </div>
            <div className="flex items-center gap-2 text-sm text-gray-500 mb-2">
              <User className="w-3 h-3" />
              {entry.tutorName}
            </div>

            {/* Additional Info Row */}
            <div className="flex flex-wrap items-center gap-3 text-xs text-gray-500">
              {entry.room && (
                <div className="flex items-center gap-1.5 bg-gray-50 px-2 py-1 rounded-md">
                  <DoorOpen className="w-3 h-3" />
                  <span className="font-medium">{entry.room.name}</span>
                </div>
              )}

              {entry.priority !== Priority.NORMAL && (
                <div className={cn("flex items-center gap-1 px-2 py-1 rounded-md font-bold",
                  entry.priority === Priority.EMERGENCY ? "bg-red-50 text-red-600" : "bg-orange-50 text-orange-600"
                )}>
                  <AlertCircle className="w-3 h-3" />
                  {priorityLabels[entry.priority]}
                </div>
              )}

              {entry.calledAt && (
                <div className="flex items-center gap-1.5">
                  <Clock className="w-3 h-3" />
                  <span>{formatTime(entry.calledAt)}</span>
                </div>
              )}
            </div>
          </div>

          {/* Footer: Date/Time & Vet Avatar */}
          <div className="pt-3 border-t border-gray-50 flex justify-between items-center">
            <div className="flex flex-col gap-1">
              <div className="flex items-center gap-2 text-xs text-gray-400">
                <Calendar className="w-3 h-3" />
                {formatDate(entry.createdAt)}
              </div>
              {entry.paymentAmount && (
                <div className="text-sm font-bold text-gray-700">{formatCurrency(entry.paymentAmount)}</div>
              )}
              {tabContext === "in-progress" && (
                <div className="text-xs font-medium text-primary">
                  ⏱ {serviceTime}
                </div>
              )}
              {tabContext === "queue" && entry.status === Status.WAITING && (
                <div className="text-xs font-medium text-orange-600">
                  ⏱ {waitTime}
                </div>
              )}
            </div>

            {entry.assignedVet && (
              <div className="flex items-center gap-2">
                <img
                  src={`https://ui-avatars.com/api/?name=${encodeURIComponent(entry.assignedVet.name)}&background=3b82f6&color=fff&size=128`}
                  alt={entry.assignedVet.name}
                  className="w-8 h-8 rounded-full border-2 border-white shadow-sm"
                />
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

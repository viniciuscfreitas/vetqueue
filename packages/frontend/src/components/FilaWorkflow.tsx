"use client";

import { useMemo } from "react";
import {
  QueueEntry,
  Role,
  Status,
  PaymentStatus,
  Priority,
  User,
} from "@/lib/api";
import { QueueCard } from "./QueueCard";
import { cn } from "@/lib/utils";
import { sortQueueEntries } from "@/lib/queueHelpers";
import { CreditCard, HeartPulse, PawPrint, Stethoscope } from "lucide-react";

const COLUMN_DEFINITIONS = [
  {
    key: "queue",
    title: "Fila",
    indicator: "bg-slate-400",
    icon: <PawPrint className="h-4 w-4 text-slate-500" />,
    filter: (entry: QueueEntry) =>
      entry.status === Status.WAITING || entry.status === Status.CALLED,
  },
  {
    key: "in-progress",
    title: "Em andamento",
    indicator: "bg-orange-500",
    icon: <Stethoscope className="h-4 w-4 text-orange-500" />,
    filter: (entry: QueueEntry) => entry.status === Status.IN_PROGRESS,
  },
  {
    key: "completed",
    title: "Concluídos",
    indicator: "bg-emerald-500",
    icon: <HeartPulse className="h-4 w-4 text-emerald-500" />,
    filter: (entry: QueueEntry) =>
      entry.status === Status.COMPLETED &&
      entry.paymentStatus !== PaymentStatus.PAID,
  },
  {
    key: "paid",
    title: "Pagos",
    indicator: "bg-emerald-600",
    icon: <CreditCard className="h-4 w-4 text-emerald-600" />,
    filter: (entry: QueueEntry) =>
      entry.status === Status.COMPLETED &&
      entry.paymentStatus === PaymentStatus.PAID,
  },
] as const;

type ColumnKey = (typeof COLUMN_DEFINITIONS)[number]["key"];

export interface FilaWorkflowActions {
  onCall?: (id: string) => void;
  onStart?: (id: string) => void;
  onComplete?: (id: string) => void;
  onCancel?: (id: string) => void;
  onRequeue?: (id: string) => void;
  onViewRecord?: (patientId: string, queueEntryId: string) => void;
  onRegisterConsultation?: (patientId: string, queueEntryId: string) => void;
  onReceivePayment?: (entry: QueueEntry) => void;
}

interface FilaWorkflowProps extends FilaWorkflowActions {
  user: User;
  entries: QueueEntry[];
  canManageQueue: boolean;
}

export function FilaWorkflow({
  user,
  entries,
  canManageQueue,
  onCall,
  onStart,
  onComplete,
  onCancel,
  onRequeue,
  onViewRecord,
  onRegisterConsultation,
  onReceivePayment,
}: FilaWorkflowProps) {
  const visibleColumns = useMemo(() => {
    if (!user || user.role === Role.VET) {
      return COLUMN_DEFINITIONS.slice(0, 2);
    }
    return COLUMN_DEFINITIONS;
  }, [user]);

  const orderedEntries = useMemo(() => sortQueueEntries(entries), [entries]);

  return (
    <section className="space-y-4 px-1 pb-4 overflow-x-auto">
      <div className="flex flex-col gap-6 md:flex-row md:items-start md:gap-8 min-w-full md:min-w-0">
        {visibleColumns.map((column) => {
          const columnEntries = orderedEntries.filter(column.filter);
          return (
            <div key={column.key} className="w-full md:w-[350px] md:shrink-0 flex flex-col">
              {/* Column Header */}
              <div className="flex items-center justify-between mb-4 px-1">
                <div className="flex items-center gap-2">
                  <div className={cn("p-2 rounded-lg bg-white shadow-sm border border-gray-100")}>
                    {column.icon}
                  </div>
                  <div>
                    <h3 className="font-bold text-gray-700 text-sm">{column.title}</h3>
                    <p className="text-xs text-gray-400 font-medium">
                      {columnEntries.length} {columnEntries.length === 1 ? "paciente" : "pacientes"}
                    </p>
                  </div>
                </div>
                <div className={cn("h-1.5 w-1.5 rounded-full", column.indicator)} />
              </div>

              {/* Cards Container */}
              <div className="flex flex-col gap-4">
                {columnEntries.length === 0 ? (
                  <div className="flex flex-col items-center justify-center rounded-3xl border border-dashed border-gray-200 bg-gray-50/50 p-8 text-center">
                    <div className="bg-white p-3 rounded-full shadow-sm mb-3">
                      <column.icon.type className="w-5 h-5 text-gray-300" />
                    </div>
                    <p className="text-sm font-medium text-gray-500">Vazio por enquanto</p>
                    <p className="text-xs text-gray-400 mt-1">Nenhum paciente nesta etapa</p>
                  </div>
                ) : (
                  columnEntries.map((entry) => (
                    <QueueCard
                      key={entry.id}
                      entry={entry}
                      canManageQueue={canManageQueue}
                      onCall={onCall}
                      onStart={onStart}
                      onComplete={onComplete}
                      onCancel={onCancel}
                      onRequeue={onRequeue}
                      onViewRecord={onViewRecord}
                      onRegisterConsultation={onRegisterConsultation}
                      onReceivePayment={onReceivePayment}
                      tabContext={column.key as ColumnKey}
                    />
                  ))
                )}
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}

export const MOCK_QUEUE_ENTRIES: QueueEntry[] = [
  {
    id: "mock-1",
    patientName: "Luna",
    tutorName: "Fernanda do Carmo",
    serviceType: "Consulta emergencial",
    priority: Priority.EMERGENCY,
    status: Status.WAITING,
    createdAt: new Date().toISOString(),
    hasScheduledAppointment: false,
    paymentStatus: PaymentStatus.PENDING,
  },
  {
    id: "mock-2",
    patientName: "Rex",
    tutorName: "João Mendes",
    serviceType: "Triagem preventiva",
    priority: Priority.HIGH,
    status: Status.CALLED,
    createdAt: new Date().toISOString(),
    calledAt: new Date().toISOString(),
    hasScheduledAppointment: true,
    paymentStatus: PaymentStatus.PENDING,
  },
  {
    id: "mock-3",
    patientName: "Max",
    tutorName: "Ana Martins",
    serviceType: "Raio-X",
    priority: Priority.NORMAL,
    status: Status.IN_PROGRESS,
    createdAt: new Date().toISOString(),
    calledAt: new Date(Date.now() - 1000 * 60 * 10).toISOString(),
    hasScheduledAppointment: false,
    paymentStatus: PaymentStatus.PARTIAL,
    paymentAmount: "120.00",
  },
  {
    id: "mock-4",
    patientName: "Sophie",
    tutorName: "Carlos Lima",
    serviceType: "Consulta Clínica",
    priority: Priority.NORMAL,
    status: Status.COMPLETED,
    createdAt: new Date().toISOString(),
    calledAt: new Date(Date.now() - 1000 * 60 * 30).toISOString(),
    completedAt: new Date(Date.now() - 1000 * 60 * 5).toISOString(),
    hasScheduledAppointment: true,
    paymentStatus: PaymentStatus.PENDING,
    paymentAmount: "200.00",
  },
  {
    id: "mock-5",
    patientName: "Bidu",
    tutorName: "Paula Souza",
    serviceType: "Cirurgia ortopédica",
    priority: Priority.HIGH,
    status: Status.COMPLETED,
    createdAt: new Date().toISOString(),
    calledAt: new Date(Date.now() - 1000 * 60 * 90).toISOString(),
    completedAt: new Date(Date.now() - 1000 * 60 * 40).toISOString(),
    hasScheduledAppointment: false,
    paymentStatus: PaymentStatus.PAID,
    paymentAmount: "850.00",
  },
];


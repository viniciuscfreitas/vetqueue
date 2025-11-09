"use client";

import { useCallback, useMemo } from "react";
import {
  QueueEntry,
  Role,
  Status,
  PaymentStatus,
  Priority,
  User,
} from "@/lib/api";
import { QueueCard } from "./QueueCard";
import { Button } from "./ui/button";
import { cn } from "@/lib/utils";
import { sortQueueEntries } from "@/lib/queueHelpers";
import {
  ClipboardList,
  CreditCard,
  HeartPulse,
  Siren,
  Stethoscope,
} from "lucide-react";
import {
  DragDropContext,
  Droppable,
  Draggable,
  type DropResult,
} from "react-beautiful-dnd";

const COLUMN_DEFINITIONS = [
  {
    key: "emergency",
    title: "Emergências / Fila Prioritária",
    accent: "ring-2 ring-red-200",
    indicator: "bg-red-500",
    icon: <Siren className="h-4 w-4 text-red-500" />,
    filter: (entry: QueueEntry) =>
      entry.status === Status.WAITING &&
      (entry.priority === Priority.EMERGENCY || entry.priority === Priority.HIGH),
  },
  {
    key: "triage",
    title: "Iniciados / Triagem",
    accent: "ring-2 ring-sky-200",
    indicator: "bg-sky-500",
    icon: <ClipboardList className="h-4 w-4 text-sky-500" />,
    filter: (entry: QueueEntry) => entry.status === Status.CALLED,
  },
  {
    key: "in-progress",
    title: "Em andamento / Tratamentos",
    accent: "ring-2 ring-orange-200",
    indicator: "bg-orange-500",
    icon: <Stethoscope className="h-4 w-4 text-orange-500" />,
    filter: (entry: QueueEntry) => entry.status === Status.IN_PROGRESS,
  },
  {
    key: "completed",
    title: "Concluídos / Alta",
    accent: "ring-2 ring-emerald-200",
    indicator: "bg-emerald-500",
    icon: <HeartPulse className="h-4 w-4 text-emerald-500" />,
    filter: (entry: QueueEntry) =>
      entry.status === Status.COMPLETED &&
      entry.paymentStatus !== PaymentStatus.PAID,
  },
  {
    key: "paid",
    title: "Pagos / Fechados",
    accent: "ring-2 ring-emerald-300",
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
  onStatusChange?: (id: string, nextColumn: ColumnKey) => void;
  onViewRecord?: (patientId: string, queueEntryId: string) => void;
  onRegisterConsultation?: (patientId: string, queueEntryId: string) => void;
}

interface FilaWorkflowProps extends FilaWorkflowActions {
  user: User;
  entries: QueueEntry[];
  canManageQueue: boolean;
  onAddPatient?: () => void;
}

export function FilaWorkflow({
  user,
  entries,
  canManageQueue,
  onAddPatient,
  onCall,
  onStart,
  onComplete,
  onCancel,
  onRequeue,
  onStatusChange,
  onViewRecord,
  onRegisterConsultation,
}: FilaWorkflowProps) {
  const visibleColumns = useMemo(() => {
    if (!user || user.role === Role.VET) {
      return COLUMN_DEFINITIONS.slice(0, 3);
    }
    return COLUMN_DEFINITIONS;
  }, [user]);

  const orderedEntries = useMemo(() => sortQueueEntries(entries), [entries]);

  const handleDragEnd = useCallback(
    (result: DropResult) => {
      if (!onStatusChange) {
        return;
      }
      const { destination, source, draggableId } = result;
      if (!destination || destination.droppableId === source.droppableId) {
        return;
      }
      onStatusChange(draggableId, destination.droppableId as ColumnKey);
    },
    [onStatusChange],
  );

  return (
    <section className="space-y-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-xl font-semibold">Workflow de atendimentos</h2>
          <p className="text-sm text-muted-foreground">
            Arraste os pacientes entre colunas para avançar ou retornar etapas.
          </p>
        </div>
        {canManageQueue && onAddPatient ? (
          <Button onClick={onAddPatient} className="self-start">
            Adicionar paciente
          </Button>
        ) : null}
      </div>

      <DragDropContext onDragEnd={handleDragEnd}>
        <div className="overflow-x-auto pb-4">
          <div className="flex min-w-max gap-6">
            {visibleColumns.map((column) => {
              const columnEntries = orderedEntries.filter(column.filter);
              return (
                <Droppable droppableId={column.key} key={column.key}>
                  {(provided, snapshot) => (
                    <div
                      ref={provided.innerRef}
                      {...provided.droppableProps}
                      className={cn(
                        "flex w-[280px] shrink-0 flex-col gap-4 rounded-2xl border border-border bg-card p-4 shadow-sm transition-colors",
                        snapshot.isDraggingOver &&
                          "border-dashed border-sky-400 bg-sky-50/60",
                      )}
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex items-center gap-2">
                          {column.icon}
                          <div>
                            <p className="text-sm font-semibold leading-tight">
                              {column.title}
                            </p>
                            <span className="text-xs text-muted-foreground">
                              {columnEntries.length}{" "}
                              {columnEntries.length === 1
                                ? "paciente"
                                : "pacientes"}
                            </span>
                          </div>
                        </div>
                        <span
                          className={cn("h-2 w-2 rounded-full", column.indicator)}
                        />
                      </div>

                      <div className="flex flex-1 flex-col gap-3">
                        {columnEntries.length === 0 ? (
                          <div className="flex flex-1 flex-col items-center justify-center gap-2 rounded-xl border border-dashed border-muted/40 bg-muted/10 p-6 text-center text-xs text-muted-foreground">
                            Nenhum paciente aqui.
                            {canManageQueue &&
                              column.key === "emergency" &&
                              onAddPatient ? (
                              <Button
                                size="sm"
                                variant="secondary"
                                onClick={onAddPatient}
                              >
                                Adicionar
                              </Button>
                            ) : null}
                          </div>
                        ) : (
                          columnEntries.map((entry, index) => (
                            <Draggable
                              key={entry.id}
                              draggableId={entry.id}
                              index={index}
                              isDragDisabled={!canManageQueue}
                            >
                              {(dragProvided, dragSnapshot) => (
                                <div
                                  ref={dragProvided.innerRef}
                                  {...dragProvided.draggableProps}
                                  {...dragProvided.dragHandleProps}
                                  className={cn(
                                    "transition-all cursor-grab active:cursor-grabbing",
                                    dragSnapshot.isDragging &&
                                      "rotate-1 scale-[1.01]",
                                  )}
                                >
                                  <QueueCard
                                    entry={entry}
                                    canManageQueue={canManageQueue}
                                    onCall={onCall}
                                    onStart={onStart}
                                    onComplete={onComplete}
                                    onCancel={onCancel}
                                    onRequeue={onRequeue}
                                    onViewRecord={onViewRecord}
                                    onRegisterConsultation={onRegisterConsultation}
                                    tabContext={column.key as ColumnKey}
                                  />
                                </div>
                              )}
                            </Draggable>
                          ))
                        )}
                        {provided.placeholder}
                      </div>
                    </div>
                  )}
                </Droppable>
              );
            })}
          </div>
        </div>
      </DragDropContext>
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


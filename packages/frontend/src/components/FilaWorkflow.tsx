"use client";

import { useCallback, useMemo } from "react";
import * as Tabs from "@radix-ui/react-tabs";
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
import { formatCurrency } from "@/lib/financialUtils";
import { sortQueueEntries } from "@/lib/queueHelpers";
import {
  AlertTriangle,
  DollarSign,
  PawPrint,
  Plus,
  TrendingUp,
} from "lucide-react";
import {
  DragDropContext,
  Droppable,
  Draggable,
  type DropResult,
} from "react-beautiful-dnd";

const TAB_DEFINITIONS = [
  {
    key: "emergency",
    title: "Emergências / Fila Prioritária",
    accent: "border-red-200 bg-red-50 text-red-700",
    ringClass: "data-[state=active]:ring-red-200",
    indicator: "bg-red-400",
    filter: (entry: QueueEntry) =>
      entry.status === Status.WAITING &&
      (entry.priority === Priority.EMERGENCY || entry.priority === Priority.HIGH),
  },
  {
    key: "triage",
    title: "Iniciados / Triagem",
    accent: "border-sky-200 bg-sky-50 text-sky-700",
    ringClass: "data-[state=active]:ring-sky-200",
    indicator: "bg-sky-400",
    filter: (entry: QueueEntry) => entry.status === Status.CALLED,
  },
  {
    key: "in-progress",
    title: "Em andamento / Tratamentos",
    accent: "border-orange-200 bg-orange-50 text-orange-700",
    ringClass: "data-[state=active]:ring-orange-200",
    indicator: "bg-orange-400",
    filter: (entry: QueueEntry) => entry.status === Status.IN_PROGRESS,
  },
  {
    key: "completed",
    title: "Concluídos / Alta",
    accent: "border-emerald-200 bg-emerald-50 text-emerald-700",
    ringClass: "data-[state=active]:ring-emerald-200",
    indicator: "bg-emerald-400",
    filter: (entry: QueueEntry) =>
      entry.status === Status.COMPLETED &&
      entry.paymentStatus !== PaymentStatus.PAID,
  },
  {
    key: "paid",
    title: "Pagos / Fechados",
    accent: "border-emerald-300 bg-emerald-100 text-emerald-800",
    ringClass: "data-[state=active]:ring-emerald-300",
    indicator: "bg-emerald-600",
    filter: (entry: QueueEntry) =>
      entry.status === Status.COMPLETED &&
      entry.paymentStatus === PaymentStatus.PAID,
  },
] as const;

type TabKey = (typeof TAB_DEFINITIONS)[number]["key"];

export interface FilaWorkflowActions {
  onCall?: (id: string) => void;
  onStart?: (id: string) => void;
  onComplete?: (id: string) => void;
  onCancel?: (id: string) => void;
  onRequeue?: (id: string) => void;
  onStatusChange?: (id: string, nextTab: TabKey) => void;
  onViewRecord?: (patientId: string, queueEntryId: string) => void;
  onRegisterConsultation?: (patientId: string, queueEntryId: string) => void;
}

interface FilaWorkflowProps extends FilaWorkflowActions {
  user: User;
  entries: QueueEntry[];
  canManageQueue: boolean;
  onAddPatient?: () => void;
}

const DEFAULT_DELTA = "+0,0%";

function parseAmount(amount?: string | null): number {
  if (!amount) {
    return 0;
  }
  const parsed = Number(
    amount
      .toString()
      .replace(/\./g, "")
      .replace(",", "."),
  );
  return Number.isFinite(parsed) ? parsed : 0;
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
  const visibleTabs = useMemo(() => {
    if (!user || user.role === Role.VET) {
      return TAB_DEFINITIONS.slice(0, 3);
    }
    return TAB_DEFINITIONS;
  }, [user]);

  const metrics = useMemo(() => {
    const paidEntries = entries.filter(
      (entry) => entry.paymentStatus === PaymentStatus.PAID,
    );
    const paidAmount = paidEntries.reduce((acc, entry) => {
      return acc + parseAmount(entry.paymentAmount);
    }, 0);

    const emergencyCount = entries.filter(
      (entry) =>
        entry.status === Status.WAITING &&
        (entry.priority === Priority.EMERGENCY ||
          entry.priority === Priority.HIGH),
    ).length;

    const activePatients = entries.length;

    return [
      {
        title: "Faturamento",
        value: formatCurrency(paidAmount.toFixed(2)),
        delta: DEFAULT_DELTA,
        icon: <DollarSign className="h-5 w-5 text-slate-600" />,
      },
      {
        title: "Alertas críticos",
        value: `${emergencyCount} ${
          emergencyCount === 1 ? "emergência" : "emergências"
        }`,
        delta: DEFAULT_DELTA,
        icon: <AlertTriangle className="h-5 w-5 text-amber-600" />,
      },
      {
        title: "Pacientes em fluxo",
        value: `${activePatients}`,
        delta: DEFAULT_DELTA,
        icon: <PawPrint className="h-5 w-5 text-emerald-600" />,
      },
    ];
  }, [entries]);

  const totalEntriesCount = entries.length || 1;
  const completedCount = entries.filter(
    (entry) => entry.status === Status.COMPLETED,
  ).length;
  const funnelRatio = Math.round((completedCount / totalEntriesCount) * 100);

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
      onStatusChange(draggableId, destination.droppableId as TabKey);
    },
    [onStatusChange],
  );

  return (
    <section className="space-y-6">
      <header className="space-y-6 rounded-2xl bg-background/60 p-6 shadow-sm ring-1 ring-border/60">
        <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
          <div>
            <h1 className="text-2xl font-semibold">
              Olá, {user?.name?.split(" ")?.[0] ?? "Equipe"}! 👋
            </h1>
            <p className="text-sm text-muted-foreground">
              Priorize emergências e mova pacientes pelo funil com clareza.
            </p>
          </div>
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
            <div className="rounded-full bg-muted px-3 py-1 text-xs font-medium text-muted-foreground">
              Funil hoje: {funnelRatio}%
            </div>
            {canManageQueue && onAddPatient ? (
              <Button onClick={onAddPatient} className="gap-2">
                <Plus className="h-4 w-4" />
                Adicionar paciente
              </Button>
            ) : null}
          </div>
        </div>

        <div className="grid gap-4 md:grid-cols-3">
          {metrics.map((metric) => (
            <div
              key={metric.title}
              className="flex items-center justify-between gap-4 rounded-xl border border-border/60 bg-card px-5 py-4 shadow-sm"
            >
              <div className="space-y-1">
                <p className="text-sm text-muted-foreground">{metric.title}</p>
                <p className="text-xl font-semibold">{metric.value}</p>
                <div className="flex items-center gap-1 text-xs text-emerald-600">
                  <TrendingUp className="h-3 w-3" />
                  {metric.delta}
                </div>
              </div>
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-muted/60">
                {metric.icon}
              </div>
            </div>
          ))}
        </div>
      </header>

      <DragDropContext onDragEnd={handleDragEnd}>
        <Tabs.Root
          defaultValue={visibleTabs[0]?.key}
          className="flex flex-col gap-4"
        >
          <Tabs.List className="flex overflow-x-auto rounded-xl border border-border bg-card p-2">
            {visibleTabs.map((tab) => {
              const itemsInTab = orderedEntries.filter(tab.filter).length;
              return (
                <Tabs.Trigger
                  key={tab.key}
                  value={tab.key}
                  className={cn(
                    "flex min-w-[220px] flex-1 items-center justify-between gap-3 rounded-lg px-4 py-3 text-left text-sm font-medium text-muted-foreground transition-all data-[state=active]:bg-background data-[state=active]:text-foreground data-[state=active]:shadow-sm data-[state=active]:ring-2",
                    "focus:outline-none focus-visible:ring-2 focus-visible:ring-sky-400",
                    tab.ringClass,
                  )}
                >
                  <div className="flex items-center gap-3">
                    <span
                      className={cn(
                        "h-2 w-2 flex-shrink-0 rounded-full",
                        tab.indicator,
                      )}
                    />
                    <span className="flex flex-col">
                      <span>{tab.title}</span>
                      <span className="text-xs font-normal text-muted-foreground/70">
                        {itemsInTab}{" "}
                        {itemsInTab === 1 ? "paciente" : "pacientes"} na etapa
                      </span>
                    </span>
                  </div>
                </Tabs.Trigger>
              );
            })}
          </Tabs.List>

          {visibleTabs.map((tab) => {
            const tabEntries = orderedEntries.filter(tab.filter);
            return (
              <Tabs.Content
                key={tab.key}
                value={tab.key}
                className="rounded-2xl border border-border bg-card p-4 shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-400"
              >
                {tabEntries.length === 0 ? (
                  <div className="flex flex-col items-center justify-center gap-2 py-12 text-center text-sm text-muted-foreground">
                    <span>Nenhum paciente nessa etapa por enquanto.</span>
                    {canManageQueue && tab.key === "emergency" && onAddPatient ? (
                      <Button size="sm" onClick={onAddPatient} className="gap-2">
                        <Plus className="h-4 w-4" />
                        Adicionar paciente
                      </Button>
                    ) : null}
                  </div>
                ) : (
                  <Droppable droppableId={tab.key}>
                    {(provided, snapshot) => (
                      <div
                        ref={provided.innerRef}
                        {...provided.droppableProps}
                        className={cn(
                          "grid gap-3 md:grid-cols-2 2xl:grid-cols-3",
                          snapshot.isDraggingOver && "bg-muted/40 rounded-xl p-2",
                        )}
                      >
                        {tabEntries.map((entry, index) => (
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
                                  dragSnapshot.isDragging && "rotate-1 scale-[1.01]",
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
                                  tabContext={tab.key as TabKey}
                                />
                              </div>
                            )}
                          </Draggable>
                        ))}
                        {provided.placeholder}
                      </div>
                    )}
                  </Droppable>
                )}
              </Tabs.Content>
            );
          })}
        </Tabs.Root>
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


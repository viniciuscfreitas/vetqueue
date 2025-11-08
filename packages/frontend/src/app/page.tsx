"use client";

import { useEffect, useMemo } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { useRouter } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import {
  queueApi,
  ModuleKey,
  ReportStats,
  FinancialSummary,
  PaymentStatus,
} from "@/lib/api";
import { AppShell } from "@/components/AppShell";
import { Header } from "@/components/Header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import {
  Stethoscope,
  Plus,
  HeartPulse,
  CalendarDays,
  PiggyBank,
  Users,
  PawPrint,
  Activity,
} from "lucide-react";
import { formatCurrency } from "@/lib/financialUtils";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

export default function Home() {
  const router = useRouter();
  const { user, isLoading: authLoading, canAccess } = useAuth();

  const canViewReports = canAccess(ModuleKey.REPORTS);
  const canViewFinancial = canAccess(ModuleKey.FINANCIAL);

  useEffect(() => {
    if (!authLoading && !user) {
      router.push("/login");
    }
  }, [user, authLoading, router]);

  const { data: reportStats, isLoading: isLoadingReports } = useQuery<ReportStats>({
    queryKey: ["dashboard", "reports"],
    queryFn: () =>
      queueApi
        .getReports()
        .then((response) => response.data),
    enabled: !authLoading && !!user && canViewReports,
    staleTime: 60_000,
  });

  const { data: financialSummary, isLoading: isLoadingFinancial } = useQuery<FinancialSummary>({
    queryKey: ["dashboard", "financial-summary"],
    queryFn: () =>
      queueApi
        .getFinancialSummary()
        .then((response) => response.data),
    enabled: !authLoading && !!user && canViewFinancial,
    staleTime: 60_000,
  });

  const conversionRate = useMemo(() => {
    if (!reportStats?.cancellationRate && reportStats?.cancellationRate !== 0) return null;
    const rate = 100 - reportStats.cancellationRate;
    return rate < 0 ? 0 : Number(rate.toFixed(1));
  }, [reportStats]);

  const churnRate = useMemo(() => {
    const cancelled = reportStats?.cancellationRate ?? null;
    return cancelled != null ? Number(cancelled.toFixed(1)) : null;
  }, [reportStats]);

  const mrr = formatCurrency(financialSummary?.totals.amount);
  const totalEntries = financialSummary?.totalEntries ?? 0;

  const arpu = useMemo(() => {
    if (!financialSummary || totalEntries === 0) return "R$ 0,00";
    const revenueNumber = Number(financialSummary.totals.amount ?? 0);
    if (!Number.isFinite(revenueNumber) || revenueNumber === 0) {
      return "R$ 0,00";
    }
    return formatCurrency(String(revenueNumber / totalEntries));
  }, [financialSummary, totalEntries]);

  const pendingPayments = useMemo(() => {
    if (!financialSummary) return 0;
    const pending = financialSummary.byStatus?.[PaymentStatus.PENDING];
    return pending?.count ?? 0;
  }, [financialSummary]);

  const alerts = useMemo(() => {
    const items = [];
    const emergencies = reportStats?.byPriority?.emergency ?? 0;
    if (emergencies > 0) {
      items.push({
        label: `${emergencies} emergências aguardando`,
        tone: "critical" as const,
      });
    }
    if (pendingPayments > 0) {
      items.push({
        label: `${pendingPayments} pagamentos pendentes`,
        tone: "warning" as const,
      });
    }
    return items;
  }, [reportStats, pendingPayments]);

  const handleSearch = (term: string) => {
    const trimmed = term.trim();
    if (!trimmed) {
      router.push("/patients");
      return;
    }
    router.push(`/patients?search=${encodeURIComponent(trimmed)}`);
  };

  if (authLoading || !user) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-muted/30">
        <div className="flex flex-col items-center gap-3 rounded-xl border border-dashed border-slate-300/70 bg-white/90 px-6 py-8 shadow-sm">
          <PawPrint className="h-8 w-8 text-primary" />
          <p className="text-sm text-muted-foreground">Carregando informações do hospital...</p>
        </div>
      </div>
    );
  }

  const actions = [
    {
      label: "Adicionar Consulta",
      icon: <Stethoscope className="h-4 w-4" />,
      onClick: () => router.push("/queue"),
    },
    {
      label: "Novo Paciente",
      icon: <Plus className="h-4 w-4" />,
      variant: "outline" as const,
      onClick: () => router.push("/patients"),
    },
  ];

  return (
    <AppShell
      header={
        <Header
          onSearch={canAccess(ModuleKey.PATIENTS) ? handleSearch : undefined}
          actions={actions}
          alerts={alerts}
        />
      }
    >
      <div className="space-y-8">
        <section className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            {(isLoadingReports || isLoadingFinancial) && (
              <>
                {Array.from({ length: 4 }).map((_, index) => (
                  <Card key={`skeleton-${index}`} className="shadow-none">
                    <CardHeader className="space-y-2">
                      <Skeleton className="h-4 w-1/3" />
                      <Skeleton className="h-6 w-2/3" />
                    </CardHeader>
                    <CardContent>
                      <Skeleton className="h-8 w-1/2" />
                    </CardContent>
                  </Card>
                ))}
              </>
            )}
            {!isLoadingReports && !isLoadingFinancial && (
              <>
                <MetricCard
                  icon={HeartPulse}
                  label="Taxa de Conversão"
                  helper="Agendamentos concluídos"
                  value={conversionRate != null ? `${conversionRate}%` : "Indisponível"}
                />
                <MetricCard
                  icon={Activity}
                  label="Churn de Clientes"
                  helper="Cancelamentos no período"
                  value={churnRate != null ? `${churnRate}%` : "Indisponível"}
                />
                <MetricCard
                  icon={PiggyBank}
                  label="MRR"
                  helper="Receita recorrente mensal"
                  value={canViewFinancial ? mrr : "Restrito"}
                />
                <MetricCard
                  icon={Users}
                  label="ARPU"
                  helper="Receita por tutor"
                  value={canViewFinancial ? arpu : "Restrito"}
                />
              </>
            )}
          </div>
        </section>

        <section className="grid gap-4 xl:grid-cols-5">
          <Card className="xl:col-span-3">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base font-semibold text-slate-800">
                <CalendarDays className="h-4 w-4 text-primary" />
                Hoje na Fila
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex flex-wrap gap-3 text-sm text-muted-foreground">
                <Badge variant="outline" className="gap-2 border-slate-200 bg-primary/5 text-primary">
                  <PawPrint className="h-4 w-4" />
                  {reportStats?.total ?? 0} atendimentos no período
                </Badge>
                <Badge variant="outline" className="gap-2 border-slate-200">
                  Tempo médio de espera: {reportStats?.avgWaitTimeMinutes ?? 0} min
                </Badge>
                <Badge variant="outline" className="gap-2 border-slate-200">
                  Tempo médio de atendimento: {reportStats?.avgServiceTimeMinutes ?? 0} min
                </Badge>
              </div>
              <div className="rounded-xl border border-dashed border-slate-200 bg-slate-50/60 p-4 text-sm leading-relaxed text-slate-700">
                Use a fila para mover pacientes entre etapas do funil (Emergências → Triagem → Tratamentos → Alta → Pagos).
                Drag & drop será liberado em breve para acelerar o atendimento — por enquanto, mantenha os status atualizados.
              </div>
            </CardContent>
          </Card>

          <Card className="xl:col-span-2">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base font-semibold text-slate-800">
                <Stethoscope className="h-4 w-4 text-primary" />
                Próximas ações
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <ActionListItem
                title="Chamar próximo paciente"
                description="Acesse a fila e priorize urgências verificando quem está aguardando há mais tempo."
                onClick={() => router.push("/queue")}
              />
              <ActionListItem
                title="Registrar nova consulta"
                description="Abra o prontuário e registre diagnóstico, medicação e anexos para manter o histórico completo."
                onClick={() => router.push("/queue?tab=history")}
              />
              <ActionListItem
                title="Conferir faturamento pendente"
                description="Revise pagamentos em aberto para manter o MRR saudável e evitar inadimplência."
                disabled={!canViewFinancial}
                onClick={() => router.push("/financial")}
              />
            </CardContent>
          </Card>
        </section>

        <section className="grid gap-4 lg:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle className="text-base font-semibold text-slate-800">
                Frequência de uso
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-sm text-muted-foreground">
              <p>
                Mantenha DAU/MAU alto incentivando os veterinários a assumir atendimentos via tablet ou desktop.
                Use alertas por WhatsApp para trazer tutores de volta quando houver reagendamentos.
              </p>
              <Button
                variant="outline"
                size="sm"
                onClick={() => router.push("/queue")}
                className="w-fit gap-2"
              >
                <HeartPulse className="h-4 w-4" />
                Acompanhar andamento
              </Button>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-base font-semibold text-slate-800">
                Checklist rápido
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <ChecklistItem done={pendingPayments === 0}>
                Cobranças pendentes confirmadas
              </ChecklistItem>
              <ChecklistItem done={(reportStats?.byPriority?.emergency ?? 0) === 0}>
                Emergências atendidas
              </ChecklistItem>
              <ChecklistItem done={(reportStats?.topVets?.length ?? 0) > 0}>
                Veterinários ativos monitorados
              </ChecklistItem>
            </CardContent>
          </Card>
        </section>
      </div>
    </AppShell>
  );
}

interface MetricCardProps {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  helper: string;
  value: string;
}

function MetricCard({ icon: Icon, label, helper, value }: MetricCardProps) {
  return (
    <Card className="border border-slate-200/80 shadow-none transition hover:border-primary/40 hover:shadow-sm">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium text-slate-600">{label}</CardTitle>
        <span className="flex h-9 w-9 items-center justify-center rounded-full bg-primary/10 text-primary">
          <Icon className="h-4 w-4" />
        </span>
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-semibold text-slate-900">{value}</div>
        <p className="mt-1 text-xs text-muted-foreground">{helper}</p>
      </CardContent>
    </Card>
  );
}

interface ActionListItemProps {
  title: string;
  description: string;
  onClick: () => void;
  disabled?: boolean;
}

function ActionListItem({ title, description, onClick, disabled }: ActionListItemProps) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={cn(
        "w-full text-left transition",
        disabled
          ? "cursor-not-allowed text-muted-foreground/70"
          : "rounded-lg border border-transparent bg-white px-4 py-3 shadow-sm hover:border-primary/30 hover:shadow-md",
      )}
      type="button"
    >
      <div className="flex items-start justify-between gap-2">
        <div>
          <p className="text-sm font-semibold text-slate-700">{title}</p>
          <p className="mt-1 text-xs text-muted-foreground leading-relaxed">{description}</p>
        </div>
        {!disabled && <Plus className="h-4 w-4 text-slate-400" />}
      </div>
    </button>
  );
}

interface ChecklistItemProps {
  children: React.ReactNode;
  done?: boolean;
}

function ChecklistItem({ children, done = false }: ChecklistItemProps) {
  return (
    <div className="flex items-center gap-3 rounded-lg border border-slate-200/80 bg-white px-3 py-2 text-sm text-slate-700">
      <span
        className={cn(
          "flex h-6 w-6 items-center justify-center rounded-full border border-slate-300 text-xs font-semibold",
          done ? "border-emerald-500 bg-emerald-500/10 text-emerald-700" : "bg-slate-50 text-slate-400",
        )}
      >
        {done ? "✔" : "•"}
      </span>
      <span>{children}</span>
    </div>
  );
}

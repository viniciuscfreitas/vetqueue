import { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";
import { queueApi, FinancialReportData, FinancialSummary, PaymentStatus } from "@/lib/api";
import { paymentMethodLabels, paymentStatusLabels } from "@/lib/financialUtils";
import { Skeleton } from "./ui/skeleton";
import type { FinancialFiltersState } from "./FinancialFilters";

interface FinancialOverviewTabProps {
  filters: FinancialFiltersState;
}

const formatter = new Intl.NumberFormat("pt-BR", {
  style: "currency",
  currency: "BRL",
});

function formatCurrency(value: string) {
  const parsed = Number(value);
  if (Number.isNaN(parsed)) {
    return "R$ 0,00";
  }
  return formatter.format(parsed);
}

function buildSummaryParams(filters: FinancialFiltersState) {
  const params: Record<string, string> = {};

  params.startDate = filters.startDate;
  params.endDate = filters.endDate;

  if (filters.tutorName) params.tutorName = filters.tutorName;
  if (filters.patientName) params.patientName = filters.patientName;
  if (filters.serviceType) params.serviceType = filters.serviceType;
  if (filters.paymentMethod && filters.paymentMethod !== "ALL") {
    params.paymentMethod = filters.paymentMethod;
  }
  if (filters.paymentStatus && filters.paymentStatus !== "ALL") {
    params.paymentStatus = filters.paymentStatus;
  }
  if (filters.paymentReceivedById && filters.paymentReceivedById !== "ALL") {
    params.paymentReceivedById = filters.paymentReceivedById;
  }
  if (filters.minAmount) params.minAmount = filters.minAmount;
  if (filters.maxAmount) params.maxAmount = filters.maxAmount;

  return params;
}

export function FinancialOverviewTab({ filters }: FinancialOverviewTabProps) {
  const params = useMemo(() => buildSummaryParams(filters), [filters]);

  const { data, isLoading } = useQuery<FinancialSummary>({
    queryKey: ["financial", "summary", params],
    queryFn: () => queueApi.getFinancialSummary(params).then((res) => res.data),
  });

  const { data: reportsData } = useQuery<FinancialReportData>({
    queryKey: ["financial", "reports", params],
    queryFn: () => queueApi.getFinancialReports(params).then((res) => res.data),
  });

  if (isLoading) {
    return (
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {[...Array(4)].map((_, index) => (
          <Card key={index}>
            <CardHeader className="pb-2">
              <Skeleton className="h-4 w-20" />
            </CardHeader>
            <CardContent className="pt-0">
              <Skeleton className="h-6 w-24" />
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  if (!data) {
    return (
      <div className="text-center py-10 text-muted-foreground">
        Nenhum dado disponível para o período selecionado.
      </div>
    );
  }

  const pendingCount =
    data.byStatus?.[PaymentStatus.PENDING]?.count ?? 0;
  const pendingAmount =
    formatCurrency(data.byStatus?.[PaymentStatus.PENDING]?.amount ?? "0");
  const partialAmount =
    formatCurrency(data.byStatus?.[PaymentStatus.PARTIAL]?.amount ?? "0");
  const paidAmount =
    formatCurrency(data.byStatus?.[PaymentStatus.PAID]?.amount ?? "0");

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-xs font-medium text-muted-foreground">
              Total recebido
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-0">
            <p className="text-xl font-semibold">{formatCurrency(data.totals.paid)}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-xs font-medium text-muted-foreground">
              Total pendente
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-0">
            <p className="text-xl font-semibold">{pendingAmount}</p>
            <p className="text-xs text-muted-foreground mt-0.5">
              {pendingCount} atendimento(s)
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-xs font-medium text-muted-foreground">
              Total parcial
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-0">
            <p className="text-xl font-semibold">{partialAmount}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-xs font-medium text-muted-foreground">
              Atendimentos
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-0">
            <p className="text-xl font-semibold">{data.totalEntries}</p>
            <p className="text-xs text-muted-foreground mt-0.5">
              {data.walkIns} sem agendamento · {data.scheduled} agendados
            </p>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-semibold">Por forma de pagamento</CardTitle>
          </CardHeader>
          <CardContent className="pt-0 space-y-1.5">
            {Object.entries(data.byPaymentMethod).map(([method, stats]) => {
              const label = paymentMethodLabels[method] ?? paymentMethodLabels["NÃO_INFORMADO"] ?? method;
              return (
                <div key={method} className="flex items-center justify-between text-sm py-1">
                  <span className="text-muted-foreground">{label}</span>
                  <span className="font-medium">
                    {formatCurrency(stats.amount)} <span className="text-muted-foreground">·</span> {stats.count}
                  </span>
                </div>
              );
            })}
            {Object.keys(data.byPaymentMethod).length === 0 && (
              <div className="text-sm text-muted-foreground py-2">
                Nenhum recebimento registrado.
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-semibold">Por status de pagamento</CardTitle>
          </CardHeader>
          <CardContent className="pt-0 space-y-1.5">
            {Object.entries(data.byStatus).map(([status, stats]) => {
              const label = paymentStatusLabels[status as PaymentStatus] ?? status;
              return (
                <div key={status} className="flex items-center justify-between text-sm py-1">
                  <span className="text-muted-foreground">{label}</span>
                  <span className="font-medium">
                    {formatCurrency(stats.amount)} <span className="text-muted-foreground">·</span> {stats.count}
                  </span>
                </div>
              );
            })}
          </CardContent>
        </Card>
      </div>

      {reportsData && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-semibold">Top serviços</CardTitle>
            </CardHeader>
            <CardContent className="pt-0 space-y-1.5">
            {reportsData.revenueByService.slice(0, 3).map((service) => (
              <div key={service.service || "NÃO_INFORMADO"} className="flex items-center justify-between text-sm py-1">
                <span className="text-muted-foreground">{service.service || "Não informado"}</span>
                <span className="font-medium">
                  {formatCurrency(service.amount)} <span className="text-muted-foreground">·</span> {service.count}
                </span>
              </div>
            ))}
              {reportsData.revenueByService.length === 0 && (
                <div className="text-sm text-muted-foreground py-2">
                  Nenhum serviço faturado no período.
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-semibold">Pendências recentes</CardTitle>
            </CardHeader>
            <CardContent className="pt-0 space-y-1.5">
              {reportsData.pendingPayments.slice(0, 3).map((pending) => (
                <div key={pending.id} className="flex flex-col text-sm border rounded-md px-2.5 py-1.5 bg-muted/30">
                  <div className="flex justify-between">
                    <span className="font-medium text-xs">{pending.patientName}</span>
                    <span className="font-semibold text-xs">{formatCurrency(pending.paymentAmount ?? "0")}</span>
                  </div>
                  <span className="text-xs text-muted-foreground mt-0.5">
                    {pending.tutorName} · {paymentStatusLabels[pending.paymentStatus as PaymentStatus] ?? pending.paymentStatus} ·{" "}
                    {pending.completedAt ? new Date(pending.completedAt).toLocaleDateString("pt-BR") : "sem data"}
                  </span>
                </div>
              ))}
              {reportsData.pendingPayments.length === 0 && (
                <div className="text-sm text-muted-foreground py-2">
                  Nenhum pagamento pendente para os filtros selecionados.
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}


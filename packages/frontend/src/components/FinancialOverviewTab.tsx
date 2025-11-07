import { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";
import { queueApi, FinancialReportData, FinancialSummary, PaymentStatus } from "@/lib/api";
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
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {[...Array(3)].map((_, index) => (
          <Card key={index}>
            <CardHeader>
              <Skeleton className="h-5 w-24" />
            </CardHeader>
            <CardContent>
              <Skeleton className="h-12 w-32" />
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
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader>
            <CardTitle className="text-sm text-muted-foreground">
              Total recebido
            </CardTitle>
          </CardHeader>
          <CardContent className="text-2xl font-semibold">
            {formatCurrency(data.totals.paid)}
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="text-sm text-muted-foreground">
              Total pendente
            </CardTitle>
          </CardHeader>
          <CardContent className="text-2xl font-semibold">
            {pendingAmount}
            <p className="text-xs text-muted-foreground mt-1">
              {pendingCount} atendimento(s) pendente(s)
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="text-sm text-muted-foreground">
              Total parcial
            </CardTitle>
          </CardHeader>
          <CardContent className="text-2xl font-semibold">
            {partialAmount}
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="text-sm text-muted-foreground">
              Atendimentos concluídos
            </CardTitle>
          </CardHeader>
          <CardContent className="text-2xl font-semibold">
            {data.totalEntries}
            <p className="text-xs text-muted-foreground mt-1">
              Walk-in: {data.walkIns} · Agendados: {data.scheduled}
            </p>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Por forma de pagamento</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {Object.entries(data.byPaymentMethod).map(([method, stats]) => (
              <div key={method} className="flex items-center justify-between text-sm">
                <span>{method}</span>
                <span className="font-medium">
                  {formatCurrency(stats.amount)} · {stats.count}
                </span>
              </div>
            ))}
            {Object.keys(data.byPaymentMethod).length === 0 && (
              <div className="text-sm text-muted-foreground">
                Nenhum recebimento registrado.
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Por status de pagamento</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {Object.entries(data.byStatus).map(([status, stats]) => (
              <div key={status} className="flex items-center justify-between text-sm">
                <span>{status}</span>
                <span className="font-medium">
                  {formatCurrency(stats.amount)} · {stats.count}
                </span>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>

      {reportsData && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Top serviços</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              {reportsData.revenueByService.slice(0, 3).map((service) => (
                <div key={service.service || "NÃO_INFORMADO"} className="flex items-center justify-between text-sm">
                  <span>{service.service || "Não informado"}</span>
                  <span className="font-medium">
                    {formatCurrency(service.amount)} · {service.count}
                  </span>
                </div>
              ))}
              {reportsData.revenueByService.length === 0 && (
                <div className="text-sm text-muted-foreground">
                  Nenhum serviço faturado no período.
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-base">Pendências recentes</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              {reportsData.pendingPayments.slice(0, 3).map((pending) => (
                <div key={pending.id} className="flex flex-col text-sm border rounded-lg px-3 py-2">
                  <div className="flex justify-between">
                    <span className="font-medium">{pending.patientName}</span>
                    <span>{formatCurrency(pending.paymentAmount ?? "0")}</span>
                  </div>
                  <span className="text-xs text-muted-foreground">
                    {pending.tutorName} · {pending.paymentStatus} ·{" "}
                    {pending.completedAt ? new Date(pending.completedAt).toLocaleDateString("pt-BR") : "sem data"}
                  </span>
                </div>
              ))}
              {reportsData.pendingPayments.length === 0 && (
                <div className="text-sm text-muted-foreground">
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


import { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { queueApi, FinancialReportData } from "@/lib/api";
import { Card, CardHeader, CardTitle, CardContent } from "./ui/card";
import { Skeleton } from "./ui/skeleton";
import type { FinancialFiltersState } from "./FinancialFilters";

const currencyFormatter = new Intl.NumberFormat("pt-BR", {
  style: "currency",
  currency: "BRL",
});

function formatCurrency(value: string) {
  const parsed = Number(value);
  if (Number.isNaN(parsed)) {
    return "R$ 0,00";
  }
  return currencyFormatter.format(parsed);
}

function buildReportParams(filters: FinancialFiltersState) {
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

interface FinancialReportsTabProps {
  filters: FinancialFiltersState;
}

export function FinancialReportsTab({ filters }: FinancialReportsTabProps) {
  const params = useMemo(() => buildReportParams(filters), [filters]);

  const { data, isLoading } = useQuery({
    queryKey: ["financial", "reports", params],
    queryFn: () => queueApi.getFinancialReports(params).then((res) => res.data),
  });

  if (isLoading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {[...Array(2)].map((_, index) => (
          <Card key={index}>
            <CardHeader>
              <Skeleton className="h-5 w-32" />
            </CardHeader>
            <CardContent className="space-y-2">
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-3/4" />
              <Skeleton className="h-4 w-2/3" />
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  if (!data) {
    return null;
  }

  const renderList = (items: Array<{ label: string; amount: string; count?: number; subtitle?: string }>) => (
    <div className="space-y-2">
      {items.map((item) => (
        <div key={item.label} className="flex flex-col border rounded-lg px-3 py-2">
          <div className="flex justify-between text-sm font-medium">
            <span>{item.label}</span>
            <span>{formatCurrency(item.amount)}</span>
          </div>
          {item.count !== undefined && (
            <span className="text-xs text-muted-foreground">{item.count} atendimento(s)</span>
          )}
          {item.subtitle && (
            <span className="text-xs text-muted-foreground">{item.subtitle}</span>
          )}
        </div>
      ))}
      {items.length === 0 && (
        <div className="text-sm text-muted-foreground">
          Nenhum dado para os filtros selecionados.
        </div>
      )}
    </div>
  );

  const revenueByDayItems = data.revenueByDay.map((item) => ({
    label: item.date,
    amount: item.amount,
    count: item.count,
  }));

  const revenueByServiceItems = data.revenueByService.map((item) => ({
    label: item.service || "Não informado",
    amount: item.amount,
    count: item.count,
  }));

  const revenueByReceiverItems = data.revenueByReceiver.map((item) => ({
    label: item.receiverName,
    amount: item.amount,
    count: item.count,
  }));

  const pendingItems = data.pendingPayments.map((item) => ({
    label: `${item.patientName} · ${item.tutorName}`,
    amount: item.paymentAmount ?? "0",
    subtitle: `${item.paymentStatus} · ${item.serviceType}${
      item.completedAt ? ` · ${new Date(item.completedAt).toLocaleString("pt-BR")}` : ""
    }`,
  }));

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Faturamento por dia</CardTitle>
          </CardHeader>
          <CardContent>{renderList(revenueByDayItems)}</CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Faturamento por serviço</CardTitle>
          </CardHeader>
          <CardContent>{renderList(revenueByServiceItems)}</CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Recebimentos por recepcionista</CardTitle>
          </CardHeader>
          <CardContent>{renderList(revenueByReceiverItems)}</CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Pendências</CardTitle>
          </CardHeader>
          <CardContent>{renderList(pendingItems)}</CardContent>
        </Card>
      </div>
    </div>
  );
}


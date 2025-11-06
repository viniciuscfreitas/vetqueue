"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { queueApi, FinancialSummary, QueueEntry } from "@/lib/api";
import { Pagination } from "@/components/Pagination";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { useDateRange } from "@/hooks/useDateRange";
import { useState, useEffect } from "react";
import { DollarSign, CreditCard, Wallet, Banknote } from "lucide-react";
import { useToast } from "@/components/ui/use-toast";
import { createErrorHandler } from "@/lib/errors";

interface FinancialTabProps {
  authLoading: boolean;
}

export function FinancialTab({ authLoading }: FinancialTabProps) {
  const { startDate, endDate, setStartDate, setEndDate } = useDateRange();
  const [filters, setFilters] = useState({
    tutorName: "",
    patientName: "",
    paymentMethod: "__ALL__",
  });
  const [page, setPage] = useState(1);
  const { toast } = useToast();
  const handleError = createErrorHandler(toast);
  const queryClient = useQueryClient();
  const [editingPayment, setEditingPayment] = useState<Record<string, string | null>>({});

  const { data: financialData, isLoading: isLoadingFinancial } = useQuery({
    queryKey: ["financial", startDate, endDate, filters, page],
    queryFn: () =>
      queueApi
        .getFinancial({
          startDate,
          endDate,
          tutorName: filters.tutorName || undefined,
          patientName: filters.patientName || undefined,
          paymentMethod: filters.paymentMethod === "__ALL__" ? undefined : filters.paymentMethod,
          page,
          limit: 20,
        })
        .then((res) => res.data),
    enabled: !authLoading,
  });

  const { data: summary, isLoading: isLoadingSummary } = useQuery<FinancialSummary>({
    queryKey: ["financial", "summary", startDate, endDate],
    queryFn: () =>
      queueApi
        .getFinancialSummary({
          startDate,
          endDate,
        })
        .then((res) => res.data),
    enabled: !authLoading,
  });

  const financialEntries = financialData?.entries || [];
  const financialPaginated = financialData;

  useEffect(() => {
    setPage(1);
  }, [startDate, endDate, filters]);

  const hasActiveFilters = filters.tutorName || filters.patientName || (filters.paymentMethod && filters.paymentMethod !== "__ALL__");

  const paymentMethodLabels: Record<string, string> = {
    CREDIT: "Crédito",
    DEBIT: "Débito",
    CASH: "Dinheiro",
    PIX: "PIX",
    NÃO_INFORMADO: "Não Informado",
  };

  const updatePaymentMutation = useMutation({
    mutationFn: ({ id, paymentMethod }: { id: string; paymentMethod: string | null }) =>
      queueApi.updatePayment(id, paymentMethod),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["financial"] });
      queryClient.invalidateQueries({ queryKey: ["queue"] });
      toast({
        title: "Sucesso",
        description: "Forma de pagamento atualizada",
      });
    },
    onError: handleError,
  });

  const handlePaymentChange = (entryId: string, value: string) => {
    setEditingPayment({ ...editingPayment, [entryId]: value });
  };

  const handlePaymentSave = (entryId: string) => {
    const paymentMethod = editingPayment[entryId] === "__NONE__" ? null : editingPayment[entryId];
    updatePaymentMutation.mutate({ id: entryId, paymentMethod: paymentMethod || null });
    const newEditing = { ...editingPayment };
    delete newEditing[entryId];
    setEditingPayment(newEditing);
  };

  const formatDateTime = (dateString?: string | null) => {
    if (!dateString) return "-";
    const date = new Date(dateString);
    return date.toLocaleString("pt-BR", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  return (
    <div className="space-y-6">
      <div className="space-y-4">
        <div>
          <h2 className="text-xl font-semibold">Controle Financeiro</h2>
          <p className="text-sm text-muted-foreground mt-1">
            Controle de pagamentos e atendimentos
          </p>
        </div>

        <Card>
          <CardContent className="pt-4">
            <div className="flex flex-wrap gap-3 items-end">
              <div className="min-w-0">
                <Label htmlFor="financialStartDate" className="text-xs mb-1 block text-muted-foreground">
                  Inicial
                </Label>
                <Input
                  id="financialStartDate"
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                />
              </div>
              <div className="min-w-0">
                <Label htmlFor="financialEndDate" className="text-xs mb-1 block text-muted-foreground">
                  Final
                </Label>
                <Input
                  id="financialEndDate"
                  type="date"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                />
              </div>
              <div className="min-w-0">
                <Label htmlFor="financialPaymentMethod" className="text-xs mb-1 block text-muted-foreground">
                  Pagamento
                </Label>
                <Select
                  value={filters.paymentMethod}
                  onValueChange={(value) =>
                    setFilters({
                      ...filters,
                      paymentMethod: value,
                    })
                  }
                >
                  <SelectTrigger className="w-[140px]">
                    <SelectValue placeholder="Todos" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="__ALL__">Todos</SelectItem>
                    <SelectItem value="CREDIT">Crédito</SelectItem>
                    <SelectItem value="DEBIT">Débito</SelectItem>
                    <SelectItem value="CASH">Dinheiro</SelectItem>
                    <SelectItem value="PIX">PIX</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="min-w-0 flex-1 min-w-[180px]">
                <Label htmlFor="financialPatientName" className="text-xs mb-1 block text-muted-foreground">
                  Pet
                </Label>
                <Input
                  id="financialPatientName"
                  placeholder="Nome do pet..."
                  value={filters.patientName}
                  onChange={(e) =>
                    setFilters({ ...filters, patientName: e.target.value })
                  }
                  className="w-full"
                />
              </div>
              <div className="min-w-0 flex-1 min-w-[180px]">
                <Label htmlFor="financialTutorName" className="text-xs mb-1 block text-muted-foreground">
                  Tutor
                </Label>
                <Input
                  id="financialTutorName"
                  placeholder="Nome do tutor..."
                  value={filters.tutorName}
                  onChange={(e) =>
                    setFilters({ ...filters, tutorName: e.target.value })
                  }
                  className="w-full"
                />
              </div>
              {hasActiveFilters && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() =>
                    setFilters({ tutorName: "", patientName: "", paymentMethod: "__ALL__" })
                  }
                  className="h-10"
                >
                  Limpar
                </Button>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {isLoadingSummary ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
          {[1, 2, 3, 4, 5].map((i) => (
            <Card key={i}>
              <CardHeader>
                <Skeleton className="h-6 w-32" />
              </CardHeader>
              <CardContent>
                <Skeleton className="h-8 w-20" />
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                <DollarSign className="h-4 w-4" />
                Total
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{summary?.total || 0}</div>
            </CardContent>
          </Card>
          {summary?.byPaymentMethod && Object.entries(summary.byPaymentMethod).map(([method, count]) => (
            <Card key={method}>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                  {method === "CREDIT" && <CreditCard className="h-4 w-4" />}
                  {method === "DEBIT" && <CreditCard className="h-4 w-4" />}
                  {method === "CASH" && <Banknote className="h-4 w-4" />}
                  {method === "PIX" && <Wallet className="h-4 w-4" />}
                  {!["CREDIT", "DEBIT", "CASH", "PIX"].includes(method) && <DollarSign className="h-4 w-4" />}
                  {paymentMethodLabels[method] || method}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{count}</div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {isLoadingFinancial ? (
        <div className="space-y-2">
          <Skeleton className="h-10 w-full" />
          <Skeleton className="h-10 w-full" />
          <Skeleton className="h-10 w-full" />
        </div>
      ) : (
        <>
          <div className="space-y-4">
            {financialEntries.length > 0 && (
              <p className="text-sm text-muted-foreground">
                {financialPaginated ? `${financialPaginated.total} atendimentos encontrados` : `${financialEntries.length} atendimentos encontrados`}
              </p>
            )}
            {financialEntries.length === 0 ? (
              <div className="text-center py-12">
                <p className="text-muted-foreground">
                  {hasActiveFilters
                    ? "Nenhum atendimento encontrado com os filtros aplicados"
                    : "Nenhum atendimento concluído no período selecionado"}
                </p>
              </div>
            ) : (
              <div className="border rounded-lg overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="bg-muted">
                      <tr>
                        <th className="px-4 py-3 text-left text-sm font-semibold">Nome do Animal</th>
                        <th className="px-4 py-3 text-left text-sm font-semibold">Nome do Tutor</th>
                        <th className="px-4 py-3 text-left text-sm font-semibold">Forma de Pagamento</th>
                        <th className="px-4 py-3 text-left text-sm font-semibold">Horário de Entrada</th>
                        <th className="px-4 py-3 text-left text-sm font-semibold">Horário de Saída</th>
                      </tr>
                    </thead>
                    <tbody>
                      {financialEntries.map((entry) => {
                        const isEditing = editingPayment[entry.id] !== undefined;
                        const currentPayment = isEditing ? editingPayment[entry.id] : (entry.paymentMethod || "__NONE__");
                        return (
                          <tr key={entry.id} className="border-b hover:bg-muted/50">
                            <td className="px-4 py-3 text-sm">{entry.patientName}</td>
                            <td className="px-4 py-3 text-sm">{entry.tutorName}</td>
                            <td className="px-4 py-3">
                              {isEditing ? (
                                <div className="flex items-center gap-2">
                                  <Select
                                    value={currentPayment || "__NONE__"}
                                    onValueChange={(value) => handlePaymentChange(entry.id, value)}
                                  >
                                    <SelectTrigger className="w-[140px]">
                                      <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                      <SelectItem value="__NONE__">Não informado</SelectItem>
                                      <SelectItem value="CREDIT">Crédito</SelectItem>
                                      <SelectItem value="DEBIT">Débito</SelectItem>
                                      <SelectItem value="CASH">Dinheiro</SelectItem>
                                      <SelectItem value="PIX">PIX</SelectItem>
                                    </SelectContent>
                                  </Select>
                                  <Button
                                    size="sm"
                                    onClick={() => handlePaymentSave(entry.id)}
                                    disabled={updatePaymentMutation.isPending}
                                  >
                                    Salvar
                                  </Button>
                                  <Button
                                    size="sm"
                                    variant="ghost"
                                    onClick={() => {
                                      const newEditing = { ...editingPayment };
                                      delete newEditing[entry.id];
                                      setEditingPayment(newEditing);
                                    }}
                                  >
                                    Cancelar
                                  </Button>
                                </div>
                              ) : (
                                <div className="flex items-center gap-2">
                                  <span className="text-sm">
                                    {paymentMethodLabels[entry.paymentMethod || "NÃO_INFORMADO"] || "Não informado"}
                                  </span>
                                  <Button
                                    size="sm"
                                    variant="ghost"
                                    onClick={() => setEditingPayment({ ...editingPayment, [entry.id]: entry.paymentMethod || "__NONE__" })}
                                  >
                                    Editar
                                  </Button>
                                </div>
                              )}
                            </td>
                            <td className="px-4 py-3 text-sm">{formatDateTime(entry.createdAt)}</td>
                            <td className="px-4 py-3 text-sm">{formatDateTime(entry.completedAt)}</td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>
          {financialPaginated && (
            <Pagination
              currentPage={financialPaginated.page}
              totalPages={financialPaginated.totalPages}
              total={financialPaginated.total}
              onPageChange={setPage}
            />
          )}
        </>
      )}
    </div>
  );
}


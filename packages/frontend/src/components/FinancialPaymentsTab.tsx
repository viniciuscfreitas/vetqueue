import { useEffect, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { queueApi, PaymentStatus, QueueEntry } from "@/lib/api";
import type { FinancialFiltersState } from "./FinancialFilters";
import { formatCurrency, paymentStatusLabels } from "@/lib/financialUtils";
import { Pagination } from "./Pagination";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Skeleton } from "./ui/skeleton";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "./ui/select";
import { createErrorHandler } from "@/lib/errors";
import { useToast } from "./ui/use-toast";
import { StatusBadge } from "./StatusBadge";
import { PaymentDetailsModal } from "./PaymentDetailsModal";
import { Eye } from "lucide-react";

interface FinancialPaymentsTabProps {
  filters: FinancialFiltersState;
}

function buildFinancialParams(filters: FinancialFiltersState, page: number) {
  const params: Record<string, string | number> = {
    startDate: filters.startDate,
    endDate: filters.endDate,
    page,
    limit: 20,
  };

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

export function FinancialPaymentsTab({
  filters,
}: FinancialPaymentsTabProps) {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const handleError = createErrorHandler(toast);

  const [page, setPage] = useState(1);
  const [selectedEntry, setSelectedEntry] = useState<QueueEntry | null>(null);
  const [isDetailsModalOpen, setIsDetailsModalOpen] = useState(false);
  const [editingRowId, setEditingRowId] = useState<string | null>(null);
  const [editingField, setEditingField] = useState<"amount" | "status" | null>(null);
  const [editingValue, setEditingValue] = useState<string>("");
  const [editingStatus, setEditingStatus] = useState<PaymentStatus>(PaymentStatus.PENDING);

  useEffect(() => {
    setPage(1);
  }, [filters]);

  const params = buildFinancialParams(filters, page);

  const { data, isLoading } = useQuery({
    queryKey: ["financial", "payments", params],
    queryFn: () => queueApi.getFinancial(params).then((res) => res.data),
  });

  const entries = data?.entries ?? [];

  const updatePaymentMutation = useMutation({
    mutationFn: ({
      id,
      payload,
    }: {
      id: string;
      payload: {
        paymentMethod?: string | null;
        paymentStatus?: PaymentStatus;
        paymentAmount?: string | null;
        paymentReceivedAt?: string | null;
        paymentNotes?: string | null;
        paymentReceivedById?: string | null;
      };
    }) => queueApi.updatePayment(id, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["financial"] });
      queryClient.invalidateQueries({ queryKey: ["queue"] });
      toast({
        title: "Sucesso",
        description: "Informações financeiras atualizadas",
      });
    },
    onError: handleError,
  });


  const handleViewDetails = (entry: QueueEntry) => {
    setSelectedEntry(entry);
    setIsDetailsModalOpen(true);
  };

  const handleStartEdit = (entry: QueueEntry, field: "amount" | "status") => {
    setEditingRowId(entry.id);
    setEditingField(field);
    if (field === "amount") {
      setEditingValue(entry.paymentAmount ?? "");
    } else {
      setEditingStatus(entry.paymentStatus ?? PaymentStatus.PENDING);
    }
  };

  const handleSaveAmount = (entry: QueueEntry) => {
    if (editingValue !== entry.paymentAmount) {
      updatePaymentMutation.mutate({
        id: entry.id,
        payload: { paymentAmount: editingValue || null },
      });
    }
    setEditingRowId(null);
    setEditingField(null);
    setEditingValue("");
  };

  const handleCancelEdit = () => {
    setEditingRowId(null);
    setEditingField(null);
    setEditingValue("");
  };

  const paymentStatusOptions = [
    PaymentStatus.PENDING,
    PaymentStatus.PARTIAL,
    PaymentStatus.PAID,
    PaymentStatus.CANCELLED,
  ] as const;

  if (isLoading) {
    return (
      <div className="border rounded-lg overflow-hidden">
        <table className="w-full">
          <thead className="bg-muted">
            <tr>
              <th className="px-4 py-3 text-left text-sm font-semibold">Paciente</th>
              <th className="px-4 py-3 text-left text-sm font-semibold">Valor</th>
              <th className="px-4 py-3 text-left text-sm font-semibold">Status</th>
              <th className="px-4 py-3 text-right text-sm font-semibold">Ações</th>
            </tr>
          </thead>
          <tbody>
            {[1, 2, 3, 4, 5].map((i) => (
              <tr key={i} className="border-b">
                <td className="px-4 py-3">
                  <Skeleton className="h-4 w-32" />
                </td>
                <td className="px-4 py-3">
                  <Skeleton className="h-4 w-20" />
                </td>
                <td className="px-4 py-3">
                  <Skeleton className="h-6 w-20 rounded-full" />
                </td>
                <td className="px-4 py-3">
                  <Skeleton className="h-8 w-20 ml-auto" />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    );
  }

  if (entries.length === 0) {
    return (
      <div className="border rounded-lg p-8 text-center">
        <p className="text-muted-foreground">
          Nenhum atendimento encontrado com os filtros selecionados.
        </p>
      </div>
    );
  }

  return (
    <>
      <div className="border rounded-lg overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-muted">
              <tr>
                <th className="px-4 py-3 text-left text-sm font-semibold">Paciente</th>
                <th className="px-4 py-3 text-left text-sm font-semibold">Valor</th>
                <th className="px-4 py-3 text-left text-sm font-semibold">Status</th>
                <th className="px-4 py-3 text-right text-sm font-semibold">Ações</th>
              </tr>
            </thead>
            <tbody>
              {entries.map((entry) => {
                const isEditingAmount = editingRowId === entry.id && editingField === "amount";
                const isEditingStatus = editingRowId === entry.id && editingField === "status";

                return (
                  <tr key={entry.id} className="border-b hover:bg-muted/30 transition-colors">
                    <td className="px-4 py-3">
                      <div className="flex flex-col">
                        <span className="font-medium">{entry.patientName}</span>
                        <span className="text-xs text-muted-foreground">
                          {entry.tutorName} · {entry.serviceType}
                        </span>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      {isEditingAmount ? (
                        <Input
                          type="number"
                          step="0.01"
                          value={editingValue}
                          onChange={(e) => setEditingValue(e.target.value)}
                          onBlur={() => handleSaveAmount(entry)}
                          onKeyDown={(e) => {
                            if (e.key === "Enter") {
                              handleSaveAmount(entry);
                            } else if (e.key === "Escape") {
                              handleCancelEdit();
                            }
                          }}
                          className="w-32 h-8"
                          autoFocus
                        />
                      ) : (
                        <span
                          className="font-semibold cursor-pointer hover:text-primary"
                          onClick={() => handleStartEdit(entry, "amount")}
                          title="Clique para editar"
                        >
                          {formatCurrency(entry.paymentAmount)}
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      {isEditingStatus ? (
                        <Select
                          value={editingStatus}
                          onValueChange={(value) => {
                            updatePaymentMutation.mutate({
                              id: entry.id,
                              payload: { paymentStatus: value as PaymentStatus },
                            });
                            setEditingRowId(null);
                            setEditingField(null);
                          }}
                          onOpenChange={(open) => {
                            if (!open) {
                              setEditingRowId(null);
                              setEditingField(null);
                            }
                          }}
                          open={true}
                        >
                          <SelectTrigger className="w-[140px] h-8">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {paymentStatusOptions.map((status) => (
                              <SelectItem key={status} value={status}>
                                {paymentStatusLabels[status]}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      ) : (
                        <div
                          className="cursor-pointer"
                          onClick={() => handleStartEdit(entry, "status")}
                          title="Clique para editar"
                        >
                          <StatusBadge status={entry.paymentStatus ?? PaymentStatus.PENDING} />
                        </div>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex justify-end">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleViewDetails(entry)}
                          className="h-8"
                        >
                          <Eye className="h-4 w-4 mr-1" />
                          Detalhes
                        </Button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {data && data.totalPages > 1 && (
        <div className="mt-6">
          <Pagination
            currentPage={data.page}
            totalPages={data.totalPages}
            total={data.total}
            onPageChange={setPage}
          />
        </div>
      )}

      <PaymentDetailsModal
        open={isDetailsModalOpen}
        onOpenChange={setIsDetailsModalOpen}
        entry={selectedEntry}
      />
    </>
  );
}


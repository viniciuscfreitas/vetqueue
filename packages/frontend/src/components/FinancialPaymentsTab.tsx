import { useEffect, useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { queueApi, PaymentStatus, QueueEntry } from "@/lib/api";
import type { FinancialFiltersState } from "./FinancialFilters";
import { Pagination } from "./Pagination";
import { Button } from "./ui/button";
import { Skeleton } from "./ui/skeleton";
import { createErrorHandler } from "@/lib/errors";
import { useToast } from "./ui/use-toast";
import { StatusBadge } from "./StatusBadge";
import { PaymentDetailsModal } from "./PaymentDetailsModal";
import { PaymentEditModal } from "./PaymentEditModal";
import { Eye, Edit2 } from "lucide-react";

interface FinancialPaymentsTabProps {
  filters: FinancialFiltersState;
  receptionists: Array<{ id: string; name: string }>;
}


const paymentMethodLabels: Record<string, string> = {
  CREDIT: "Crédito",
  DEBIT: "Débito",
  CASH: "Dinheiro",
  PIX: "PIX",
  "": "Não informado",
  NÃO_INFORMADO: "Não informado",
};

const paymentStatusLabels: Record<PaymentStatus, string> = {
  [PaymentStatus.PENDING]: "Pendente",
  [PaymentStatus.PARTIAL]: "Parcial",
  [PaymentStatus.PAID]: "Pago",
  [PaymentStatus.CANCELLED]: "Cancelado",
};

const currencyFormatter = new Intl.NumberFormat("pt-BR", {
  style: "currency",
  currency: "BRL",
});

function formatCurrency(value?: string | null) {
  if (!value) return "R$ 0,00";
  const parsed = Number(value);
  if (Number.isNaN(parsed)) return "R$ 0,00";
  return currencyFormatter.format(parsed);
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
  receptionists,
}: FinancialPaymentsTabProps) {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const handleError = createErrorHandler(toast);

  const [page, setPage] = useState(1);
  const [selectedEntry, setSelectedEntry] = useState<QueueEntry | null>(null);
  const [isDetailsModalOpen, setIsDetailsModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [entryToEdit, setEntryToEdit] = useState<QueueEntry | null>(null);

  useEffect(() => {
    setPage(1);
  }, [filters]);

  const params = useMemo(() => buildFinancialParams(filters, page), [filters, page]);

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

  const handleEditClick = (entry: QueueEntry, e: React.MouseEvent) => {
    e.stopPropagation();
    setEntryToEdit(entry);
    setIsEditModalOpen(true);
  };

  const handleSaveFromModal = (id: string, payload: {
    paymentMethod?: string | null;
    paymentStatus?: PaymentStatus;
    paymentAmount?: string | null;
    paymentReceivedAt?: string | null;
    paymentNotes?: string | null;
    paymentReceivedById?: string | null;
  }) => {
    updatePaymentMutation.mutate({ id, payload }, {
      onSuccess: () => {
        setIsEditModalOpen(false);
        setEntryToEdit(null);
      },
    });
  };

  const renderTableBody = () => {
    if (isLoading) {
      return (
        <>
          {[...Array(5)].map((_, i) => (
            <tr key={i}>
              <td className="px-4 py-3">
                <div className="space-y-2">
                  <Skeleton className="h-4 w-32" />
                  <Skeleton className="h-3 w-24" />
                </div>
              </td>
              <td className="px-4 py-3">
                <Skeleton className="h-4 w-20" />
              </td>
              <td className="px-4 py-3">
                <Skeleton className="h-6 w-20 rounded-full" />
              </td>
              <td className="px-4 py-3">
                <div className="flex justify-end gap-1">
                  <Skeleton className="h-8 w-8 rounded" />
                  <Skeleton className="h-8 w-8 rounded" />
                </div>
              </td>
            </tr>
          ))}
        </>
      );
    }

    if (entries.length === 0) {
      return (
        <tr>
          <td colSpan={4} className="px-4 py-12 text-center">
            <div className="flex flex-col items-center gap-2">
              <p className="text-sm font-medium text-muted-foreground">
                Nenhum atendimento encontrado
              </p>
              <p className="text-xs text-muted-foreground">
                Tente ajustar os filtros para encontrar resultados
              </p>
            </div>
          </td>
        </tr>
      );
    }

    return entries.map((entry) => {
      return (
        <tr
          key={entry.id}
          className="hover:bg-muted/30 transition-colors cursor-pointer group"
          onClick={() => handleViewDetails(entry)}
        >
          <td className="px-4 py-3">
            <div className="flex flex-col gap-0.5">
              <span className="text-sm font-medium text-foreground">{entry.patientName}</span>
              <span className="text-xs text-muted-foreground">
                {entry.tutorName} · {entry.serviceType}
              </span>
            </div>
          </td>
          <td className="px-4 py-3">
            <span className="text-sm font-semibold text-foreground">
              {formatCurrency(entry.paymentAmount)}
            </span>
          </td>
          <td className="px-4 py-3">
            <StatusBadge status={entry.paymentStatus ?? PaymentStatus.PENDING} />
          </td>
          <td className="px-4 py-3">
            <div className="flex items-center justify-end gap-1" onClick={(e) => e.stopPropagation()}>
              <Button
                variant="ghost"
                size="sm"
                onClick={(e) => handleEditClick(entry, e)}
                className="h-8 w-8 p-0 opacity-0 group-hover:opacity-100 transition-opacity"
                title="Editar"
              >
                <Edit2 className="h-4 w-4" />
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={(e) => {
                  e.stopPropagation();
                  handleViewDetails(entry);
                }}
                className="h-8 w-8 p-0 opacity-0 group-hover:opacity-100 transition-opacity"
                title="Ver detalhes"
              >
                <Eye className="h-4 w-4" />
              </Button>
            </div>
          </td>
        </tr>
      );
    });
  };

  return (
    <>
      <div className="space-y-4">
        <div className="border rounded-lg overflow-hidden bg-card shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-muted/50 border-b">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                    Paciente
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                    Valor
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-4 py-3 text-right text-xs font-semibold text-muted-foreground uppercase tracking-wider w-24">
                    Ações
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y">{renderTableBody()}</tbody>
            </table>
          </div>
        </div>

        {data && (
          <Pagination
            currentPage={data.page}
            totalPages={data.totalPages}
            total={data.total}
            onPageChange={setPage}
          />
        )}
      </div>

      <PaymentDetailsModal
        open={isDetailsModalOpen}
        onOpenChange={setIsDetailsModalOpen}
        entry={selectedEntry}
      />

      <PaymentEditModal
        open={isEditModalOpen}
        onOpenChange={setIsEditModalOpen}
        entry={entryToEdit}
        receptionists={receptionists}
        onSave={handleSaveFromModal}
        isLoading={updatePaymentMutation.isPending}
      />
    </>
  );
}


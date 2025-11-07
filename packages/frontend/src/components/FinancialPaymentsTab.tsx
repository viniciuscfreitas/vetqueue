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
            <tr key={i} className="border-b">
              <td className="px-3 py-2.5">
                <Skeleton className="h-4 w-32" />
              </td>
              <td className="px-3 py-2.5">
                <Skeleton className="h-4 w-24" />
              </td>
              <td className="px-3 py-2.5">
                <Skeleton className="h-6 w-20" />
              </td>
              <td className="px-3 py-2.5">
                <Skeleton className="h-4 w-16" />
              </td>
            </tr>
          ))}
        </>
      );
    }

    if (entries.length === 0) {
      return (
        <tr>
          <td colSpan={4} className="py-8 text-center text-sm text-muted-foreground">
            Nenhum atendimento encontrado com os filtros selecionados.
          </td>
        </tr>
      );
    }

    return entries.map((entry) => {
      return (
        <tr
          key={entry.id}
          className="border-b hover:bg-muted/50 transition-colors cursor-pointer"
          onClick={() => handleViewDetails(entry)}
        >
          <td className="px-3 py-2.5">
            <div className="flex flex-col">
              <span className="text-sm font-medium">{entry.patientName}</span>
              <span className="text-xs text-muted-foreground">
                {entry.tutorName} · {entry.serviceType}
              </span>
            </div>
          </td>
          <td className="px-3 py-2.5">
            <span className="text-sm font-semibold">
              {formatCurrency(entry.paymentAmount)}
            </span>
          </td>
          <td className="px-3 py-2.5">
            <StatusBadge status={entry.paymentStatus ?? PaymentStatus.PENDING} />
          </td>
          <td className="px-3 py-2.5">
            <div className="flex gap-1" onClick={(e) => e.stopPropagation()}>
              <Button
                variant="ghost"
                size="sm"
                onClick={(e) => handleEditClick(entry, e)}
                className="h-7 px-2"
              >
                <Edit2 className="h-3.5 w-3.5" />
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={(e) => {
                  e.stopPropagation();
                  handleViewDetails(entry);
                }}
                className="h-7 px-2"
              >
                <Eye className="h-3.5 w-3.5" />
              </Button>
            </div>
          </td>
        </tr>
      );
    });
  };

  return (
    <>
      <div className="space-y-3">
        <div className="border rounded-lg overflow-hidden bg-card">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-muted/50 sticky top-0 z-10">
                <tr className="text-left">
                  <th className="px-3 py-2.5 font-semibold text-xs uppercase tracking-wider">
                    Paciente
                  </th>
                  <th className="px-3 py-2.5 font-semibold text-xs uppercase tracking-wider">
                    Valor
                  </th>
                  <th className="px-3 py-2.5 font-semibold text-xs uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-3 py-2.5 font-semibold text-xs uppercase tracking-wider w-24">
                    Ações
                  </th>
                </tr>
              </thead>
              <tbody>{renderTableBody()}</tbody>
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


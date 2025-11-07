import { useEffect, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { queueApi, PaymentStatus, QueueEntry } from "@/lib/api";
import type { FinancialFiltersState } from "./FinancialFilters";
import { formatCurrency } from "@/lib/financialUtils";
import { Pagination } from "./Pagination";
import { Button } from "./ui/button";
import { Card, CardContent } from "./ui/card";
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

  if (isLoading) {
    return (
      <div className="space-y-4">
        {[1, 2, 3].map((i) => (
          <Card key={i}>
            <CardContent className="pt-6">
              <Skeleton className="h-20 w-full" />
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  if (entries.length === 0) {
    return (
      <Card>
        <CardContent className="pt-6">
          <p className="text-center text-muted-foreground">
            Nenhum atendimento encontrado com os filtros selecionados.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <>
      <div className="space-y-4">
        {entries.map((entry) => (
          <Card key={entry.id}>
            <CardContent className="pt-6">
              <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start gap-4">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-2 flex-wrap">
                    <p className="font-semibold text-lg">{entry.patientName}</p>
                    <StatusBadge status={entry.paymentStatus ?? PaymentStatus.PENDING} />
                  </div>
                  <div className="space-y-1 text-sm">
                    <p className="text-muted-foreground">
                      <span className="font-medium">Tutor:</span> {entry.tutorName}
                    </p>
                    <p className="text-muted-foreground">
                      <span className="font-medium">Serviço:</span> {entry.serviceType}
                    </p>
                    <p className="text-muted-foreground">
                      <span className="font-medium">Valor:</span>{" "}
                      <span className="font-semibold">{formatCurrency(entry.paymentAmount)}</span>
                    </p>
                    {entry.paymentReceivedBy && (
                      <p className="text-muted-foreground">
                        <span className="font-medium">Recebido por:</span> {entry.paymentReceivedBy.name}
                      </p>
                    )}
                  </div>
                </div>
                <div className="flex gap-2 flex-wrap sm:flex-nowrap">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleViewDetails(entry)}
                    className="flex-1 sm:flex-none"
                  >
                    <Eye className="h-4 w-4 mr-1" />
                    Detalhes
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      setEntryToEdit(entry);
                      setIsEditModalOpen(true);
                    }}
                    className="flex-1 sm:flex-none"
                  >
                    <Edit2 className="h-4 w-4 mr-1" />
                    Editar
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
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


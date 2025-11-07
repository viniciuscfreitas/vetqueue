import { useEffect, useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { queueApi, PaymentStatus, QueueEntry } from "@/lib/api";
import type { FinancialFiltersState } from "./FinancialFilters";
import { Pagination } from "./Pagination";
import { Button } from "./ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "./ui/select";
import { Input } from "./ui/input";
import { Textarea } from "./ui/textarea";
import { Skeleton } from "./ui/skeleton";
import { createErrorHandler } from "@/lib/errors";
import { useToast } from "./ui/use-toast";
import { useAuth } from "@/contexts/AuthContext";

interface FinancialPaymentsTabProps {
  filters: FinancialFiltersState;
  receptionists: Array<{ id: string; name: string }>;
}

interface EditingRowState {
  paymentMethod: string | null;
  paymentStatus: PaymentStatus;
  paymentAmount: string;
  paymentReceivedAt: string | null;
  paymentNotes: string;
  paymentReceivedById: string | null;
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

const paymentStatusOptions = [
  PaymentStatus.PENDING,
  PaymentStatus.PARTIAL,
  PaymentStatus.PAID,
  PaymentStatus.CANCELLED,
] as const;

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

function toDateTimeLocal(value?: string | null) {
  if (!value) return "";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  const hours = String(date.getHours()).padStart(2, "0");
  const minutes = String(date.getMinutes()).padStart(2, "0");
  return `${year}-${month}-${day}T${hours}:${minutes}`;
}

function fromDateTimeLocal(value: string | null | undefined) {
  if (!value) return null;
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return null;
  }
  return date.toISOString();
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
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const handleError = createErrorHandler(toast);

  const [page, setPage] = useState(1);
  const [editingRows, setEditingRows] = useState<Record<string, EditingRowState>>({});

  useEffect(() => {
    setPage(1);
    setEditingRows({});
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

  const beginEdit = (entry: QueueEntry) => {
    setEditingRows((prev) => ({
      ...prev,
      [entry.id]: {
        paymentMethod: entry.paymentMethod ?? null,
        paymentStatus: entry.paymentStatus ?? PaymentStatus.PENDING,
        paymentAmount: entry.paymentAmount ?? "",
        paymentReceivedAt: toDateTimeLocal(entry.paymentReceivedAt),
        paymentNotes: entry.paymentNotes ?? "",
        paymentReceivedById: entry.paymentReceivedById ?? null,
      },
    }));
  };

  const cancelEdit = (entryId: string) => {
    setEditingRows((prev) => {
      const clone = { ...prev };
      delete clone[entryId];
      return clone;
    });
  };

  const handleFieldChange = <K extends keyof EditingRowState>(
    entryId: string,
    field: K,
    value: EditingRowState[K]
  ) => {
    setEditingRows((prev) => ({
      ...prev,
      [entryId]: {
        ...prev[entryId],
        [field]: value,
      },
    }));
  };

  const handleSave = (entryId: string) => {
    const formState = editingRows[entryId];
    if (!formState) return;

    const payload = {
      paymentMethod: formState.paymentMethod,
      paymentStatus: formState.paymentStatus,
      paymentAmount: formState.paymentAmount ? formState.paymentAmount : null,
      paymentReceivedAt: fromDateTimeLocal(formState.paymentReceivedAt),
      paymentNotes: formState.paymentNotes.trim() ? formState.paymentNotes : null,
      paymentReceivedById:
        formState.paymentStatus === PaymentStatus.PAID || formState.paymentStatus === PaymentStatus.PARTIAL
          ? formState.paymentReceivedById ?? user?.id ?? null
          : formState.paymentReceivedById ?? null,
    };

    updatePaymentMutation.mutate({ id: entryId, payload });
    cancelEdit(entryId);
  };

  const renderTableBody = () => {
    if (isLoading) {
      return (
        <tr>
          <td colSpan={10}>
            <div className="space-y-2 py-6">
              <Skeleton className="h-8 w-full" />
              <Skeleton className="h-8 w-full" />
              <Skeleton className="h-8 w-full" />
            </div>
          </td>
        </tr>
      );
    }

    if (entries.length === 0) {
      return (
        <tr>
          <td colSpan={10} className="py-6 text-center text-sm text-muted-foreground">
            Nenhum atendimento encontrado com os filtros selecionados.
          </td>
        </tr>
      );
    }

    return entries.map((entry) => {
      const isEditing = !!editingRows[entry.id];
      const rowState = editingRows[entry.id];

      return (
        <tr key={entry.id} className="border-b">
          <td className="px-4 py-3 text-sm font-medium">{entry.patientName}</td>
          <td className="px-4 py-3 text-sm">{entry.tutorName}</td>
          <td className="px-4 py-3 text-sm">{entry.serviceType}</td>
          <td className="px-4 py-3 text-sm font-semibold">
            {isEditing ? (
              <Input
                type="number"
                step="0.01"
                value={rowState?.paymentAmount ?? ""}
                onChange={(event) => handleFieldChange(entry.id, "paymentAmount", event.target.value)}
              />
            ) : (
              formatCurrency(entry.paymentAmount)
            )}
          </td>
          <td className="px-4 py-3 text-sm">
            {isEditing ? (
              <Select
                value={rowState?.paymentMethod ?? "__NONE__"}
                onValueChange={(value) =>
                  handleFieldChange(entry.id, "paymentMethod", value === "__NONE__" ? null : value)
                }
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
            ) : (
              paymentMethodLabels[entry.paymentMethod ?? ""] ?? "Não informado"
            )}
          </td>
          <td className="px-4 py-3 text-sm">
            {isEditing ? (
              <Select
                value={rowState?.paymentStatus ?? PaymentStatus.PENDING}
                onValueChange={(value) =>
                  handleFieldChange(entry.id, "paymentStatus", value as PaymentStatus)
                }
              >
                <SelectTrigger className="w-[140px]">
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
              paymentStatusLabels[entry.paymentStatus ?? PaymentStatus.PENDING]
            )}
          </td>
          <td className="px-4 py-3 text-sm">
            {isEditing ? (
              <Select
                value={rowState?.paymentReceivedById ?? user?.id ?? "__NONE__"}
                onValueChange={(value) =>
                  handleFieldChange(entry.id, "paymentReceivedById", value === "__NONE__" ? null : value)
                }
              >
                <SelectTrigger className="w-[160px]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="__NONE__">Não informado</SelectItem>
                  {receptionists.map((recep) => (
                    <SelectItem key={recep.id} value={recep.id}>
                      {recep.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            ) : (
              entry.paymentReceivedBy?.name ?? "—"
            )}
          </td>
          <td className="px-4 py-3 text-sm whitespace-nowrap">
            {new Date(entry.createdAt).toLocaleString("pt-BR")}
          </td>
          <td className="px-4 py-3 text-sm whitespace-nowrap">
            {entry.completedAt ? new Date(entry.completedAt).toLocaleString("pt-BR") : "—"}
          </td>
          <td className="px-4 py-3 text-sm whitespace-nowrap">
            {isEditing ? (
              <Input
                type="datetime-local"
                value={rowState?.paymentReceivedAt ?? ""}
                onChange={(event) =>
                  handleFieldChange(entry.id, "paymentReceivedAt", event.target.value)
                }
              />
            ) : entry.paymentReceivedAt ? (
              new Date(entry.paymentReceivedAt).toLocaleString("pt-BR")
            ) : (
              "—"
            )}
          </td>
          <td className="px-4 py-3 text-sm">
            {isEditing ? (
              <Textarea
                value={rowState?.paymentNotes ?? ""}
                onChange={(event) => handleFieldChange(entry.id, "paymentNotes", event.target.value)}
                rows={2}
              />
            ) : (
              entry.paymentNotes || "—"
            )}
          </td>
          <td className="px-4 py-3 text-sm">
            {isEditing ? (
              <div className="flex gap-2">
                <Button
                  size="sm"
                  onClick={() => handleSave(entry.id)}
                  disabled={updatePaymentMutation.isPending}
                >
                  Salvar
                </Button>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => cancelEdit(entry.id)}
                  disabled={updatePaymentMutation.isPending}
                >
                  Cancelar
                </Button>
              </div>
            ) : (
              <Button variant="ghost" size="sm" onClick={() => beginEdit(entry)}>
                Editar
              </Button>
            )}
          </td>
        </tr>
      );
    });
  };

  return (
    <div className="space-y-4">
      <div className="border rounded-lg overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-muted">
              <tr className="text-left">
                <th className="px-4 py-3 font-semibold">Paciente</th>
                <th className="px-4 py-3 font-semibold">Tutor</th>
                <th className="px-4 py-3 font-semibold">Serviço</th>
                <th className="px-4 py-3 font-semibold">Valor</th>
                <th className="px-4 py-3 font-semibold">Forma</th>
                <th className="px-4 py-3 font-semibold">Status</th>
                <th className="px-4 py-3 font-semibold">Recebido por</th>
                <th className="px-4 py-3 font-semibold">Entrada</th>
                <th className="px-4 py-3 font-semibold">Saída</th>
                <th className="px-4 py-3 font-semibold">Pagamento em</th>
                <th className="px-4 py-3 font-semibold">Observações</th>
                <th className="px-4 py-3 font-semibold">Ações</th>
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
  );
}


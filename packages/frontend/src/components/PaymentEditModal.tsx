import { useAuth } from "@/contexts/AuthContext";
import { PaymentStatus, QueueEntry } from "@/lib/api";
import { fromDateTimeLocal, paymentStatusLabels, toDateTimeLocal } from "@/lib/financialUtils";
import { useEffect, useState } from "react";
import { Badge } from "./ui/badge";
import { Button } from "./ui/button";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "./ui/dialog";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "./ui/select";
import { Spinner } from "./ui/spinner";
import { Textarea } from "./ui/textarea";

interface PaymentEditModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  entry: QueueEntry | null;
  receptionists: Array<{ id: string; name: string }>;
  onSave: (id: string, payload: {
    paymentMethod?: string | null;
    paymentStatus?: PaymentStatus;
    paymentAmount?: string | null;
    paymentReceivedAt?: string | null;
    paymentNotes?: string | null;
    paymentReceivedById?: string | null;
  }) => void;
  isLoading?: boolean;
}

const NONE_VALUE = "__none";

const statusBadgeVariant: Record<PaymentStatus, "default" | "secondary" | "destructive" | "outline"> = {
  [PaymentStatus.PENDING]: "outline",
  [PaymentStatus.PARTIAL]: "secondary",
  [PaymentStatus.PAID]: "default",
  [PaymentStatus.CANCELLED]: "destructive",
};

function toDisplayAmount(value?: string | null) {
  if (!value) return "";
  const numberValue = Number(value);
  if (Number.isNaN(numberValue)) {
    return value;
  }
  return numberValue.toLocaleString("pt-BR", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}

function normalizeAmountInput(value: string) {
  return value.replace(/\./g, "").replace(",", ".");
}

function validateAmount(value: string) {
  if (!value) return "";
  const numericValue = Number(normalizeAmountInput(value));
  if (Number.isNaN(numericValue) || numericValue < 0) {
    return "Informe um valor válido";
  }
  return "";
}

function validateDateTime(value: string) {
  if (!value) return "";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return "Informe uma data válida";
  }
  return "";
}

const paymentMethodOptions = [
  { value: NONE_VALUE, label: "Não informado" },
  { value: "CREDIT", label: "Crédito" },
  { value: "CREDIT_INSTALLMENTS", label: "Crédito parcelado" },
  { value: "DEBIT", label: "Débito" },
  { value: "CASH", label: "Dinheiro" },
  { value: "PIX", label: "PIX" },
  { value: "TRANSFER", label: "Transferência" },
  { value: "MULTIPLE", label: "Múltiplos métodos" },
];

const paymentStatusOptions = [
  PaymentStatus.PENDING,
  PaymentStatus.PARTIAL,
  PaymentStatus.PAID,
  PaymentStatus.CANCELLED,
] as const;

export function PaymentEditModal({
  open,
  onOpenChange,
  entry,
  receptionists,
  onSave,
  isLoading = false,
}: PaymentEditModalProps) {
  const { user } = useAuth();
  const currentUserId = user?.id ?? null;
  const [formData, setFormData] = useState({
    paymentMethod: NONE_VALUE,
    paymentStatus: PaymentStatus.PENDING,
    paymentAmount: "",
    paymentReceivedAt: "",
    paymentNotes: "",
    paymentReceivedById: NONE_VALUE,
  });
  const [errors, setErrors] = useState({
    paymentAmount: "",
    paymentReceivedAt: "",
  });

  useEffect(() => {
    if (entry) {
      const defaultReceivedById = entry.paymentReceivedById ?? currentUserId ?? NONE_VALUE;
      setFormData({
        paymentMethod: entry.paymentMethod ?? NONE_VALUE,
        paymentStatus: entry.paymentStatus ?? PaymentStatus.PENDING,
        paymentAmount: toDisplayAmount(entry.paymentAmount),
        paymentReceivedAt: toDateTimeLocal(entry.paymentReceivedAt),
        paymentNotes: entry.paymentNotes ?? "",
        paymentReceivedById: defaultReceivedById,
      });
      setErrors({ paymentAmount: "", paymentReceivedAt: "" });
    }
  }, [entry, open, currentUserId]);

  if (!entry) return null;

  const statusLabel = paymentStatusLabels[formData.paymentStatus];
  const hasErrors = Boolean(errors.paymentAmount || errors.paymentReceivedAt);

  const handleAmountChange = (value: string) => {
    const cleaned = value.replace(/[^0-9.,]/g, "");
    setFormData((prev) => ({ ...prev, paymentAmount: cleaned }));
    setErrors((prev) => ({ ...prev, paymentAmount: validateAmount(cleaned) }));
  };

  const handleAmountBlur = () => {
    if (!formData.paymentAmount) return;
    const error = validateAmount(formData.paymentAmount);
    if (error) return;
    const numericValue = Number(normalizeAmountInput(formData.paymentAmount));
    if (!Number.isNaN(numericValue)) {
      setFormData((prev) => ({
        ...prev,
        paymentAmount: numericValue.toLocaleString("pt-BR", {
          minimumFractionDigits: 2,
          maximumFractionDigits: 2,
        }),
      }));
    }
  };

  const handleDateChange = (value: string) => {
    setFormData((prev) => ({ ...prev, paymentReceivedAt: value }));
    setErrors((prev) => ({ ...prev, paymentReceivedAt: validateDateTime(value) }));
  };

  const handleSave = () => {
    const amountError = validateAmount(formData.paymentAmount);
    const dateError = validateDateTime(formData.paymentReceivedAt);

    if (amountError || dateError) {
      setErrors({
        paymentAmount: amountError,
        paymentReceivedAt: dateError,
      });
      return;
    }

    const normalizedAmount = formData.paymentAmount
      ? Number(normalizeAmountInput(formData.paymentAmount))
      : null;

    const payload = {
      paymentMethod: formData.paymentMethod === NONE_VALUE ? null : formData.paymentMethod,
      paymentStatus: formData.paymentStatus,
      paymentAmount:
        normalizedAmount === null || Number.isNaN(normalizedAmount)
          ? null
          : normalizedAmount.toFixed(2),
      paymentReceivedAt: fromDateTimeLocal(formData.paymentReceivedAt),
      paymentNotes: formData.paymentNotes.trim() || null,
      paymentReceivedById: formData.paymentReceivedById === NONE_VALUE ? null : formData.paymentReceivedById,
    };
    onSave(entry.id, payload);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex flex-col gap-2">
            <span>Editar Pagamento</span>
            <span className="text-sm font-normal text-muted-foreground">
              Atualize as informações financeiras mantendo consistência nos relatórios.
            </span>
          </DialogTitle>
          <DialogDescription asChild>
            <div className="flex flex-wrap items-center gap-2 text-sm text-muted-foreground">
              <Badge variant={statusBadgeVariant[formData.paymentStatus]} aria-label={`Status atual: ${statusLabel}`}>
                {statusLabel}
              </Badge>
              <span className="truncate">Paciente: {entry.patientName}</span>
              <span className="truncate">Tutor: {entry.tutorName}</span>
            </div>
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 mt-4" role="form" aria-labelledby="payment-form-heading">
          <h2 id="payment-form-heading" className="sr-only">
            Formulário de edição de pagamento
          </h2>
          <section className="rounded-lg border border-border p-4" aria-labelledby="payment-overview">
            <div className="flex items-center justify-between gap-2">
              <h3 id="payment-overview" className="text-sm font-medium text-foreground">
                Dados principais
              </h3>
              {entry.paymentAmount && (
                <span className="text-sm text-muted-foreground">
                  Registrado: {entry.paymentAmount ? toDisplayAmount(entry.paymentAmount) : "—"}
                </span>
              )}
            </div>

            <div className="mt-4 grid grid-cols-1 gap-4 md:grid-cols-2">
              <div>
                <Label htmlFor="edit-patient">Paciente</Label>
                <Input id="edit-patient" value={entry.patientName} disabled className="bg-muted" />
              </div>
              <div>
                <Label htmlFor="edit-amount">Valor</Label>
                <Input
                  id="edit-amount"
                  inputMode="decimal"
                  autoComplete="off"
                  value={formData.paymentAmount}
                  aria-invalid={errors.paymentAmount ? "true" : "false"}
                  aria-describedby={errors.paymentAmount ? "edit-amount-error" : undefined}
                  onChange={(e) => handleAmountChange(e.target.value)}
                  onBlur={handleAmountBlur}
                  placeholder="0,00"
                />
                {errors.paymentAmount && (
                  <p id="edit-amount-error" className="mt-1 text-xs text-destructive" role="alert">
                    {errors.paymentAmount}
                  </p>
                )}
                <p className="mt-1 text-xs text-muted-foreground">Use vírgula para centavos. Ex.: 120,50</p>
              </div>
              <div>
                <Label htmlFor="edit-method">Forma de Pagamento</Label>
                <Select
                  value={formData.paymentMethod}
                  onValueChange={(value) =>
                    setFormData((prev) => ({ ...prev, paymentMethod: value }))
                  }
                >
                  <SelectTrigger id="edit-method">
                    <SelectValue placeholder="Selecione..." />
                  </SelectTrigger>
                  <SelectContent>
                    {paymentMethodOptions.map((option) => (
                      <SelectItem key={option.value} value={option.value}>
                        {option.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="edit-status">Status</Label>
                <Select
                  value={formData.paymentStatus}
                  onValueChange={(value) =>
                    setFormData((prev) => ({ ...prev, paymentStatus: value as PaymentStatus }))
                  }
                >
                  <SelectTrigger id="edit-status">
                    <SelectValue placeholder="Selecione..." />
                  </SelectTrigger>
                  <SelectContent>
                    {paymentStatusOptions.map((status) => (
                      <SelectItem key={status} value={status}>
                        {paymentStatusLabels[status]}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <p className="mt-1 text-xs text-muted-foreground">
                  Ajuste o status conforme o valor recebido.
                </p>
              </div>
            </div>
          </section>

          <section className="rounded-lg border border-border p-4" aria-labelledby="payment-receipt">
            <h3 id="payment-receipt" className="text-sm font-medium text-foreground">
              Recebimento
            </h3>
            <div className="mt-4 grid grid-cols-1 gap-4 md:grid-cols-2">
              <div>
                <Label htmlFor="edit-received-by">Recebido por</Label>
                <Select
                  value={formData.paymentReceivedById}
                  onValueChange={(value) =>
                    setFormData((prev) => ({ ...prev, paymentReceivedById: value }))
                  }
                >
                  <SelectTrigger id="edit-received-by">
                    <SelectValue placeholder="Selecione..." />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value={NONE_VALUE}>Não informado</SelectItem>
                    {receptionists.map((recep) => (
                      <SelectItem key={recep.id} value={recep.id}>
                        {recep.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="edit-received-at">Data de Recebimento</Label>
                <Input
                  id="edit-received-at"
                  type="datetime-local"
                  value={formData.paymentReceivedAt}
                  aria-invalid={errors.paymentReceivedAt ? "true" : "false"}
                  aria-describedby={errors.paymentReceivedAt ? "edit-received-at-error" : undefined}
                  onChange={(e) => handleDateChange(e.target.value)}
                />
                {errors.paymentReceivedAt && (
                  <p id="edit-received-at-error" className="mt-1 text-xs text-destructive" role="alert">
                    {errors.paymentReceivedAt}
                  </p>
                )}
              </div>
            </div>
          </section>

          <section className="rounded-lg border border-border p-4" aria-labelledby="payment-notes">
            <h3 id="payment-notes" className="text-sm font-medium text-foreground">
              Observações
            </h3>
            <Label htmlFor="edit-notes" className="sr-only">
              Observações
            </Label>
            <Textarea
              id="edit-notes"
              value={formData.paymentNotes}
              onChange={(e) =>
                setFormData((prev) => ({ ...prev, paymentNotes: e.target.value }))
              }
              rows={4}
              placeholder="Inclua detalhes relevantes para o financeiro"
            />
            <p className="mt-1 text-xs text-muted-foreground">
              Essas notas auxiliam o time financeiro a entender exceções e acordos pontuais.
            </p>
          </section>
        </div>

        <DialogFooter className="flex flex-col gap-2 sm:flex-row">
          <Button
            type="button"
            variant="outline"
            onClick={() => onOpenChange(false)}
            className="w-full sm:w-auto"
          >
            Cancelar
          </Button>
          <Button
            type="button"
            onClick={handleSave}
            disabled={isLoading || hasErrors}
            className="w-full sm:w-auto"
            aria-disabled={isLoading || hasErrors}
          >
            {isLoading ? (
              <span className="flex items-center gap-2">
                <Spinner size="sm" className="h-4 w-4" />
                Salvando...
              </span>
            ) : (
              "Salvar"
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}


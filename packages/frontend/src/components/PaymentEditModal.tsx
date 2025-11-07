import { useState, useEffect } from "react";
import { QueueEntry, PaymentStatus } from "@/lib/api";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "./ui/dialog";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import { Textarea } from "./ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "./ui/select";
import { StatusBadge } from "./StatusBadge";

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

const paymentMethodOptions = [
  { value: "", label: "Não informado" },
  { value: "CREDIT", label: "Crédito" },
  { value: "DEBIT", label: "Débito" },
  { value: "CASH", label: "Dinheiro" },
  { value: "PIX", label: "PIX" },
];

const paymentStatusOptions = [
  PaymentStatus.PENDING,
  PaymentStatus.PARTIAL,
  PaymentStatus.PAID,
  PaymentStatus.CANCELLED,
] as const;

const paymentStatusLabels: Record<PaymentStatus, string> = {
  [PaymentStatus.PENDING]: "Pendente",
  [PaymentStatus.PARTIAL]: "Parcial",
  [PaymentStatus.PAID]: "Pago",
  [PaymentStatus.CANCELLED]: "Cancelado",
};

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

export function PaymentEditModal({
  open,
  onOpenChange,
  entry,
  receptionists,
  onSave,
  isLoading = false,
}: PaymentEditModalProps) {
  const [formData, setFormData] = useState({
    paymentMethod: "",
    paymentStatus: PaymentStatus.PENDING,
    paymentAmount: "",
    paymentReceivedAt: "",
    paymentNotes: "",
    paymentReceivedById: "",
  });

  useEffect(() => {
    if (entry) {
      setFormData({
        paymentMethod: entry.paymentMethod ?? "",
        paymentStatus: entry.paymentStatus ?? PaymentStatus.PENDING,
        paymentAmount: entry.paymentAmount ?? "",
        paymentReceivedAt: toDateTimeLocal(entry.paymentReceivedAt),
        paymentNotes: entry.paymentNotes ?? "",
        paymentReceivedById: entry.paymentReceivedById ?? "",
      });
    }
  }, [entry, open]);

  if (!entry) return null;

  const handleSave = () => {
    const payload = {
      paymentMethod: formData.paymentMethod || null,
      paymentStatus: formData.paymentStatus,
      paymentAmount: formData.paymentAmount || null,
      paymentReceivedAt: fromDateTimeLocal(formData.paymentReceivedAt),
      paymentNotes: formData.paymentNotes.trim() || null,
      paymentReceivedById: formData.paymentReceivedById || null,
    };
    onSave(entry.id, payload);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Editar Pagamento</DialogTitle>
        </DialogHeader>

        <div className="space-y-4 mt-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="edit-patient">Paciente</Label>
              <Input id="edit-patient" value={entry.patientName} disabled />
            </div>
            <div>
              <Label htmlFor="edit-amount">Valor</Label>
              <Input
                id="edit-amount"
                type="number"
                step="0.01"
                value={formData.paymentAmount}
                onChange={(e) =>
                  setFormData({ ...formData, paymentAmount: e.target.value })
                }
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="edit-method">Forma de Pagamento</Label>
              <Select
                value={formData.paymentMethod}
                onValueChange={(value) =>
                  setFormData({ ...formData, paymentMethod: value })
                }
              >
                <SelectTrigger id="edit-method">
                  <SelectValue />
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
                  setFormData({ ...formData, paymentStatus: value as PaymentStatus })
                }
              >
                <SelectTrigger id="edit-status">
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
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="edit-received-by">Recebido por</Label>
              <Select
                value={formData.paymentReceivedById}
                onValueChange={(value) =>
                  setFormData({ ...formData, paymentReceivedById: value })
                }
              >
                <SelectTrigger id="edit-received-by">
                  <SelectValue placeholder="Selecione..." />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">Não informado</SelectItem>
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
                onChange={(e) =>
                  setFormData({ ...formData, paymentReceivedAt: e.target.value })
                }
              />
            </div>
          </div>

          <div>
            <Label htmlFor="edit-notes">Observações</Label>
            <Textarea
              id="edit-notes"
              value={formData.paymentNotes}
              onChange={(e) =>
                setFormData({ ...formData, paymentNotes: e.target.value })
              }
              rows={3}
            />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancelar
          </Button>
          <Button onClick={handleSave} disabled={isLoading}>
            {isLoading ? "Salvando..." : "Salvar"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}


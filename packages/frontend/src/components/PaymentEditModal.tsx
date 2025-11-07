import { PaymentStatus, QueueEntry } from "@/lib/api";
import { fromDateTimeLocal, paymentStatusLabels, toDateTimeLocal } from "@/lib/financialUtils";
import { useEffect, useState } from "react";
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

const paymentMethodOptions = [
  { value: NONE_VALUE, label: "Não informado" },
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

export function PaymentEditModal({
  open,
  onOpenChange,
  entry,
  receptionists,
  onSave,
  isLoading = false,
}: PaymentEditModalProps) {
  const [formData, setFormData] = useState({
    paymentMethod: NONE_VALUE,
    paymentStatus: PaymentStatus.PENDING,
    paymentAmount: "",
    paymentReceivedAt: "",
    paymentNotes: "",
    paymentReceivedById: NONE_VALUE,
  });

  useEffect(() => {
    if (entry) {
      setFormData({
        paymentMethod: entry.paymentMethod ?? NONE_VALUE,
        paymentStatus: entry.paymentStatus ?? PaymentStatus.PENDING,
        paymentAmount: entry.paymentAmount ?? "",
        paymentReceivedAt: toDateTimeLocal(entry.paymentReceivedAt),
        paymentNotes: entry.paymentNotes ?? "",
        paymentReceivedById: entry.paymentReceivedById ?? NONE_VALUE,
      });
    }
  }, [entry, open]);

  if (!entry) return null;

  const handleSave = () => {
    const payload = {
      paymentMethod: formData.paymentMethod === NONE_VALUE ? null : formData.paymentMethod,
      paymentStatus: formData.paymentStatus,
      paymentAmount: formData.paymentAmount || null,
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
          <DialogTitle>Editar Pagamento</DialogTitle>
          <DialogDescription>
            Atualize as informações financeiras do atendimento para manter relatórios consistentes.
          </DialogDescription>
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
                  setFormData({ ...formData, paymentStatus: value as PaymentStatus })
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


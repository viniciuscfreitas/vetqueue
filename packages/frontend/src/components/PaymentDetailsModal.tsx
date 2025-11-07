import { QueueEntry, PaymentStatus } from "@/lib/api";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "./ui/dialog";
import { StatusBadge } from "./StatusBadge";

interface PaymentDetailsModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  entry: QueueEntry | null;
}

const paymentMethodLabels: Record<string, string> = {
  CREDIT: "Crédito",
  DEBIT: "Débito",
  CASH: "Dinheiro",
  PIX: "PIX",
  "": "Não informado",
  NÃO_INFORMADO: "Não informado",
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

function formatDate(value?: string | null) {
  if (!value) return "—";
  return new Date(value).toLocaleString("pt-BR");
}

export function PaymentDetailsModal({
  open,
  onOpenChange,
  entry,
}: PaymentDetailsModalProps) {
  if (!entry) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Detalhes do Pagamento</DialogTitle>
        </DialogHeader>

        <div className="space-y-4 mt-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-sm font-medium text-muted-foreground mb-1">
                Paciente
              </p>
              <p className="text-sm font-semibold">{entry.patientName}</p>
            </div>
            <div>
              <p className="text-sm font-medium text-muted-foreground mb-1">
                Tutor
              </p>
              <p className="text-sm">{entry.tutorName}</p>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-sm font-medium text-muted-foreground mb-1">
                Serviço
              </p>
              <p className="text-sm">{entry.serviceType}</p>
            </div>
            <div>
              <p className="text-sm font-medium text-muted-foreground mb-1">
                Valor
              </p>
              <p className="text-sm font-semibold">
                {formatCurrency(entry.paymentAmount)}
              </p>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-sm font-medium text-muted-foreground mb-1">
                Forma de Pagamento
              </p>
              <p className="text-sm">
                {paymentMethodLabels[entry.paymentMethod ?? ""] ??
                  "Não informado"}
              </p>
            </div>
            <div>
              <p className="text-sm font-medium text-muted-foreground mb-1">
                Status
              </p>
              <StatusBadge
                status={entry.paymentStatus ?? PaymentStatus.PENDING}
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-sm font-medium text-muted-foreground mb-1">
                Recebido por
              </p>
              <p className="text-sm">
                {entry.paymentReceivedBy?.name ?? "—"}
              </p>
            </div>
            <div>
              <p className="text-sm font-medium text-muted-foreground mb-1">
                Data de Recebimento
              </p>
              <p className="text-sm">{formatDate(entry.paymentReceivedAt)}</p>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-sm font-medium text-muted-foreground mb-1">
                Data de Entrada
              </p>
              <p className="text-sm">{formatDate(entry.createdAt)}</p>
            </div>
            <div>
              <p className="text-sm font-medium text-muted-foreground mb-1">
                Data de Saída
              </p>
              <p className="text-sm">{formatDate(entry.completedAt)}</p>
            </div>
          </div>

          {entry.paymentNotes && (
            <div>
              <p className="text-sm font-medium text-muted-foreground mb-1">
                Observações
              </p>
              <p className="text-sm bg-muted p-3 rounded-md">
                {entry.paymentNotes}
              </p>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}


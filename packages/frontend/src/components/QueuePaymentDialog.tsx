"use client";

import { useAuth } from "@/contexts/AuthContext";
import { PaymentHistoryEntry, QueueEntry } from "@/lib/api";
import { formatCurrency, toDateTimeLocal, fromDateTimeLocal } from "@/lib/financialUtils";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "./ui/dialog";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import { Textarea } from "./ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "./ui/select";
import { Badge } from "./ui/badge";
import { useEffect, useMemo, useState } from "react";

interface QueuePaymentDialogProps {
  entry: QueueEntry | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (payload: {
    amount: string;
    paymentMethod: string;
    paymentTotal?: string | null;
    installments?: number | null;
    paymentReceivedAt?: string | null;
    paymentNotes?: string | null;
    paymentReceivedById?: string | null;
  }) => void;
  isSubmitting?: boolean;
  receivers?: Array<{ id: string; name: string }>;
}

const paymentMethodOptions = [
  { value: "CASH", label: "Dinheiro" },
  { value: "PIX", label: "PIX" },
  { value: "DEBIT", label: "Débito" },
  { value: "CREDIT", label: "Crédito" },
  { value: "CREDIT_INSTALLMENTS", label: "Crédito parcelado" },
  { value: "TRANSFER", label: "Transferência" },
] as const;

const paymentMethodLabels = paymentMethodOptions.reduce<Record<string, string>>((acc, option) => {
  acc[option.value] = option.label;
  return acc;
}, { MULTIPLE: "Múltiplos métodos" });

const NONE_VALUE = "__none";

function normalizeAmountInput(value: string) {
  return value.replace(/\./g, "").replace(",", ".");
}

function toDisplayAmount(value: string) {
  const numeric = Number(value);
  if (Number.isNaN(numeric)) {
    return value;
  }
  return numeric.toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

function historyTotal(history: PaymentHistoryEntry[] = []) {
  return history.reduce((acc, record) => acc + Number(record.amount ?? 0), 0);
}

export function QueuePaymentDialog({
  entry,
  open,
  onOpenChange,
  onSubmit,
  isSubmitting = false,
  receivers = [],
}: QueuePaymentDialogProps) {
  const { user } = useAuth();

  const [amount, setAmount] = useState("");
  const [method, setMethod] = useState<string>("CASH");
  const [installments, setInstallments] = useState<string>("");
  const [receivedById, setReceivedById] = useState<string>(NONE_VALUE);
  const [receivedAt, setReceivedAt] = useState<string>("");
  const [notes, setNotes] = useState<string>("");
  const [amountError, setAmountError] = useState<string>("");
  const [total, setTotal] = useState<string>("");
  const [totalError, setTotalError] = useState<string>("");

  useEffect(() => {
    if (entry && open) {
      setAmount("");
      setMethod(entry.paymentMethod && paymentMethodLabels[entry.paymentMethod] ? entry.paymentMethod : "CASH");
      setInstallments("");
      setReceivedById(entry.paymentReceivedById ?? user?.id ?? NONE_VALUE);
      setReceivedAt(toDateTimeLocal(new Date().toISOString()));
      setNotes("");
      setAmountError("");
      setTotal(
        entry.paymentAmount
          ? toDisplayAmount(entry.paymentAmount)
          : "",
      );
      setTotalError("");
    }
  }, [entry, open, user?.id]);

  const paymentHistory = entry?.paymentHistory ?? [];
  const totalReceived = useMemo(() => historyTotal(paymentHistory), [paymentHistory]);

  const defaultReceiverOptions = useMemo(() => {
    const options: Array<{ id: string; name: string }> = [];
    const unique = new Map<string, string>();

    receivers.forEach((receiver) => {
      if (!unique.has(receiver.id)) {
        unique.set(receiver.id, receiver.name);
        options.push(receiver);
      }
    });

    if (user && !unique.has(user.id)) {
      options.unshift({ id: user.id, name: user.name });
    }

    return options;
  }, [receivers, user]);

  const handleSubmit = () => {
    const normalized = Number(normalizeAmountInput(amount));
    if (!amount || Number.isNaN(normalized) || normalized <= 0) {
      setAmountError("Informe um valor maior que zero");
      return;
    }
    setAmountError("");

    let normalizedTotal: number | null = null;
    if (total) {
      normalizedTotal = Number(normalizeAmountInput(total));
      if (Number.isNaN(normalizedTotal) || normalizedTotal < 0) {
        setTotalError("Valor total inválido");
        return;
      }
    }
    setTotalError("");

    const payload = {
      amount: normalized.toFixed(2),
      paymentMethod: method,
      installments: method === "CREDIT_INSTALLMENTS" && installments ? Number(installments) || null : null,
      paymentReceivedAt: fromDateTimeLocal(receivedAt),
      paymentNotes: notes.trim() || null,
      paymentReceivedById: receivedById === NONE_VALUE ? null : receivedById,
      paymentTotal: normalizedTotal != null ? normalizedTotal.toFixed(2) : undefined,
    };

    onSubmit(payload);
  };

  const historyContent =
    paymentHistory.length === 0 ? (
      <p className="text-xs text-muted-foreground">Nenhum pagamento registrado.</p>
    ) : (
      <div className="space-y-2">
        {paymentHistory
          .slice()
          .reverse()
          .map((record) => (
            <div key={record.id} className="rounded-lg border border-border/60 p-3">
              <div className="flex items-center justify-between gap-2">
                <span className="text-sm font-semibold text-foreground">
                  {formatCurrency(record.amount)}
                </span>
                <Badge variant="outline">{paymentMethodLabels[record.method] ?? record.method}</Badge>
              </div>
              <div className="mt-1 flex flex-wrap gap-4 text-xs text-muted-foreground">
                <span>
                  Recebido em{" "}
                  {record.receivedAt
                    ? new Date(record.receivedAt).toLocaleString("pt-BR", {
                        day: "2-digit",
                        month: "2-digit",
                        hour: "2-digit",
                        minute: "2-digit",
                      })
                    : "—"}
                </span>
                {record.installments ? <span>{record.installments}x</span> : null}
                {record.notes ? <span className="max-w-xs break-words">Obs: {record.notes}</span> : null}
              </div>
            </div>
          ))}
      </div>
    );

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-xl">
        <DialogHeader>
          <DialogTitle>Registrar pagamento</DialogTitle>
          <DialogDescription>
            Lance valores recebidos para manter o financeiro sincronizado.
          </DialogDescription>
        </DialogHeader>

        {entry ? (
          <div className="space-y-6">
            <section className="rounded-lg border border-border p-4">
              <div className="flex flex-col gap-2">
                <p className="text-sm font-semibold text-foreground">{entry.patientName}</p>
                <p className="text-xs text-muted-foreground">Tutor: {entry.tutorName}</p>
                <div className="grid gap-2 md:grid-cols-2">
                  <div className="flex flex-col gap-1">
                    <Label htmlFor="queue-payment-total" className="text-xs uppercase text-muted-foreground">
                      Valor total do atendimento
                    </Label>
                    <Input
                      id="queue-payment-total"
                      inputMode="decimal"
                      autoComplete="off"
                      placeholder="0,00"
                      value={total}
                      onChange={(e) => {
                        const cleaned = e.target.value.replace(/[^0-9.,]/g, "");
                        setTotal(cleaned);
                      }}
                      onBlur={() => {
                        if (!total) return;
                        const normalizedTotalValue = Number(normalizeAmountInput(total));
                        if (!Number.isNaN(normalizedTotalValue)) {
                          setTotal(toDisplayAmount(normalizedTotalValue.toFixed(2)));
                          setTotalError("");
                        }
                      }}
                      aria-invalid={Boolean(totalError)}
                      aria-describedby={totalError ? "queue-payment-total-error" : undefined}
                    />
                    {totalError ? (
                      <p id="queue-payment-total-error" className="text-xs text-destructive">
                        {totalError}
                      </p>
                    ) : null}
                  </div>
                  <div className="flex flex-col gap-1">
                    <span className="text-xs uppercase text-muted-foreground">Recebido</span>
                    <span className="text-base font-semibold text-foreground">
                      {formatCurrency(totalReceived.toFixed(2))}
                    </span>
                  </div>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-xs text-muted-foreground">Total registrado (contábil)</span>
                  <span className="font-medium text-muted-foreground">
                    {formatCurrency(entry.paymentAmount ?? "0")}
                  </span>
                </div>
              </div>
            </section>

            <section className="space-y-3">
              <Label>Histórico</Label>
              <div className="max-h-48 overflow-y-auto rounded-lg border border-border/60 p-3">
                {historyContent}
              </div>
            </section>

            <section className="space-y-4">
              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                <div>
                  <Label htmlFor="queue-payment-amount">Valor</Label>
                  <Input
                    id="queue-payment-amount"
                    inputMode="decimal"
                    autoComplete="off"
                    placeholder="0,00"
                    value={amount}
                    onChange={(e) => {
                      const cleaned = e.target.value.replace(/[^0-9.,]/g, "");
                      setAmount(cleaned);
                    }}
                    onBlur={() => {
                      if (!amount) return;
                      const normalized = Number(normalizeAmountInput(amount));
                      if (!Number.isNaN(normalized)) {
                        setAmount(toDisplayAmount(normalized.toFixed(2)));
                        setAmountError("");
                      }
                    }}
                    aria-invalid={Boolean(amountError)}
                    aria-describedby={amountError ? "queue-payment-amount-error" : undefined}
                  />
                  {amountError ? (
                    <p id="queue-payment-amount-error" className="mt-1 text-xs text-destructive">
                      {amountError}
                    </p>
                  ) : null}
                </div>
                <div>
                  <Label htmlFor="queue-payment-method">Forma de pagamento</Label>
                  <Select value={method} onValueChange={setMethod}>
                    <SelectTrigger id="queue-payment-method">
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
              </div>

              {method === "CREDIT_INSTALLMENTS" ? (
                <div>
                  <Label htmlFor="queue-payment-installments">Parcelas</Label>
                  <Input
                    id="queue-payment-installments"
                    inputMode="numeric"
                    placeholder="Ex.: 3"
                    value={installments}
                    onChange={(e) => setInstallments(e.target.value.replace(/[^0-9]/g, ""))}
                  />
                </div>
              ) : null}

              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                <div>
                  <Label htmlFor="queue-payment-received-at">Recebido em</Label>
                  <Input
                    id="queue-payment-received-at"
                    type="datetime-local"
                    value={receivedAt}
                    onChange={(e) => setReceivedAt(e.target.value)}
                  />
                </div>
                <div>
                  <Label htmlFor="queue-payment-received-by">Responsável</Label>
                  <Select value={receivedById} onValueChange={setReceivedById}>
                    <SelectTrigger id="queue-payment-received-by">
                      <SelectValue placeholder="Selecione..." />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value={NONE_VALUE}>Não informado</SelectItem>
                      {defaultReceiverOptions.map((receiver) => (
                        <SelectItem key={receiver.id} value={receiver.id}>
                          {receiver.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div>
                <Label htmlFor="queue-payment-notes">Observações</Label>
                <Textarea
                  id="queue-payment-notes"
                  rows={3}
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Detalhes do pagamento, troco, parcelamento..."
                />
              </div>
            </section>
          </div>
        ) : null}

        <DialogFooter className="mt-6 flex-col gap-2 sm:flex-row">
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
            onClick={handleSubmit}
            className="w-full sm:w-auto"
            disabled={isSubmitting}
          >
            {isSubmitting ? "Salvando..." : "Registrar"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}


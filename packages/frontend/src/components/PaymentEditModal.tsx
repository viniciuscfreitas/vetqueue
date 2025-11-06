"use client";

import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "./ui/dialog";
import { Button } from "./ui/button";
import { Label } from "./ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "./ui/select";
import { QueueEntry, queueApi, Role } from "@/lib/api";
import { useToast } from "@/components/ui/use-toast";
import { createErrorHandler } from "@/lib/errors";
import { useAuth } from "@/contexts/AuthContext";

interface PaymentEditModalProps {
  entry: QueueEntry;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess?: () => void;
}

export function PaymentEditModal({
  entry,
  open,
  onOpenChange,
  onSuccess,
}: PaymentEditModalProps) {
  const { user } = useAuth();
  const { toast } = useToast();
  const handleError = createErrorHandler(toast);
  const [loading, setLoading] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState<string | null>(entry.paymentMethod || null);

  useEffect(() => {
    if (open && entry) {
      setPaymentMethod(entry.paymentMethod || null);
    }
  }, [open, entry]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      await queueApi.updatePayment(entry.id, paymentMethod);

      toast({
        title: "Sucesso",
        description: "Forma de pagamento atualizada com sucesso",
      });
      onSuccess?.();
      onOpenChange(false);
    } catch (error) {
      handleError(error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Editar Forma de Pagamento</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-5">
          <div className="space-y-2">
            <Label htmlFor="paymentMethod" className="text-sm font-medium">
              Forma de Pagamento
            </Label>
            <Select
              value={paymentMethod || ""}
              onValueChange={(value) => setPaymentMethod(value || null)}
            >
              <SelectTrigger>
                <SelectValue placeholder="Selecione a forma de pagamento" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">Não informado</SelectItem>
                <SelectItem value="CREDIT">Crédito</SelectItem>
                <SelectItem value="DEBIT">Débito</SelectItem>
                <SelectItem value="CASH">Dinheiro</SelectItem>
                <SelectItem value="PIX">PIX</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={loading}
            >
              Cancelar
            </Button>
            <Button type="submit" disabled={loading} size="lg">
              {loading ? "Salvando..." : "Salvar"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}


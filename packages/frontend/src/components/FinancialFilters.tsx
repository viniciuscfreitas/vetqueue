import { useMemo } from "react";
import { Card, CardContent } from "./ui/card";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "./ui/select";
import { Button } from "./ui/button";
import { Role, PaymentStatus } from "@/lib/api";

export interface FinancialFiltersState {
  startDate: string;
  endDate: string;
  tutorName: string;
  patientName: string;
  serviceType: string;
  paymentMethod: string;
  paymentStatus: PaymentStatus | "ALL";
  paymentReceivedById: string | "ALL";
  minAmount: string;
  maxAmount: string;
}

interface FinancialFiltersProps {
  filters: FinancialFiltersState;
  onChange: (values: Partial<FinancialFiltersState>) => void;
  onReset: () => void;
  receptionists?: Array<{ id: string; name: string; role: Role }>;
}

const paymentMethodOptions = [
  { value: "ALL", label: "Todas" },
  { value: "CREDIT", label: "Crédito" },
  { value: "DEBIT", label: "Débito" },
  { value: "CASH", label: "Dinheiro" },
  { value: "PIX", label: "PIX" },
];

const paymentStatusOptions: Array<{ value: PaymentStatus | "ALL"; label: string }> = [
  { value: "ALL", label: "Todos" },
  { value: PaymentStatus.PENDING, label: "Pendente" },
  { value: PaymentStatus.PARTIAL, label: "Parcial" },
  { value: PaymentStatus.PAID, label: "Pago" },
  { value: PaymentStatus.CANCELLED, label: "Cancelado" },
];

export function FinancialFilters({
  filters,
  onChange,
  onReset,
  receptionists = [],
}: FinancialFiltersProps) {
  const receptionistOptions = useMemo(() => {
    const base = [{ value: "ALL", label: "Todos" }];
    const recepOnly = receptionists
      .filter((user) => user.role === Role.RECEPCAO)
      .map((user) => ({ value: user.id, label: user.name }));
    return [...base, ...recepOnly];
  }, [receptionists]);

  return (
    <Card>
      <CardContent className="space-y-4 pt-4">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          <div className="space-y-1.5">
            <Label htmlFor="financial-start">Inicial</Label>
            <Input
              id="financial-start"
              type="date"
              value={filters.startDate}
              onChange={(event) => onChange({ startDate: event.target.value })}
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="financial-end">Final</Label>
            <Input
              id="financial-end"
              type="date"
              value={filters.endDate}
              onChange={(event) => onChange({ endDate: event.target.value })}
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="financial-service">Serviço</Label>
            <Input
              id="financial-service"
              placeholder="Tipo de serviço..."
              value={filters.serviceType}
              onChange={(event) => onChange({ serviceType: event.target.value })}
            />
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
          <div className="space-y-1.5">
            <Label htmlFor="financial-tutor">Tutor</Label>
            <Input
              id="financial-tutor"
              placeholder="Nome do tutor..."
              value={filters.tutorName}
              onChange={(event) => onChange({ tutorName: event.target.value })}
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="financial-patient">Paciente</Label>
            <Input
              id="financial-patient"
              placeholder="Nome do paciente..."
              value={filters.patientName}
              onChange={(event) => onChange({ patientName: event.target.value })}
            />
          </div>
          <div className="space-y-1.5">
            <Label>Forma de pagamento</Label>
            <Select
              value={filters.paymentMethod}
              onValueChange={(value) => onChange({ paymentMethod: value })}
            >
              <SelectTrigger>
                <SelectValue placeholder="Todas" />
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
          <div className="space-y-1.5">
            <Label>Status</Label>
            <Select
              value={filters.paymentStatus}
              onValueChange={(value) =>
                onChange({ paymentStatus: value as PaymentStatus | "ALL" })
              }
            >
              <SelectTrigger>
                <SelectValue placeholder="Todos" />
              </SelectTrigger>
              <SelectContent>
                {paymentStatusOptions.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
          <div className="space-y-1.5">
            <Label>Recebido por</Label>
            <Select
              value={filters.paymentReceivedById}
              onValueChange={(value) => onChange({ paymentReceivedById: value as string | "ALL" })}
            >
              <SelectTrigger>
                <SelectValue placeholder="Todos" />
              </SelectTrigger>
              <SelectContent>
                {receptionistOptions.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="financial-min-amount">Valor mínimo</Label>
            <Input
              id="financial-min-amount"
              type="number"
              step="0.01"
              placeholder="0,00"
              value={filters.minAmount}
              onChange={(event) => onChange({ minAmount: event.target.value })}
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="financial-max-amount">Valor máximo</Label>
            <Input
              id="financial-max-amount"
              type="number"
              step="0.01"
              placeholder="0,00"
              value={filters.maxAmount}
              onChange={(event) => onChange({ maxAmount: event.target.value })}
            />
          </div>
          <div className="flex items-end">
            <Button variant="outline" onClick={onReset}>
              Limpar filtros
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}


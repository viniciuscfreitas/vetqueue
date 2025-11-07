import { useState } from "react";
import { Card, CardContent } from "./ui/card";
import { Input } from "./ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "./ui/select";
import { Button } from "./ui/button";
import { Role, PaymentStatus } from "@/lib/api";
import { ChevronDown, ChevronUp } from "lucide-react";

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
  const [isExpanded, setIsExpanded] = useState(false);
  
  const receptionistOptions = [
    { value: "ALL", label: "Todos" },
    ...receptionists
      .filter((user) => user.role === Role.RECEPCAO)
      .map((user) => ({ value: user.id, label: user.name }))
  ];

  const hasActiveFilters =
    filters.tutorName ||
    filters.patientName ||
    filters.serviceType ||
    filters.paymentMethod !== "ALL" ||
    filters.paymentStatus !== "ALL" ||
    filters.paymentReceivedById !== "ALL" ||
    filters.minAmount ||
    filters.maxAmount;

  return (
    <Card>
      <CardContent className="p-4">
        <div className="flex flex-wrap items-end gap-3">
          <div className="flex items-center gap-2">
            <Input
              type="date"
              value={filters.startDate}
              onChange={(event) => onChange({ startDate: event.target.value })}
              className="h-9 w-[140px]"
            />
            <span className="text-sm text-muted-foreground whitespace-nowrap">até</span>
            <Input
              type="date"
              value={filters.endDate}
              onChange={(event) => onChange({ endDate: event.target.value })}
              className="h-9 w-[140px]"
            />
          </div>
          <Select
            value={filters.paymentStatus}
            onValueChange={(value) =>
              onChange({ paymentStatus: value as PaymentStatus | "ALL" })
            }
          >
            <SelectTrigger className="h-9 w-[130px]">
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              {paymentStatusOptions.map((option) => (
                <SelectItem key={option.value} value={option.value}>
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select
            value={filters.paymentMethod}
            onValueChange={(value) => onChange({ paymentMethod: value })}
          >
            <SelectTrigger className="h-9 w-[150px]">
              <SelectValue placeholder="Forma pagamento" />
            </SelectTrigger>
            <SelectContent>
              {paymentMethodOptions.map((option) => (
                <SelectItem key={option.value} value={option.value}>
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          {hasActiveFilters && (
            <Button variant="outline" size="sm" onClick={onReset} className="h-9">
              Limpar
            </Button>
          )}
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setIsExpanded(!isExpanded)}
            className="h-9"
          >
            {isExpanded ? (
              <ChevronUp className="h-4 w-4" />
            ) : (
              <ChevronDown className="h-4 w-4" />
            )}
          </Button>
        </div>

        {isExpanded && (
          <div className="flex flex-wrap items-end gap-3 mt-3 pt-3 border-t">
            <Input
              placeholder="Tutor..."
              value={filters.tutorName}
              onChange={(event) => onChange({ tutorName: event.target.value })}
              className="h-9 w-[150px]"
            />
            <Input
              placeholder="Paciente..."
              value={filters.patientName}
              onChange={(event) => onChange({ patientName: event.target.value })}
              className="h-9 w-[150px]"
            />
            <Input
              placeholder="Serviço..."
              value={filters.serviceType}
              onChange={(event) => onChange({ serviceType: event.target.value })}
              className="h-9 w-[150px]"
            />
            <Select
              value={filters.paymentReceivedById}
              onValueChange={(value) =>
                onChange({ paymentReceivedById: value as string | "ALL" })
              }
            >
              <SelectTrigger className="h-9 w-[150px]">
                <SelectValue placeholder="Recebido por" />
              </SelectTrigger>
              <SelectContent>
                {receptionistOptions.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Input
              type="number"
              step="0.01"
              placeholder="Valor mín..."
              value={filters.minAmount}
              onChange={(event) => onChange({ minAmount: event.target.value })}
              className="h-9 w-[120px]"
            />
            <Input
              type="number"
              step="0.01"
              placeholder="Valor máx..."
              value={filters.maxAmount}
              onChange={(event) => onChange({ maxAmount: event.target.value })}
              className="h-9 w-[120px]"
            />
          </div>
        )}
      </CardContent>
    </Card>
  );
}


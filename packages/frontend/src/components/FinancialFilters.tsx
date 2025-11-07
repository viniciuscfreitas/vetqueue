import { useMemo, useState } from "react";
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
import { ChevronDown, ChevronUp, Filter } from "lucide-react";

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
  
  const receptionistOptions = useMemo(() => {
    const base = [{ value: "ALL", label: "Todos" }];
    const recepOnly = receptionists
      .filter((user) => user.role === Role.RECEPCAO)
      .map((user) => ({ value: user.id, label: user.name }));
    return [...base, ...recepOnly];
  }, [receptionists]);

  const hasActiveFilters = useMemo(() => {
    return (
      filters.tutorName ||
      filters.patientName ||
      filters.serviceType ||
      filters.paymentMethod !== "ALL" ||
      filters.paymentStatus !== "ALL" ||
      filters.paymentReceivedById !== "ALL" ||
      filters.minAmount ||
      filters.maxAmount
    );
  }, [filters]);

  return (
    <Card className="border">
      <CardContent className="p-3">
        <div className="space-y-3">
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-2 flex-1 min-w-0">
              <Filter className="h-4 w-4 text-muted-foreground shrink-0" />
              <div className="flex items-center gap-2 flex-wrap flex-1">
                <div className="flex items-center gap-2">
                  <Input
                    type="date"
                    value={filters.startDate}
                    onChange={(event) => onChange({ startDate: event.target.value })}
                    className="h-8 w-[140px] text-xs"
                  />
                  <span className="text-xs text-muted-foreground">até</span>
                  <Input
                    type="date"
                    value={filters.endDate}
                    onChange={(event) => onChange({ endDate: event.target.value })}
                    className="h-8 w-[140px] text-xs"
                  />
                </div>
                <Select
                  value={filters.paymentStatus}
                  onValueChange={(value) =>
                    onChange({ paymentStatus: value as PaymentStatus | "ALL" })
                  }
                >
                  <SelectTrigger className="h-8 w-[130px] text-xs">
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
                  <SelectTrigger className="h-8 w-[130px] text-xs">
                    <SelectValue placeholder="Forma" />
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
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={onReset}
                    className="h-8 text-xs"
                  >
                    Limpar
                  </Button>
                )}
              </div>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setIsExpanded(!isExpanded)}
              className="h-8 w-8 p-0 shrink-0"
            >
              {isExpanded ? (
                <ChevronUp className="h-4 w-4" />
              ) : (
                <ChevronDown className="h-4 w-4" />
              )}
            </Button>
          </div>

          {isExpanded && (
            <div className="pt-2 border-t space-y-2">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                <div className="space-y-1">
                  <Label htmlFor="financial-tutor" className="text-xs">
                    Tutor
                  </Label>
                  <Input
                    id="financial-tutor"
                    placeholder="Nome..."
                    value={filters.tutorName}
                    onChange={(event) => onChange({ tutorName: event.target.value })}
                    className="h-8 text-xs"
                  />
                </div>
                <div className="space-y-1">
                  <Label htmlFor="financial-patient" className="text-xs">
                    Paciente
                  </Label>
                  <Input
                    id="financial-patient"
                    placeholder="Nome..."
                    value={filters.patientName}
                    onChange={(event) => onChange({ patientName: event.target.value })}
                    className="h-8 text-xs"
                  />
                </div>
                <div className="space-y-1">
                  <Label htmlFor="financial-service" className="text-xs">
                    Serviço
                  </Label>
                  <Input
                    id="financial-service"
                    placeholder="Tipo..."
                    value={filters.serviceType}
                    onChange={(event) => onChange({ serviceType: event.target.value })}
                    className="h-8 text-xs"
                  />
                </div>
                <div className="space-y-1">
                  <Label className="text-xs">Recebido por</Label>
                  <Select
                    value={filters.paymentReceivedById}
                    onValueChange={(value) =>
                      onChange({ paymentReceivedById: value as string | "ALL" })
                    }
                  >
                    <SelectTrigger className="h-8 text-xs">
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
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div className="space-y-1">
                  <Label htmlFor="financial-min-amount" className="text-xs">
                    Valor mínimo
                  </Label>
                  <Input
                    id="financial-min-amount"
                    type="number"
                    step="0.01"
                    placeholder="0,00"
                    value={filters.minAmount}
                    onChange={(event) => onChange({ minAmount: event.target.value })}
                    className="h-8 text-xs"
                  />
                </div>
                <div className="space-y-1">
                  <Label htmlFor="financial-max-amount" className="text-xs">
                    Valor máximo
                  </Label>
                  <Input
                    id="financial-max-amount"
                    type="number"
                    step="0.01"
                    placeholder="0,00"
                    value={filters.maxAmount}
                    onChange={(event) => onChange({ maxAmount: event.target.value })}
                    className="h-8 text-xs"
                  />
                </div>
              </div>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}


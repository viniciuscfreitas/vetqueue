import { useState } from "react";
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
    <Card className="mb-6">
      <CardContent className="pt-6">
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div>
              <Label htmlFor="financial-start">Data inicial</Label>
              <Input
                id="financial-start"
                type="date"
                value={filters.startDate}
                onChange={(event) => onChange({ startDate: event.target.value })}
              />
            </div>
            <div>
              <Label htmlFor="financial-end">Data final</Label>
              <Input
                id="financial-end"
                type="date"
                value={filters.endDate}
                onChange={(event) => onChange({ endDate: event.target.value })}
              />
            </div>
            <div>
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
            <div>
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
          </div>

          {isExpanded && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 pt-4 border-t">
              <div>
                <Label htmlFor="financial-tutor">Tutor</Label>
                <Input
                  id="financial-tutor"
                  placeholder="Nome do tutor..."
                  value={filters.tutorName}
                  onChange={(event) => onChange({ tutorName: event.target.value })}
                />
              </div>
              <div>
                <Label htmlFor="financial-patient">Paciente</Label>
                <Input
                  id="financial-patient"
                  placeholder="Nome do paciente..."
                  value={filters.patientName}
                  onChange={(event) => onChange({ patientName: event.target.value })}
                />
              </div>
              <div>
                <Label htmlFor="financial-service">Serviço</Label>
                <Input
                  id="financial-service"
                  placeholder="Tipo de serviço..."
                  value={filters.serviceType}
                  onChange={(event) => onChange({ serviceType: event.target.value })}
                />
              </div>
              <div>
                <Label>Recebido por</Label>
                <Select
                  value={filters.paymentReceivedById}
                  onValueChange={(value) =>
                    onChange({ paymentReceivedById: value as string | "ALL" })
                  }
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
              <div>
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
              <div>
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
            </div>
          )}

          <div className="flex items-center justify-between pt-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setIsExpanded(!isExpanded)}
            >
              {isExpanded ? (
                <>
                  <ChevronUp className="h-4 w-4 mr-1" />
                  Menos filtros
                </>
              ) : (
                <>
                  <ChevronDown className="h-4 w-4 mr-1" />
                  Mais filtros
                </>
              )}
            </Button>
            {hasActiveFilters && (
              <Button variant="outline" size="sm" onClick={onReset}>
                Limpar filtros
              </Button>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}


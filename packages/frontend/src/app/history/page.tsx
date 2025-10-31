"use client";

import { useQuery } from "@tanstack/react-query";
import { queueApi, ServiceType } from "@/lib/api";
import { QueueList } from "@/components/QueueList";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useState, useEffect } from "react";
import { useToast } from "@/components/ui/use-toast";
import { createErrorHandler } from "@/lib/errors";

export default function HistoryPage() {
  const { toast } = useToast();
  const handleError = createErrorHandler(toast);

  const [startDate, setStartDate] = useState(() => {
    const date = new Date();
    date.setDate(date.getDate() - 30);
    return date.toISOString().split("T")[0];
  });

  const [endDate, setEndDate] = useState(() => {
    return new Date().toISOString().split("T")[0];
  });

  const [filters, setFilters] = useState({
    tutorName: "",
    serviceType: undefined as ServiceType | undefined,
  });

  const { data: entries = [], isLoading, isError, error } = useQuery({
    queryKey: ["queue", "history", startDate, endDate, filters],
    queryFn: () =>
      queueApi
        .getHistory({
          startDate,
          endDate,
          tutorName: filters.tutorName || undefined,
          serviceType: filters.serviceType || undefined,
        })
        .then((res) => res.data),
  });

  useEffect(() => {
    if (isError && error) {
      handleError(error);
    }
  }, [isError, error, handleError]);

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <h1 className="text-2xl font-bold">VetQueue</h1>
            <Link href="/">
              <Button variant="outline">Voltar</Button>
            </Link>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        <h2 className="text-3xl font-bold mb-6">Histórico de Atendimentos</h2>

        <div className="mb-6 flex gap-4 items-end flex-wrap">
          <div className="max-w-xs">
            <Label htmlFor="startDate" className="text-sm font-medium mb-2 block">
              Data Inicial
            </Label>
            <Input
              id="startDate"
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
            />
          </div>
          <div className="max-w-xs">
            <Label htmlFor="endDate" className="text-sm font-medium mb-2 block">
              Data Final
            </Label>
            <Input
              id="endDate"
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
            />
          </div>
          <div className="max-w-xs">
            <Label htmlFor="tutorName" className="text-sm font-medium mb-2 block">
              Tutor
            </Label>
            <Input
              id="tutorName"
              placeholder="Filtrar por tutor..."
              value={filters.tutorName}
              onChange={(e) =>
                setFilters({ ...filters, tutorName: e.target.value })
              }
            />
          </div>
          <div className="max-w-xs">
            <Label htmlFor="serviceType" className="text-sm font-medium mb-2 block">
              Tipo de Serviço
            </Label>
            <Select
              value={filters.serviceType}
              onValueChange={(value) =>
                setFilters({ 
                  ...filters, 
                  serviceType: value as ServiceType
                })
              }
            >
              <SelectTrigger>
                <SelectValue placeholder="Todos" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value={ServiceType.CONSULTA}>Consulta</SelectItem>
                <SelectItem value={ServiceType.VACINACAO}>Vacinação</SelectItem>
                <SelectItem value={ServiceType.CIRURGIA}>Cirurgia</SelectItem>
                <SelectItem value={ServiceType.EXAME}>Exame</SelectItem>
                <SelectItem value={ServiceType.BANHO_TOSA}>Banho e Tosa</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        {isLoading ? (
          <div className="text-center py-12">Carregando...</div>
        ) : (
          <QueueList entries={entries} emptyMessage="Nenhum atendimento concluído" />
        )}
      </main>
    </div>
  );
}

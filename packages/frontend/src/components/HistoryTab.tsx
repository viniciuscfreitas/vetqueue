"use client";

import { useQuery } from "@tanstack/react-query";
import { queueApi, serviceApi } from "@/lib/api";
import { QueueList } from "@/components/QueueList";
import { Pagination } from "@/components/Pagination";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { useDateRange } from "@/hooks/useDateRange";
import { useState, useEffect } from "react";
import { Service } from "@/lib/api";

interface HistoryTabProps {
  authLoading: boolean;
}

export function HistoryTab({ authLoading }: HistoryTabProps) {
  const { startDate, endDate, setStartDate, setEndDate } = useDateRange();
  const [filters, setFilters] = useState({
    tutorName: "",
    patientName: "",
    serviceType: "__ALL__",
  });
  const [page, setPage] = useState(1);

  const { data: historyData, isLoading: isLoadingHistory } = useQuery({
    queryKey: ["queue", "history", startDate, endDate, filters, page],
    queryFn: () =>
      queueApi
        .getHistory({
          startDate,
          endDate,
          tutorName: filters.tutorName || undefined,
          patientName: filters.patientName || undefined,
          serviceType: filters.serviceType === "__ALL__" ? undefined : filters.serviceType,
          page,
          limit: 20,
        })
        .then((res) => res.data),
    enabled: !authLoading,
  });

  const { data: services = [] } = useQuery<Service[]>({
    queryKey: ["services"],
    queryFn: () => serviceApi.list().then((res) => res.data),
  });

  const historyEntries = Array.isArray(historyData) ? historyData : (historyData?.entries || []);
  const historyPaginated = Array.isArray(historyData) ? null : historyData;

  useEffect(() => {
    setPage(1);
  }, [startDate, endDate, filters]);

  const hasActiveFilters = filters.tutorName || filters.patientName || (filters.serviceType && filters.serviceType !== "__ALL__");

  return (
    <div className="space-y-6">
      <div className="space-y-4">
        <div>
          <h2 className="text-xl font-semibold">Histórico de Atendimentos</h2>
          <p className="text-sm text-muted-foreground mt-1">
            Consulte atendimentos concluídos e filtrados
          </p>
        </div>

        <Card>
          <CardContent className="pt-4">
            <div className="flex flex-wrap gap-3 items-end">
              <div className="min-w-0">
                <Label htmlFor="historyStartDate" className="text-xs mb-1 block text-muted-foreground">
                  Inicial
                </Label>
                <Input
                  id="historyStartDate"
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                />
              </div>
              <div className="min-w-0">
                <Label htmlFor="historyEndDate" className="text-xs mb-1 block text-muted-foreground">
                  Final
                </Label>
                <Input
                  id="historyEndDate"
                  type="date"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                />
              </div>
              <div className="min-w-0">
                <Label htmlFor="historyServiceType" className="text-xs mb-1 block text-muted-foreground">
                  Serviço
                </Label>
                <Select
                  value={filters.serviceType}
                  onValueChange={(value) =>
                    setFilters({
                      ...filters,
                      serviceType: value,
                    })
                  }
                >
                  <SelectTrigger className="w-[140px]">
                    <SelectValue placeholder="Todos" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="__ALL__">Todos</SelectItem>
                    {services.map((service) => (
                      <SelectItem key={service.id} value={service.name}>
                        {service.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="min-w-0 flex-1 min-w-[180px]">
                <Label htmlFor="historyPatientName" className="text-xs mb-1 block text-muted-foreground">
                  Pet
                </Label>
                <Input
                  id="historyPatientName"
                  placeholder="Nome do pet..."
                  value={filters.patientName}
                  onChange={(e) =>
                    setFilters({ ...filters, patientName: e.target.value })
                  }
                  className="w-full"
                />
              </div>
              <div className="min-w-0 flex-1 min-w-[180px]">
                <Label htmlFor="historyTutorName" className="text-xs mb-1 block text-muted-foreground">
                  Tutor
                </Label>
                <Input
                  id="historyTutorName"
                  placeholder="Nome do tutor..."
                  value={filters.tutorName}
                  onChange={(e) =>
                    setFilters({ ...filters, tutorName: e.target.value })
                  }
                  className="w-full"
                />
              </div>
              {hasActiveFilters && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() =>
                    setFilters({ tutorName: "", patientName: "", serviceType: "__ALL__" })
                  }
                  className="h-10"
                >
                  Limpar
                </Button>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {isLoadingHistory ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[1, 2, 3].map((i) => (
            <Card key={i}>
              <CardHeader>
                <Skeleton className="h-6 w-32" />
              </CardHeader>
              <CardContent className="space-y-2">
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-3/4" />
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <>
          <div className="space-y-4">
            {historyEntries.length > 0 && (
              <p className="text-sm text-muted-foreground">
                {historyPaginated ? `${historyPaginated.total} atendimentos encontrados` : `${historyEntries.length} atendimentos encontrados`}
              </p>
            )}
            <QueueList
              entries={historyEntries}
              emptyMessage={
                hasActiveFilters
                  ? "Nenhum atendimento encontrado com os filtros aplicados"
                  : "Nenhum atendimento concluído no período selecionado"
              }
            />
          </div>
          {historyPaginated && (
            <Pagination
              currentPage={historyPaginated.page}
              totalPages={historyPaginated.totalPages}
              total={historyPaginated.total}
              onPageChange={setPage}
            />
          )}
        </>
      )}
    </div>
  );
}


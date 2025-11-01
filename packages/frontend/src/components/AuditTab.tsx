"use client";

import { useQuery } from "@tanstack/react-query";
import { auditApi, userApi, AuditLog, User } from "@/lib/api";
import { Pagination } from "@/components/Pagination";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
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

interface AuditTabProps {
  authLoading: boolean;
}

const actionConfig = {
  CREATE: {
    label: "Criado",
    bgColor: "rgba(37, 157, 227, 0.15)",
    borderColor: "#259DE3",
    textColor: "#259DE3",
  },
  CALL: {
    label: "Chamado",
    bgColor: "rgba(255, 193, 7, 0.15)",
    borderColor: "#FFC107",
    textColor: "#FFC107",
  },
  START: {
    label: "Iniciado",
    bgColor: "rgba(156, 39, 176, 0.15)",
    borderColor: "#9C27B0",
    textColor: "#9C27B0",
  },
  COMPLETE: {
    label: "Concluído",
    bgColor: "rgba(22, 195, 94, 0.15)",
    borderColor: "#16C35E",
    textColor: "#16C35E",
  },
  CANCEL: {
    label: "Cancelado",
    bgColor: "rgba(239, 68, 68, 0.15)",
    borderColor: "#EF4444",
    textColor: "#EF4444",
  },
  COMPLETE_WITHOUT_VET: {
    label: "Concluído Sem Vet",
    bgColor: "rgba(22, 195, 94, 0.15)",
    borderColor: "#16C35E",
    textColor: "#16C35E",
  },
};

function formatDateTime(timestamp: string): string {
  const date = new Date(timestamp);
  return date.toLocaleString("pt-BR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function AuditTab({ authLoading }: AuditTabProps) {
  const { startDate, endDate, setStartDate, setEndDate } = useDateRange();
  const [filters, setFilters] = useState({
    userId: "__ALL__",
    action: "__ALL__",
    entityType: "__ALL__",
  });
  const [page, setPage] = useState(1);

  const { data: auditData, isLoading: isLoadingAudit } = useQuery({
    queryKey: ["audit", "logs", startDate, endDate, filters, page],
    queryFn: () =>
      auditApi
        .getLogs({
          startDate,
          endDate,
          userId: filters.userId === "__ALL__" ? undefined : filters.userId,
          action: filters.action === "__ALL__" ? undefined : filters.action,
          entityType: filters.entityType === "__ALL__" ? undefined : filters.entityType,
          page,
          limit: 20,
        })
        .then((res) => res.data),
    enabled: !authLoading,
  });

  const { data: users = [] } = useQuery<User[]>({
    queryKey: ["users"],
    queryFn: () => userApi.list().then((res) => res.data),
    enabled: !authLoading,
  });

  const auditEntries = auditData?.entries || [];
  const auditPaginated = auditData;

  useEffect(() => {
    setPage(1);
  }, [startDate, endDate, filters]);

  const hasActiveFilters = 
    filters.userId !== "__ALL__" || 
    filters.action !== "__ALL__" || 
    filters.entityType !== "__ALL__";

  const getActionBadge = (action: string) => {
    const config = actionConfig[action as keyof typeof actionConfig] || {
      label: action,
      bgColor: "rgba(107, 114, 128, 0.15)",
      borderColor: "#6b7280",
      textColor: "#6b7280",
    };

    return (
      <Badge
        className="border flex items-center gap-1"
        variant="outline"
        style={{
          backgroundColor: config.bgColor,
          color: config.textColor,
          borderColor: config.borderColor,
        }}
      >
        {config.label}
      </Badge>
    );
  };

  return (
    <div className="space-y-6">
      <div className="space-y-4">
        <div>
          <h2 className="text-xl font-semibold">Registro de Auditoria</h2>
          <p className="text-sm text-muted-foreground mt-1">
            Visualize todas as ações realizadas no sistema
          </p>
        </div>

        <Card>
          <CardContent className="pt-4">
            <div className="flex flex-wrap gap-3 items-end">
              <div className="min-w-0">
                <Label htmlFor="auditStartDate" className="text-xs mb-1 block text-muted-foreground">
                  Inicial
                </Label>
                <Input
                  id="auditStartDate"
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  className="w-[130px]"
                />
              </div>
              <div className="min-w-0">
                <Label htmlFor="auditEndDate" className="text-xs mb-1 block text-muted-foreground">
                  Final
                </Label>
                <Input
                  id="auditEndDate"
                  type="date"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  className="w-[130px]"
                />
              </div>
              <div className="min-w-0">
                <Label htmlFor="auditUser" className="text-xs mb-1 block text-muted-foreground">
                  Usuário
                </Label>
                <Select
                  value={filters.userId}
                  onValueChange={(value) =>
                    setFilters({ ...filters, userId: value })
                  }
                >
                  <SelectTrigger className="w-[180px]">
                    <SelectValue placeholder="Todos" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="__ALL__">Todos</SelectItem>
                    {users.map((user) => (
                      <SelectItem key={user.id} value={user.id}>
                        {user.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="min-w-0">
                <Label htmlFor="auditAction" className="text-xs mb-1 block text-muted-foreground">
                  Ação
                </Label>
                <Select
                  value={filters.action}
                  onValueChange={(value) =>
                    setFilters({ ...filters, action: value })
                  }
                >
                  <SelectTrigger className="w-[150px]">
                    <SelectValue placeholder="Todas" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="__ALL__">Todas</SelectItem>
                    {Object.keys(actionConfig).map((action) => (
                      <SelectItem key={action} value={action}>
                        {actionConfig[action as keyof typeof actionConfig].label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              {hasActiveFilters && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() =>
                    setFilters({ userId: "__ALL__", action: "__ALL__", entityType: "__ALL__" })
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

      {isLoadingAudit ? (
        <div className="space-y-3">
          {[1, 2, 3, 4, 5].map((i) => (
            <Card key={i}>
              <CardContent className="pt-4">
                <div className="flex items-center justify-between">
                  <Skeleton className="h-6 w-32" />
                  <Skeleton className="h-4 w-24" />
                </div>
                <Skeleton className="h-4 w-full mt-2" />
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <>
          <div className="space-y-4">
            {auditEntries.length > 0 && auditPaginated && (
              <p className="text-sm text-muted-foreground">
                {auditPaginated.total} ações encontradas
              </p>
            )}
            {auditEntries.length === 0 ? (
              <Card>
                <CardContent className="pt-6 pb-6">
                  <p className="text-center text-muted-foreground">
                    {hasActiveFilters
                      ? "Nenhuma ação encontrada com os filtros aplicados"
                      : "Nenhuma ação registrada no período selecionado"}
                  </p>
                </CardContent>
              </Card>
            ) : (
              <div className="space-y-2">
                {auditEntries.map((entry: AuditLog) => (
                  <Card key={entry.id}>
                    <CardContent className="pt-4">
                      <div className="flex flex-col gap-2">
                        <div className="flex items-start justify-between gap-4 flex-wrap">
                          <div className="flex items-center gap-2 flex-wrap">
                            {getActionBadge(entry.action)}
                            <span className="text-sm text-muted-foreground">
                              {entry.entityType}
                            </span>
                          </div>
                          <span className="text-sm text-muted-foreground">
                            {formatDateTime(entry.timestamp)}
                          </span>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-medium">
                            {entry.user?.name || "Usuário desconhecido"}
                          </span>
                          {entry.metadata && (
                            <span className="text-sm text-muted-foreground">
                              • {entry.metadata.patientName || ""}
                            </span>
                          )}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </div>
          {auditPaginated && auditPaginated.totalPages > 1 && (
            <Pagination
              currentPage={auditPaginated.page}
              totalPages={auditPaginated.totalPages}
              total={auditPaginated.total}
              onPageChange={setPage}
            />
          )}
        </>
      )}
    </div>
  );
}

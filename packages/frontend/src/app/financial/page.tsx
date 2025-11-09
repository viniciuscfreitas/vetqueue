"use client";

import { useEffect, useMemo, useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { useRouter } from "next/navigation";
import { AppShell } from "@/components/AppShell";
import { Header } from "@/components/Header";
import type { HeaderAction } from "@/components/Header";
import { Spinner } from "@/components/ui/spinner";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { FinancialFilters, FinancialFiltersState } from "@/components/FinancialFilters";
import { FinancialOverviewTab } from "@/components/FinancialOverviewTab";
import { FinancialPaymentsTab } from "@/components/FinancialPaymentsTab";
import { FinancialReportsTab } from "@/components/FinancialReportsTab";
import { ModuleKey, Role, userApi } from "@/lib/api";
import { useDateRange } from "@/hooks/useDateRange";
import { useQuery } from "@tanstack/react-query";
import { CreditCard, FileText, Filter, LayoutDashboard, Receipt } from "lucide-react";

const DEFAULT_FILTERS = {
  tutorName: "",
  patientName: "",
  serviceType: "",
  paymentMethod: "ALL",
  paymentStatus: "ALL" as FinancialFiltersState["paymentStatus"],
  paymentReceivedById: "ALL" as FinancialFiltersState["paymentReceivedById"],
  minAmount: "",
  maxAmount: "",
};

export default function FinancialPage() {
  const router = useRouter();
  const { user, isLoading: authLoading, canAccess } = useAuth();

  useEffect(() => {
    if (!authLoading && !user) {
      router.push("/login");
      return;
    }
    if (!authLoading && user && !canAccess(ModuleKey.FINANCIAL)) {
      router.push("/");
      return;
    }
  }, [user, authLoading, router, canAccess]);

  const { startDate, endDate, setStartDate, setEndDate, reset: resetDateRange } = useDateRange();
  const [filters, setFilters] = useState(DEFAULT_FILTERS);
  const [tab, setTab] = useState<"overview" | "payments" | "reports">("overview");

  const combinedFilters: FinancialFiltersState = {
    startDate,
    endDate,
    ...filters,
  };

  const { data: receptionistsData } = useQuery({
    queryKey: ["users", "receptionists"],
    queryFn: () => userApi.list().then((res) => res.data),
  });

  const receptionists =
    receptionistsData?.filter((item) => item.role === Role.RECEPCAO).map((item) => ({
      id: item.id,
      name: item.name,
    })) ?? [];

  const handleFilterChange = (values: Partial<FinancialFiltersState>) => {
    if (values.startDate !== undefined) {
      setStartDate(values.startDate);
    }
    if (values.endDate !== undefined) {
      setEndDate(values.endDate);
    }

    const { startDate: _start, endDate: _end, ...rest } = values;
    if (Object.keys(rest).length) {
      setFilters((prev) => ({
        ...prev,
        ...rest,
      }));
    }
  };

  const handleReset = () => {
    resetDateRange();
    setFilters(DEFAULT_FILTERS);
  };

  if (authLoading || !user) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Spinner size="lg" />
      </div>
    );
  }

  if (!canAccess(ModuleKey.FINANCIAL)) {
    return null;
  }

  const activeFilterCount = useMemo(() => {
    let count = 0;
    if (startDate) count += 1;
    if (endDate) count += 1;

    Object.entries(filters).forEach(([key, value]) => {
      const defaultValue = DEFAULT_FILTERS[key as keyof typeof DEFAULT_FILTERS];
      if (typeof value === "string") {
        const trimmed = value.trim();
        if (trimmed !== (defaultValue as string)) {
          count += 1;
        }
      } else if (value !== defaultValue) {
        count += 1;
      }
    });

    return count;
  }, [filters, startDate, endDate]);

  const headerActions: HeaderAction[] = [
    {
      label: "Filtros",
      icon: <Filter className="h-4 w-4" />,
      onClick: () => setTab("overview"),
      badgeCount: activeFilterCount,
      badgeTone: activeFilterCount > 0 ? "info" : "default",
    },
    {
      label: "Ver relatórios",
      icon: <Receipt className="h-4 w-4" />,
      variant: tab === "reports" ? "outline" : undefined,
      onClick: () => setTab("reports"),
    },
  ];

  const headerHelper =
    activeFilterCount > 0
      ? {
          text: `${activeFilterCount} filtro${activeFilterCount > 1 ? "s" : ""} aplicado${
            activeFilterCount > 1 ? "s" : ""
          }`,
          actionLabel: "Limpar",
          onAction: handleReset,
          variant: "info" as const,
        }
      : undefined;

  return (
    <AppShell
      header={
        <Header
          title="Financeiro"
          subtitle="Monitore receitas e pagamentos em tempo real."
          actions={headerActions}
          helper={headerHelper}
        />
      }
    >
      <div className="space-y-6">
        <Tabs value={tab} onValueChange={(value) => setTab(value as typeof tab)} className="flex flex-col gap-6">
          <TabsList className="w-full justify-start overflow-x-auto bg-background/60 p-1">
            <TabsTrigger
              value="overview"
              className="flex items-center gap-2 whitespace-nowrap data-[state=active]:bg-primary data-[state=active]:text-primary-foreground"
            >
              <LayoutDashboard className="h-4 w-4" />
              Resumo
            </TabsTrigger>
            <TabsTrigger
              value="payments"
              className="flex items-center gap-2 whitespace-nowrap data-[state=active]:bg-primary data-[state=active]:text-primary-foreground"
            >
              <CreditCard className="h-4 w-4" />
              Pagamentos
            </TabsTrigger>
            <TabsTrigger
              value="reports"
              className="flex items-center gap-2 whitespace-nowrap data-[state=active]:bg-primary data-[state=active]:text-primary-foreground"
            >
              <FileText className="h-4 w-4" />
              Relatórios
            </TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="mt-6 space-y-6">
            <FinancialFilters
              filters={combinedFilters}
              onChange={handleFilterChange}
              onReset={handleReset}
              receptionists={receptionistsData}
            />
            <FinancialOverviewTab filters={combinedFilters} />
          </TabsContent>

          <TabsContent value="payments" className="mt-6 space-y-6">
            <FinancialFilters
              filters={combinedFilters}
              onChange={handleFilterChange}
              onReset={handleReset}
              receptionists={receptionistsData}
            />
            <FinancialPaymentsTab filters={combinedFilters} />
          </TabsContent>

          <TabsContent value="reports" className="mt-6 space-y-6">
            <FinancialFilters
              filters={combinedFilters}
              onChange={handleFilterChange}
              onReset={handleReset}
              receptionists={receptionistsData}
            />
            <FinancialReportsTab filters={combinedFilters} />
          </TabsContent>
        </Tabs>
      </div>
    </AppShell>
  );
}


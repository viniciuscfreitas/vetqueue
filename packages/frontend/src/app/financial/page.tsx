"use client";

import { useEffect, useState } from "react";
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
import { CreditCard, FileText, LayoutDashboard, Receipt } from "lucide-react";

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

  const headerActions: HeaderAction[] = [
    {
      label: "Ver relatórios",
      icon: <Receipt className="h-4 w-4" />,
      variant: tab === "reports" ? "outline" : undefined,
      onClick: () => setTab("reports"),
    },
  ];

  return (
    <AppShell
      header={
        <Header
          title="Financeiro"
          subtitle="Controle MRR, ARPU e pagamentos sem atrito entre recepção e faturamento."
          actions={headerActions}
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


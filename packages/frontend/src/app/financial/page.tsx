"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { useRouter } from "next/navigation";
import { Header } from "@/components/Header";
import { Spinner } from "@/components/ui/spinner";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { FinancialFilters, FinancialFiltersState } from "@/components/FinancialFilters";
import { FinancialOverviewTab } from "@/components/FinancialOverviewTab";
import { FinancialPaymentsTab } from "@/components/FinancialPaymentsTab";
import { FinancialReportsTab } from "@/components/FinancialReportsTab";
import { Role, userApi } from "@/lib/api";
import { useDateRange } from "@/hooks/useDateRange";
import { useQuery } from "@tanstack/react-query";

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
  const { user, isLoading: authLoading } = useAuth();

  useEffect(() => {
    if (!authLoading && !user) {
      router.push("/login");
      return;
    }
    if (!authLoading && user?.role !== Role.RECEPCAO) {
      router.push("/");
      return;
    }
  }, [user, authLoading, router]);

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

  if (user.role !== Role.RECEPCAO) {
    return null;
  }

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main className="container mx-auto px-4 py-6">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-semibold">Financeiro</h1>
        </div>

        <FinancialFilters
          filters={combinedFilters}
          onChange={handleFilterChange}
          onReset={handleReset}
          receptionists={receptionistsData}
        />

        <Tabs value={tab} onValueChange={(value) => setTab(value as typeof tab)} className="mt-6">
          <TabsList className="grid w-full grid-cols-3 md:w-[400px]">
            <TabsTrigger value="overview">Resumo</TabsTrigger>
            <TabsTrigger value="payments">Pagamentos</TabsTrigger>
            <TabsTrigger value="reports">Relatórios</TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="mt-6">
            <FinancialOverviewTab filters={combinedFilters} />
          </TabsContent>

          <TabsContent value="payments" className="mt-6">
            <FinancialPaymentsTab filters={combinedFilters} receptionists={receptionists} />
          </TabsContent>

          <TabsContent value="reports" className="mt-6">
            <FinancialReportsTab filters={combinedFilters} />
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
}


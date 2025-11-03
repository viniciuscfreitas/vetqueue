"use client";

import { useQuery } from "@tanstack/react-query";
import { queueApi, ReportStats, RoomUtilizationStats } from "@/lib/api";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { useDateRange } from "@/hooks/useDateRange";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, AreaChart, Area } from "recharts";
import { Activity, MapPin, TrendingUp, Clock, Calendar } from "lucide-react";

interface ReportsTabProps {
  authLoading: boolean;
}

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8', '#82CA9D'];

export function ReportsTab({ authLoading }: ReportsTabProps) {
  const { startDate, endDate, setStartDate, setEndDate } = useDateRange();

  const { data: stats, isLoading: isLoadingReports } = useQuery<ReportStats>({
    queryKey: ["queue", "reports", startDate, endDate],
    queryFn: () =>
      queueApi
        .getReports({
          startDate,
          endDate,
        })
        .then((res) => res.data),
    enabled: !authLoading,
    staleTime: 30000,
  });

  const { data: roomStats, isLoading: isLoadingRooms } = useQuery<RoomUtilizationStats>({
    queryKey: ["queue", "reports", "rooms", startDate, endDate],
    queryFn: () =>
      queueApi
        .getRoomUtilization({
          startDate,
          endDate,
        })
        .then((res) => res.data),
    enabled: !authLoading,
    staleTime: 30000,
  });

  const isLoading = isLoadingReports || isLoadingRooms;

  const serviceChartData = stats?.byService ? Object.entries(stats.byService).map(([name, value]) => ({
    name,
    value,
  })) : [];

  const priorityChartData = stats?.byPriority ? [
    { name: "Emergência", value: stats.byPriority.emergency, color: "#ef4444" },
    { name: "Alta", value: stats.byPriority.high, color: "#f59e0b" },
    { name: "Normal", value: stats.byPriority.normal, color: "#10b981" },
  ] : [];

  const peakHoursData = roomStats?.peakHours.map(h => ({ ...h, time: `${h.hour}h` })) || [];
  const roomUtilizationData = roomStats?.utilizationPerRoom || [];

  const topVetsChartData = stats?.topVets || [];

  return (
    <div className="space-y-6">
      <div className="space-y-4">
        <div>
          <h2 className="text-xl font-semibold">Relatórios da Fila</h2>
          <p className="text-sm text-muted-foreground mt-1">
            Estatísticas e métricas de atendimentos
          </p>
        </div>

        <Card>
          <CardContent className="pt-4">
            <div className="flex flex-wrap gap-3 items-end">
              <div className="min-w-0">
                <Label htmlFor="reportsStartDate" className="text-xs mb-1 block text-muted-foreground">
                  Inicial
                </Label>
                <Input
                  id="reportsStartDate"
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                />
              </div>
              <div className="min-w-0">
                <Label htmlFor="reportsEndDate" className="text-xs mb-1 block text-muted-foreground">
                  Final
                </Label>
                <Input
                  id="reportsEndDate"
                  type="date"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map((i) => (
            <Card key={i}>
              <CardHeader>
                <Skeleton className="h-6 w-32" />
              </CardHeader>
              <CardContent>
                <Skeleton className="h-10 w-24" />
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <>
          {stats?.total === 0 && !roomStats ? (
            <Card>
              <CardContent className="pt-6">
                <div className="text-center py-8">
                  <p className="text-muted-foreground">
                    Nenhum dado encontrado no período selecionado
                  </p>
                </div>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <Card>
                  <CardHeader className="flex flex-row items-center justify-between pb-2">
                    <CardTitle className="text-sm font-medium">Total Atendimentos</CardTitle>
                    <Activity className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">{stats?.total || 0}</div>
                    <p className="text-xs text-muted-foreground mt-1">
                      {stats?.avgPerDay ? `${stats.avgPerDay.toFixed(1)} por dia` : "Período selecionado"}
                    </p>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="flex flex-row items-center justify-between pb-2">
                    <CardTitle className="text-sm font-medium">Tempo Médio Espera</CardTitle>
                    <Clock className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">
                      {stats?.avgWaitTimeMinutes || 0}<span className="text-lg text-muted-foreground ml-1">min</span>
                    </div>
                    <p className="text-xs text-muted-foreground mt-1">
                      Média de espera
                    </p>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="flex flex-row items-center justify-between pb-2">
                    <CardTitle className="text-sm font-medium">Tempo Médio Atendimento</CardTitle>
                    <TrendingUp className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">
                      {stats?.avgServiceTimeMinutes || 0}<span className="text-lg text-muted-foreground ml-1">min</span>
                    </div>
                    <p className="text-xs text-muted-foreground mt-1">
                      Duração média
                    </p>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="flex flex-row items-center justify-between pb-2">
                    <CardTitle className="text-sm font-medium">Taxa Cancelamento</CardTitle>
                    <Calendar className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">
                      {stats?.cancellationRate != null ? stats.cancellationRate.toFixed(1) : 0}<span className="text-lg text-muted-foreground ml-1">%</span>
                    </div>
                    <p className="text-xs text-muted-foreground mt-1">
                      Cancelados no período
                    </p>
                  </CardContent>
                </Card>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <Card>
                  <CardHeader>
                    <CardTitle className="text-base">Distribuição por Tipo de Serviço</CardTitle>
                  </CardHeader>
                  <CardContent>
                    {serviceChartData.length > 0 ? (
                      <ResponsiveContainer width="100%" height={250}>
                        <BarChart data={serviceChartData}>
                          <CartesianGrid strokeDasharray="3 3" />
                          <XAxis dataKey="name" tick={{ fontSize: 12 }} />
                          <YAxis tick={{ fontSize: 12 }} />
                          <Tooltip />
                          <Bar dataKey="value" fill="#0088FE" />
                        </BarChart>
                      </ResponsiveContainer>
                    ) : (
                      <div className="h-[250px] flex items-center justify-center">
                        <p className="text-sm text-muted-foreground">Sem dados disponíveis</p>
                      </div>
                    )}
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className="text-base">Distribuição por Prioridade</CardTitle>
                  </CardHeader>
                  <CardContent>
                    {priorityChartData.some(p => p.value > 0) ? (
                      <ResponsiveContainer width="100%" height={250}>
                        <PieChart>
                          <Pie
                            data={priorityChartData}
                            cx="50%"
                            cy="50%"
                            labelLine={false}
                            label={({ name, percent }: any) => `${name}: ${(percent * 100).toFixed(0)}%`}
                            outerRadius={80}
                            fill="#8884d8"
                            dataKey="value"
                          >
                            {priorityChartData.map((entry, index) => (
                              <Cell key={`cell-${index}`} fill={entry.color} />
                            ))}
                          </Pie>
                          <Tooltip />
                        </PieChart>
                      </ResponsiveContainer>
                    ) : (
                      <div className="h-[250px] flex items-center justify-center">
                        <p className="text-sm text-muted-foreground">Sem dados disponíveis</p>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </div>

              {topVetsChartData.length > 0 && (
                <Card>
                  <CardHeader>
                    <CardTitle className="text-base">Top Veterinários</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <ResponsiveContainer width="100%" height={300}>
                      <BarChart data={topVetsChartData} layout="horizontal">
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis type="number" tick={{ fontSize: 12 }} />
                        <YAxis type="category" dataKey="name" tick={{ fontSize: 12 }} width={100} />
                        <Tooltip />
                        <Bar dataKey="count" fill="#00C49F" />
                      </BarChart>
                    </ResponsiveContainer>
                  </CardContent>
                </Card>
              )}

              {roomStats && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <Card>
                    <CardHeader className="flex flex-row items-center justify-between pb-2">
                      <CardTitle className="text-base">Horários de Pico</CardTitle>
                      <Clock className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                      {peakHoursData.length > 0 ? (
                        <ResponsiveContainer width="100%" height={250}>
                          <AreaChart data={peakHoursData}>
                            <CartesianGrid strokeDasharray="3 3" />
                            <XAxis dataKey="time" tick={{ fontSize: 12 }} />
                            <YAxis tick={{ fontSize: 12 }} />
                            <Tooltip />
                            <Area type="monotone" dataKey="count" stroke="#8884d8" fill="#8884d8" fillOpacity={0.6} />
                          </AreaChart>
                        </ResponsiveContainer>
                      ) : (
                        <div className="h-[250px] flex items-center justify-center">
                          <p className="text-sm text-muted-foreground">Sem dados disponíveis</p>
                        </div>
                      )}
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader className="flex flex-row items-center justify-between pb-2">
                      <CardTitle className="text-base">Utilização das Salas</CardTitle>
                      <MapPin className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                      {roomUtilizationData.length > 0 ? (
                        <div className="space-y-4">
                          {roomUtilizationData.map((room, index) => (
                            <div key={index} className="space-y-2">
                              <div className="flex justify-between items-center">
                                <span className="text-sm font-medium">{room.roomName}</span>
                                <span className="text-sm font-semibold">{room.utilizationRate}%</span>
                              </div>
                              <div className="w-full bg-secondary rounded-full h-2">
                                <div
                                  className="bg-primary h-2 rounded-full transition-all"
                                  style={{ width: `${Math.min(room.utilizationRate, 100)}%` }}
                                />
                              </div>
                              <div className="flex justify-between text-xs text-muted-foreground">
                                <span>{room.hoursUsed}h de uso</span>
                                <span>{room.count} atendimentos</span>
                              </div>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <div className="h-[200px] flex items-center justify-center">
                          <p className="text-sm text-muted-foreground">Sem dados disponíveis</p>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                </div>
              )}
            </div>
          )}
        </>
      )}
    </div>
  );
}

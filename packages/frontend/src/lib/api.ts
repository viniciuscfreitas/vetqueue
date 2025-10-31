import axios from "axios";

const api = axios.create({
  baseURL: "",
  timeout: 10000,
});

api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.code === "ERR_NETWORK") {
      console.error("Erro de rede:", {
        message: error.message,
        baseURL: api.defaults.baseURL,
        url: error.config?.url,
      });
    } else if (error.response) {
      console.error("Erro HTTP:", {
        status: error.response.status,
        data: error.response.data,
        url: error.config?.url,
      });
    } else {
      console.error("Erro na requisição:", error.message);
    }
    return Promise.reject(error);
  }
);

export enum Priority {
  EMERGENCY = 1,
  HIGH = 2,
  NORMAL = 3,
}

export enum Status {
  WAITING = "WAITING",
  CALLED = "CALLED",
  IN_PROGRESS = "IN_PROGRESS",
  COMPLETED = "COMPLETED",
  CANCELLED = "CANCELLED",
}

export enum ServiceType {
  CONSULTA = "CONSULTA",
  VACINACAO = "VACINACAO",
  CIRURGIA = "CIRURGIA",
  EXAME = "EXAME",
  BANHO_TOSA = "BANHO_TOSA",
}

export interface QueueEntry {
  id: string;
  patientName: string;
  tutorName: string;
  serviceType: ServiceType;
  priority: Priority;
  status: Status;
  createdAt: string;
  calledAt?: string | null;
  completedAt?: string | null;
}

export interface ReportStats {
  total: number;
  avgWaitTimeMinutes: number;
  byService: Record<string, number>;
}

export const queueApi = {
  add: (data: {
    patientName: string;
    tutorName: string;
    serviceType: ServiceType;
    priority?: Priority;
  }) => api.post<QueueEntry>("/api/queue", data),

  listActive: () => api.get<QueueEntry[]>("/api/queue/active"),

  callNext: () => api.post<QueueEntry>("/api/queue/call-next"),

  startService: (id: string) =>
    api.patch<QueueEntry>(`/api/queue/${id}/start`),

  completeService: (id: string) =>
    api.patch<QueueEntry>(`/api/queue/${id}/complete`),

  cancelEntry: (id: string) =>
    api.patch<QueueEntry>(`/api/queue/${id}/cancel`),

  getHistory: (filters?: {
    startDate?: string;
    endDate?: string;
    tutorName?: string;
    serviceType?: ServiceType;
  }) => api.get<QueueEntry[]>("/api/queue/history", { params: filters }),

  getReports: (filters?: {
    startDate?: string;
    endDate?: string;
  }) => api.get<ReportStats>("/api/queue/reports", { params: filters }),
};


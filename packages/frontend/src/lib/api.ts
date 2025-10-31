import axios from "axios";

const api = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001",
});

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
  }) => api.get("/api/queue/reports", { params: filters }),
};


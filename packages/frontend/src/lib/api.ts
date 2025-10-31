import axios from "axios";

const api = axios.create({
  baseURL: "",
  timeout: 10000,
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem("auth_token");
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

let lastLoggedError: string | null = null;
let lastLoggedTime = 0;
const LOG_THROTTLE_MS = 5000;

api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem("auth_token");
      window.location.href = "/login";
    }
    
    const errorKey = `${error.config?.url || "unknown"}-${error.response?.status || error.code}`;
    const now = Date.now();
    const shouldLog = errorKey !== lastLoggedError || now - lastLoggedTime > LOG_THROTTLE_MS;

    if (shouldLog) {
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
      lastLoggedError = errorKey;
      lastLoggedTime = now;
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

export enum Role {
  VET = "VET",
  RECEPCAO = "RECEPCAO",
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
  assignedVetId?: string | null;
  roomId?: string | null;
}

export interface User {
  id: string;
  username: string;
  name: string;
  role: Role;
  createdAt: string;
}

export interface Room {
  id: string;
  name: string;
  isActive: boolean;
  createdAt: string;
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
    assignedVetId?: string;
  }) => api.post<QueueEntry>("/api/queue", data),

  listActive: (vetId?: string | null) => 
    api.get<QueueEntry[]>("/api/queue/active", { params: vetId !== undefined ? { vetId } : {} }),

  callNext: (roomId: string, vetId?: string) => 
    api.post<QueueEntry | { message: string }>("/api/queue/call-next", { vetId, roomId }),

  startService: (id: string) =>
    api.patch<QueueEntry>(`/api/queue/${id}/start`),

  completeService: (id: string) =>
    api.patch<QueueEntry>(`/api/queue/${id}/complete`),

  cancelEntry: (id: string) =>
    api.patch<QueueEntry>(`/api/queue/${id}/cancel`),

  claimPatient: (id: string) =>
    api.post<QueueEntry>(`/api/queue/${id}/claim`),

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

export const authApi = {
  login: (username: string, password: string) =>
    api.post<{ user: User; token: string }>("/api/auth/login", { username, password }),
  
  me: () => api.get<{ user: User }>("/api/auth/me"),
};

export const roomApi = {
  list: () => api.get<Room[]>("/api/rooms"),
  
  listAll: () => api.get<Room[]>("/api/rooms/all"),
  
  create: (name: string) => api.post<Room>("/api/rooms", { name }),
  
  update: (id: string, data: { name?: string; isActive?: boolean }) =>
    api.patch<Room>(`/api/rooms/${id}`, data),
  
  delete: (id: string) => api.delete(`/api/rooms/${id}`),
};

export const userApi = {
  list: () => api.get<User[]>("/api/users"),
  
  create: (data: { username: string; password: string; name: string; role: Role }) =>
    api.post<User>("/api/users", data),
  
  update: (id: string, data: { name?: string; role?: Role; password?: string }) =>
    api.patch<User>(`/api/users/${id}`, data),
};


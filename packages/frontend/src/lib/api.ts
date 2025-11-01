import axios from "axios";

const api = axios.create({
  baseURL: "",
  timeout: 10000,
});

api.interceptors.request.use((config) => {
  if (typeof window !== "undefined") {
    const token = localStorage.getItem("auth_token");
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
  }
  return config;
});

let lastLoggedError: string | null = null;
let lastLoggedTime = 0;
const LOG_THROTTLE_MS = 5000;

api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401 && typeof window !== "undefined") {
      localStorage.removeItem("auth_token");
      if (window.location.pathname !== "/login") {
        window.location.href = "/login";
      }
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

export interface Service {
  id: string;
  name: string;
  isActive: boolean;
  createdAt: string;
}

export interface QueueEntry {
  id: string;
  patientName: string;
  tutorName: string;
  serviceType: string;
  priority: Priority;
  status: Status;
  createdAt: string;
  calledAt?: string | null;
  completedAt?: string | null;
  assignedVetId?: string | null;
  assignedVet?: User | null;
  roomId?: string | null;
  room?: Room | null;
  hasScheduledAppointment?: boolean;
  scheduledAt?: string | null;
}

export interface User {
  id: string;
  username: string;
  name: string;
  role: Role;
  createdAt: string;
  currentRoomId?: string | null;
  roomCheckedInAt?: string | null;
  lastActivityAt?: string | null;
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
  avgServiceTimeMinutes: number;
  cancellationRate: number;
  topVets: Array<{ name: string; count: number }>;
  avgPerDay: number;
  byPriority: { emergency: number; high: number; normal: number };
}

export interface PaginatedResult<T> {
  entries: T[];
  total: number;
  page: number;
  totalPages: number;
}

export interface VetStats {
  total: number;
  avgServiceTimeMinutes: number;
  attendancePerDay: number;
}

export interface ActiveVet {
  vetId: string;
  vetName: string;
  roomId: string;
  roomName: string;
}

export interface AuditLog {
  id: string;
  userId: string;
  user?: User;
  action: string;
  entityType: string;
  entityId?: string | null;
  metadata?: any;
  timestamp: string;
}

export const queueApi = {
  add: (data: {
    patientName: string;
    tutorName: string;
    serviceType: string;
    priority?: Priority;
    assignedVetId?: string;
    hasScheduledAppointment?: boolean;
    scheduledAt?: string;
  }) => api.post<QueueEntry>("/api/queue", data),

  listActive: (vetId?: string | null) => 
    api.get<QueueEntry[]>("/api/queue/active", { params: vetId !== undefined ? { vetId } : {} }),

  callNext: (roomId: string, vetId?: string) => 
    api.post<QueueEntry | { message: string }>("/api/queue/call-next", { vetId, roomId }),

  callPatient: (id: string, roomId: string, vetId?: string) =>
    api.post<QueueEntry>(`/api/queue/${id}/call`, { vetId, roomId }),

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
    patientName?: string;
    serviceType?: string;
    page?: number;
    limit?: number;
  }) => api.get<QueueEntry[] | PaginatedResult<QueueEntry>>("/api/queue/history", { params: filters }),

  getReports: (filters?: {
    startDate?: string;
    endDate?: string;
  }) => api.get<ReportStats>("/api/queue/reports", { params: filters }),

  getVetStats: (vetId: string, filters?: {
    startDate?: string;
    endDate?: string;
  }) => api.get<VetStats>(`/api/queue/vet-stats/${vetId}`, { params: filters }),

  getRoomOccupations: () => 
    api.get<Record<string, { vetId: string; vetName: string } | null>>("/api/queue/room-occupations"),
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
  
  getActiveVets: () => api.get<ActiveVet[]>("/api/users/active-vets"),
  
  checkInRoom: (roomId: string) => api.post<User>(`/api/users/rooms/${roomId}/check-in`),
  
  checkOutRoom: () => api.post<User>("/api/users/rooms/check-out"),
  
  checkOutRoomForVet: (vetId: string) => api.post<User>(`/api/users/${vetId}/rooms/check-out`),
  
  create: (data: { username: string; password: string; name: string; role: Role }) =>
    api.post<User>("/api/users", data),
  
  update: (id: string, data: { name?: string; role?: Role; password?: string }) =>
    api.patch<User>(`/api/users/${id}`, data),
};

export const serviceApi = {
  list: () => api.get<Service[]>("/api/services"),
  
  listAll: () => api.get<Service[]>("/api/services/all"),
  
  create: (name: string) => api.post<Service>("/api/services", { name }),
  
  update: (id: string, data: { name?: string; isActive?: boolean }) =>
    api.patch<Service>(`/api/services/${id}`, data),
  
  delete: (id: string) => api.delete(`/api/services/${id}`),
};

export const auditApi = {
  getLogs: (filters?: {
    startDate?: string;
    endDate?: string;
    userId?: string;
    action?: string;
    entityType?: string;
    page?: number;
    limit?: number;
  }) => api.get<PaginatedResult<AuditLog>>("/api/queue/audit/logs", { params: filters }),
  
  getLogsByEntry: (entryId: string) =>
    api.get<AuditLog[]>(`/api/queue/entry/${entryId}/audit`),
};


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
  ADMIN = "ADMIN",
}

export enum ModuleKey {
  QUEUE = "queue",
  PATIENTS = "patients",
  TUTORS = "tutors",
  FINANCIAL = "financial",
  ADMIN_USERS = "admin_users",
  ADMIN_ROOMS = "admin_rooms",
  ADMIN_SERVICES = "admin_services",
  PERMISSIONS = "permissions",
  REPORTS = "reports",
  AUDIT = "audit",
}

export interface ModuleDefinition {
  key: ModuleKey;
  label: string;
  description?: string;
}

export enum PaymentStatus {
  PENDING = "PENDING",
  PARTIAL = "PARTIAL",
  PAID = "PAID",
  CANCELLED = "CANCELLED",
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
  patientId?: string | null;
  patient?: Patient | null;
  simplesVetId?: string | null;
  paymentMethod?: string | null;
  paymentStatus?: PaymentStatus;
  paymentAmount?: string | null;
  paymentReceivedById?: string | null;
  paymentReceivedBy?: User | null;
  paymentReceivedAt?: string | null;
  paymentNotes?: string | null;
  systemMessage?: string | null;
}

export interface FinancialSummary {
  totalEntries: number;
  totals: {
    amount: string;
    paid: string;
    partial: string;
    pending: string;
  };
  byPaymentMethod: Record<string, { count: number; amount: string }>;
  byStatus: Record<PaymentStatus, { count: number; amount: string }>;
  walkIns: number;
  scheduled: number;
  receivedEntries: number;
}

export interface FinancialReportData {
  revenueByDay: Array<{ date: string; amount: string; count: number }>;
  revenueByService: Array<{ service: string; amount: string; count: number }>;
  revenueByReceiver: Array<{ receiverId: string | null; receiverName: string; amount: string; count: number }>;
  pendingPayments: Array<{
    id: string;
    patientName: string;
    tutorName: string;
    serviceType: string;
    paymentStatus: PaymentStatus;
    paymentAmount: string | null;
    completedAt: string | null;
    paymentNotes: string | null;
  }>;
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
  permissions?: ModuleKey[];
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
  module?: ModuleKey;
}

export interface PatientStats {
  totalPatients: number;
  newPatientsInPeriod: number;
  topSpecies: Array<{ species: string; count: number }>;
  averageAge: number;
  patientsWithMultipleVisits: number;
}

export interface ConsultationStats {
  totalConsultations: number;
  averageWeight: number;
  topDiagnoses: Array<{ diagnosis: string; count: number }>;
  consultationsPerVet: Array<{ vetName: string; count: number }>;
}

export interface VaccinationStats {
  totalVaccinations: number;
  topVaccines: Array<{ vaccineName: string; count: number }>;
  upcomingDoses: number;
  vaccinationsPerVet: Array<{ vetName: string; count: number }>;
}

export interface RoomUtilizationStats {
  totalHours: number;
  utilizationPerRoom: Array<{ roomName: string; hoursUsed: number; utilizationRate: number; count: number }>;
  peakHours: Array<{ hour: number; count: number }>;
}

export interface QueueFormPreference {
  userId: string;
  lastTutorId?: string | null;
  lastTutorName?: string | null;
  lastPatientId?: string | null;
  lastPatientName?: string | null;
  lastServiceType?: string | null;
  lastPriority?: Priority | null;
  lastAssignedVetId?: string | null;
  lastHasAppointment?: boolean;
  lastSimplesVetId?: string | null;
  updatedAt: string;
  createdAt: string;
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
    patientId?: string;
    simplesVetId?: string;
    paymentMethod?: string;
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

  updateEntry: (id: string, data: {
    patientName?: string;
    tutorName?: string;
    serviceType?: string;
    priority?: Priority;
    assignedVetId?: string | null;
    hasScheduledAppointment?: boolean;
    scheduledAt?: string;
    patientId?: string | null;
    simplesVetId?: string | null;
    paymentMethod?: string | null;
  }) => api.patch<QueueEntry>(`/api/queue/${id}`, data),

  getFinancial: (filters?: {
    startDate?: string;
    endDate?: string;
    tutorName?: string;
    patientName?: string;
    paymentMethod?: string;
    paymentStatus?: PaymentStatus;
    paymentReceivedById?: string;
    serviceType?: string;
    minAmount?: string;
    maxAmount?: string;
    page?: number;
    limit?: number;
  }) => api.get<PaginatedResult<QueueEntry>>("/api/queue/financial", { params: filters }),

  updatePayment: (id: string, data: {
    paymentMethod?: string | null;
    paymentStatus?: PaymentStatus;
    paymentAmount?: string | null;
    paymentReceivedAt?: string | null;
    paymentNotes?: string | null;
    paymentReceivedById?: string | null;
  }) =>
    api.patch<QueueEntry>(`/api/queue/${id}/payment`, data),

  getFinancialSummary: (filters?: {
    startDate?: string;
    endDate?: string;
  }) => api.get<FinancialSummary>("/api/queue/financial/summary", { params: filters }),

  getFinancialReports: (filters?: {
    startDate?: string;
    endDate?: string;
  }) => api.get<FinancialReportData>("/api/queue/financial/reports", { params: filters }),

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

  getPatientStats: (filters?: {
    startDate?: string;
    endDate?: string;
  }) => api.get<PatientStats>("/api/queue/reports/patients", { params: filters }),

  getConsultationStats: (filters?: {
    startDate?: string;
    endDate?: string;
  }) => api.get<ConsultationStats>("/api/queue/reports/consultations", { params: filters }),

  getVaccinationStats: (filters?: {
    startDate?: string;
    endDate?: string;
  }) => api.get<VaccinationStats>("/api/queue/reports/vaccinations", { params: filters }),

  getRoomUtilization: (filters?: {
    startDate?: string;
    endDate?: string;
  }) => api.get<RoomUtilizationStats>("/api/queue/reports/rooms", { params: filters }),

  getFormPreference: () => api.get<QueueFormPreference | null>("/api/queue/preferences"),

  saveFormPreference: (data: {
    lastTutorId?: string | null;
    lastTutorName?: string | null;
    lastPatientId?: string | null;
    lastPatientName?: string | null;
    lastServiceType?: string | null;
    lastPriority?: Priority | null;
    lastAssignedVetId?: string | null;
    lastHasAppointment?: boolean;
    lastSimplesVetId?: string | null;
  }) => api.post<QueueFormPreference>("/api/queue/preferences", data),
};

interface LoginResponse {
  user: User;
  token: string;
  permissions: ModuleKey[];
}

interface MeResponse {
  user: User;
  permissions?: ModuleKey[];
}

export const authApi = {
  login: (username: string, password: string) =>
    api.post<LoginResponse>("/api/auth/login", { username, password }),

  me: () => api.get<MeResponse>("/api/auth/me"),
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

  changeRoom: (roomId: string) => api.post<User>(`/api/users/rooms/${roomId}/change`),

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
    module?: ModuleKey;
    page?: number;
    limit?: number;
  }) => api.get<PaginatedResult<AuditLog>>("/api/audit/logs", { params: filters }),

  getLogsByEntry: (entryId: string) =>
    api.get<AuditLog[]>(`/api/queue/entry/${entryId}/audit`),
};

export const permissionsApi = {
  listModules: () => api.get<ModuleDefinition[]>("/api/permissions/modules"),
  listAll: () => api.get<Record<Role, ModuleKey[]>>("/api/permissions"),
  getForRole: (role: Role) => api.get<{ role: Role; modules: ModuleKey[] }>(`/api/permissions/roles/${role}`),
  updateRole: (role: Role, modules: ModuleKey[]) =>
    api.patch<{ role: Role; modules: ModuleKey[] }>(`/api/permissions/roles/${role}`, { modules }),
};

export interface Tutor {
  id: string;
  name: string;
  phone?: string | null;
  email?: string | null;
  cpfCnpj?: string | null;
  address?: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface Patient {
  id: string;
  name: string;
  species?: string | null;
  breed?: string | null;
  birthDate?: string | null;
  gender?: string | null;
  microchip?: string | null;
  color?: string | null;
  currentWeight?: number | null;
  allergies?: string | null;
  ongoingMedications?: string | null;
  temperament?: string | null;
  neutered?: boolean | null;
  photoUrl?: string | null;
  tutorId?: string | null;
  tutor?: Tutor | null;
  tutorName: string;
  tutorPhone?: string | null;
  tutorEmail?: string | null;
  tutorCpfCnpj?: string | null;
  tutorAddress?: string | null;
  notes?: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface CreateTutorData {
  name: string;
  phone?: string;
  email?: string;
  cpfCnpj?: string;
  address?: string;
}

export interface UpdateTutorData {
  name?: string;
  phone?: string;
  email?: string;
  cpfCnpj?: string;
  address?: string;
}

export interface CreatePatientData {
  name: string;
  species?: string;
  breed?: string;
  birthDate?: string;
  gender?: string;
  microchip?: string;
  color?: string;
  currentWeight?: number;
  allergies?: string;
  ongoingMedications?: string;
  temperament?: string;
  neutered?: boolean;
  photoUrl?: string;
  tutorId?: string;
  tutorName?: string;
  tutorPhone?: string;
  tutorEmail?: string;
  tutorCpfCnpj?: string;
  tutorAddress?: string;
  notes?: string;
}

export interface UpdatePatientData {
  name?: string;
  species?: string;
  breed?: string;
  birthDate?: string;
  gender?: string;
  microchip?: string;
  color?: string;
  currentWeight?: number;
  allergies?: string;
  ongoingMedications?: string;
  temperament?: string;
  neutered?: boolean;
  photoUrl?: string;
  tutorId?: string;
  tutorName?: string;
  tutorPhone?: string;
  tutorEmail?: string;
  tutorCpfCnpj?: string;
  tutorAddress?: string;
  notes?: string;
}

export const tutorApi = {
  list: (filters?: { name?: string; phone?: string; cpfCnpj?: string; search?: string; limit?: number }) =>
    api.get<Tutor[]>("/api/tutors", { params: filters }),

  getById: (id: string) => api.get<Tutor>(`/api/tutors/${id}`),

  create: (data: CreateTutorData) => api.post<Tutor>("/api/tutors", data),

  update: (id: string, data: UpdateTutorData) =>
    api.patch<Tutor>(`/api/tutors/${id}`, data),

  delete: (id: string) => api.delete(`/api/tutors/${id}`),

  getPatients: (id: string) => api.get<Patient[]>(`/api/tutors/${id}/patients`),

  quickCreate: (data: { name: string; phone?: string }) => api.post<Tutor>("/api/tutors/quick", data),
};

export const patientApi = {
  list: (filters?: { name?: string; tutorName?: string; tutorId?: string; limit?: number }) =>
    api.get<Patient[]>("/api/patients", { params: filters }),

  getById: (id: string) => api.get<Patient>(`/api/patients/${id}`),

  create: (data: CreatePatientData) => api.post<Patient>("/api/patients", data),

  update: (id: string, data: UpdatePatientData) =>
    api.patch<Patient>(`/api/patients/${id}`, data),

  delete: (id: string) => api.delete(`/api/patients/${id}`),

  getQueueEntries: (id: string) => api.get<QueueEntry[]>(`/api/patients/${id}/queue-entries`),

  quickCreate: (data: { tutorId: string; name: string; species?: string; notes?: string }) =>
    api.post<Patient>("/api/patients/quick", data),
};

export interface Consultation {
  id: string;
  patientId: string;
  patient?: Patient | null;
  queueEntryId?: string | null;
  queueEntry?: QueueEntry | null;
  vetId?: string | null;
  vet?: User | null;
  diagnosis?: string | null;
  treatment?: string | null;
  prescription?: string | null;
  weightInKg?: number | null;
  notes?: string | null;
  date: string;
  createdAt: string;
  updatedAt: string;
}

export interface CreateConsultationData {
  patientId: string;
  queueEntryId?: string;
  vetId?: string;
  diagnosis?: string;
  treatment?: string;
  prescription?: string;
  weightInKg?: number;
  notes?: string;
  date?: string;
}

export interface UpdateConsultationData {
  diagnosis?: string;
  treatment?: string;
  prescription?: string;
  weightInKg?: number;
  notes?: string;
  date?: string;
}

export const consultationApi = {
  list: (filters?: { patientId?: string; queueEntryId?: string; vetId?: string }) =>
    api.get<Consultation[]>("/api/consultations", { params: filters }),

  getById: (id: string) => api.get<Consultation>(`/api/consultations/${id}`),

  create: (data: CreateConsultationData) => api.post<Consultation>("/api/consultations", data),

  update: (id: string, data: UpdateConsultationData) =>
    api.patch<Consultation>(`/api/consultations/${id}`, data),

  delete: (id: string) => api.delete(`/api/consultations/${id}`),
};

export interface Vaccination {
  id: string;
  patientId: string;
  patient?: Patient | null;
  vaccineName: string;
  appliedDate: string;
  batchNumber?: string | null;
  vetId?: string | null;
  vet?: User | null;
  nextDoseDate?: string | null;
  notes?: string | null;
  createdAt: string;
}

export interface CreateVaccinationData {
  patientId: string;
  vaccineName: string;
  appliedDate?: string;
  batchNumber?: string;
  vetId?: string;
  nextDoseDate?: string;
  notes?: string;
}

export interface UpdateVaccinationData {
  vaccineName?: string;
  appliedDate?: string;
  batchNumber?: string;
  nextDoseDate?: string;
  notes?: string;
}

export const vaccinationApi = {
  list: (filters?: { patientId?: string; vetId?: string; upcomingDoses?: boolean }) =>
    api.get<Vaccination[]>("/api/vaccinations", { params: filters }),

  getById: (id: string) => api.get<Vaccination>(`/api/vaccinations/${id}`),

  create: (data: CreateVaccinationData) => api.post<Vaccination>("/api/vaccinations", data),

  update: (id: string, data: UpdateVaccinationData) =>
    api.patch<Vaccination>(`/api/vaccinations/${id}`, data),

  delete: (id: string) => api.delete(`/api/vaccinations/${id}`),

  getSuggestions: () => api.get<string[]>("/api/vaccinations/suggestions"),
};


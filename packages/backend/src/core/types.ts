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

export interface RoleModulePermission {
  id: string;
  role: Role;
  module: ModuleKey;
  createdAt: Date;
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
  createdAt: Date;
}

export interface QueueEntry {
  id: string;
  patientName: string;
  tutorName: string;
  serviceType: string;
  priority: Priority;
  status: Status;
  createdAt: Date;
  calledAt?: Date | null;
  completedAt?: Date | null;
  assignedVetId?: string | null;
  assignedVet?: User | null;
  roomId?: string | null;
  room?: Room | null;
  hasScheduledAppointment?: boolean;
  scheduledAt?: Date | null;
  patientId?: string | null;
  patient?: Patient | null;
  simplesVetId?: string | null;
  paymentMethod?: string | null;
  paymentStatus?: PaymentStatus;
  paymentAmount?: string | null;
  paymentReceivedById?: string | null;
  paymentReceivedBy?: User | null;
  paymentReceivedAt?: Date | null;
  paymentNotes?: string | null;
  systemMessage?: string;
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
    completedAt: Date | null;
    paymentNotes: string | null;
  }>;
}

export interface User {
  id: string;
  username: string;
  name: string;
  role: Role;
  createdAt: Date;
  currentRoomId?: string | null;
  roomCheckedInAt?: Date | null;
  lastActivityAt?: Date | null;
  permissions?: ModuleKey[];
}

export interface Room {
  id: string;
  name: string;
  isActive: boolean;
  createdAt: Date;
}

export interface AuditLog {
  id: string;
  userId: string;
  user?: User;
  action: string;
  entityType: string;
  entityId?: string | null;
  metadata?: any;
  timestamp: Date;
  module?: ModuleKey;
}

export interface ActiveVet {
  vetId: string;
  vetName: string;
  roomId: string;
  roomName: string;
}

export interface Tutor {
  id: string;
  name: string;
  phone?: string | null;
  email?: string | null;
  cpfCnpj?: string | null;
  address?: string | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface Patient {
  id: string;
  name: string;
  species?: string | null;
  breed?: string | null;
  birthDate?: Date | null;
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
  createdAt: Date;
  updatedAt: Date;
}

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
  date: Date;
  createdAt: Date;
  updatedAt: Date;
}

export interface Vaccination {
  id: string;
  patientId: string;
  patient?: Patient | null;
  vaccineName: string;
  appliedDate: Date;
  batchNumber?: string | null;
  vetId?: string | null;
  vet?: User | null;
  nextDoseDate?: Date | null;
  notes?: string | null;
  createdAt: Date;
}
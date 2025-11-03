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
}

export interface ActiveVet {
  vetId: string;
  vetName: string;
  roomId: string;
  roomName: string;
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
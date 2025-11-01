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
}

export interface User {
  id: string;
  username: string;
  name: string;
  role: Role;
  createdAt: Date;
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

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
  createdAt: Date;
  calledAt?: Date | null;
  completedAt?: Date | null;
}


import { QueueRepository } from "../repositories/queueRepository";
import { QueueEntry, Priority, Status, ServiceType } from "../core/types";

export class QueueService {
  constructor(private repository: QueueRepository) {}

  async addToQueue(data: {
    patientName: string;
    tutorName: string;
    serviceType: ServiceType;
    priority?: Priority;
    assignedVetId?: string;
  }): Promise<QueueEntry> {
    const priority = data.priority || Priority.NORMAL;

    if (!data.patientName.trim() || !data.tutorName.trim()) {
      throw new Error("Nome do paciente e tutor são obrigatórios");
    }

    return this.repository.create({
      patientName: data.patientName.trim(),
      tutorName: data.tutorName.trim(),
      serviceType: data.serviceType,
      priority,
      assignedVetId: data.assignedVetId,
    });
  }

  async callNext(vetId?: string, roomId?: string): Promise<QueueEntry | null> {
    const next = vetId
      ? await this.repository.findNextWaiting(vetId)
      : await this.repository.findNextWaitingGeneral();

    if (!next) {
      return null;
    }

    return this.repository.updateStatus(
      next.id,
      Status.CALLED,
      new Date(),
      undefined,
      roomId
    );
  }

  async startService(id: string): Promise<QueueEntry> {
    const entry = await this.repository.findById(id);

    if (!entry) {
      throw new Error("Entrada não encontrada");
    }

    if (entry.status !== Status.CALLED && entry.status !== Status.WAITING) {
      throw new Error("Apenas entradas chamadas ou aguardando podem iniciar atendimento");
    }

    if (entry.status === Status.WAITING && !entry.calledAt) {
      return this.repository.updateStatus(id, Status.IN_PROGRESS, new Date());
    }

    return this.repository.updateStatus(id, Status.IN_PROGRESS);
  }

  async completeService(id: string): Promise<QueueEntry> {
    const entry = await this.repository.findById(id);

    if (!entry) {
      throw new Error("Entrada não encontrada");
    }

    if (entry.status === Status.COMPLETED) {
      throw new Error("Atendimento já foi finalizado");
    }

    return this.repository.updateStatus(id, Status.COMPLETED, undefined, new Date());
  }

  async cancelEntry(id: string): Promise<QueueEntry> {
    const entry = await this.repository.findById(id);

    if (!entry) {
      throw new Error("Entrada não encontrada");
    }

    if (entry.status === Status.COMPLETED) {
      throw new Error("Não é possível cancelar atendimento já finalizado");
    }

    return this.repository.updateStatus(id, Status.CANCELLED);
  }

  async listActive(vetId?: string | null): Promise<QueueEntry[]> {
    if (vetId === undefined) {
      return this.repository.listActive();
    }

    if (vetId === null) {
      return this.repository.listActiveGeneral();
    }

    return this.repository.listActiveByVet(vetId);
  }

  async claimPatient(entryId: string, vetId: string): Promise<QueueEntry> {
    const entry = await this.repository.findById(entryId);

    if (!entry) {
      throw new Error("Entrada não encontrada");
    }

    if (entry.status !== Status.WAITING) {
      throw new Error("Apenas pacientes aguardando podem ser atribuídos");
    }

    return this.repository.updateAssignedVet(entryId, vetId);
  }

  async getHistory(filters?: {
    startDate?: Date;
    endDate?: Date;
    tutorName?: string;
    serviceType?: ServiceType;
  }): Promise<QueueEntry[]> {
    return this.repository.listCompleted(filters);
  }

  async getReports(startDate: Date, endDate: Date) {
    return this.repository.getStats(startDate, endDate);
  }
}


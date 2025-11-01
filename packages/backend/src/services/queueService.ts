import { QueueRepository } from "../repositories/queueRepository";
import { UserRepository } from "../repositories/userRepository";
import { QueueEntry, Priority, Status } from "../core/types";

export class QueueService {
  private userRepository: UserRepository;
  
  constructor(private repository: QueueRepository) {
    this.userRepository = new UserRepository();
  }

  async addToQueue(data: {
    patientName: string;
    tutorName: string;
    serviceType: string;
    priority?: Priority;
    assignedVetId?: string;
    hasScheduledAppointment?: boolean;
    scheduledAt?: Date;
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
      hasScheduledAppointment: data.hasScheduledAppointment,
      scheduledAt: data.scheduledAt,
    });
  }

  async callNext(vetId?: string, roomId?: string): Promise<QueueEntry | null> {
    if (vetId && roomId) {
      const roomOccupied = await this.repository.isRoomOccupiedByOtherVet(roomId, vetId);
      if (roomOccupied) {
        throw new Error(`Sala já está ocupada por veterinário ${roomOccupied.vetName}`);
      }
    }

    if (!vetId && roomId) {
      const hasVet = await this.repository.hasVetInRoom(roomId);
      if (!hasVet) {
        throw new Error("A sala selecionada não possui veterinário ativo");
      }
    }

    const next = vetId
      ? await this.repository.findNextWaiting(vetId)
      : await this.repository.findNextWaitingGeneral();

    if (!next) {
      return null;
    }

    const result = await this.repository.updateStatus(
      next.id,
      Status.CALLED,
      new Date(),
      undefined,
      roomId
    );

    if (vetId) {
      this.userRepository.updateLastActivity(vetId).catch(console.error);
    }

    return result;
  }

  async callPatient(id: string, vetId?: string, roomId?: string): Promise<QueueEntry> {
    const entry = await this.repository.findById(id);

    if (!entry) {
      throw new Error("Entrada não encontrada");
    }

    if (entry.status !== Status.WAITING) {
      throw new Error("Apenas pacientes aguardando podem ser chamados");
    }

    if (vetId && roomId) {
      const roomOccupied = await this.repository.isRoomOccupiedByOtherVet(roomId, vetId);
      if (roomOccupied) {
        throw new Error(`Sala já está ocupada por veterinário ${roomOccupied.vetName}`);
      }
    }

    if (!vetId && roomId) {
      const hasVet = await this.repository.hasVetInRoom(roomId);
      if (!hasVet) {
        throw new Error("A sala selecionada não possui veterinário ativo");
      }
    }

    const result = await this.repository.updateStatus(
      id,
      Status.CALLED,
      new Date(),
      undefined,
      roomId
    );

    if (vetId) {
      this.userRepository.updateLastActivity(vetId).catch(console.error);
    }

    return result;
  }

  async startService(id: string, userRole?: string): Promise<QueueEntry> {
    const entry = await this.repository.findById(id);

    if (!entry) {
      throw new Error("Entrada não encontrada");
    }

    if (entry.status !== Status.CALLED && entry.status !== Status.WAITING) {
      throw new Error("Apenas entradas chamadas ou aguardando podem iniciar atendimento");
    }

    if (userRole === "RECEPCAO" && !entry.assignedVetId) {
      throw new Error("Não é possível iniciar atendimento sem veterinário atribuído");
    }

    const result = entry.status === Status.WAITING && !entry.calledAt
      ? await this.repository.updateStatus(id, Status.IN_PROGRESS, new Date())
      : await this.repository.updateStatus(id, Status.IN_PROGRESS);

    if (entry.assignedVetId) {
      this.userRepository.updateLastActivity(entry.assignedVetId).catch(console.error);
    }

    return result;
  }

  async completeService(id: string, userRole?: string): Promise<QueueEntry> {
    const entry = await this.repository.findById(id);

    if (!entry) {
      throw new Error("Entrada não encontrada");
    }

    if (entry.status === Status.COMPLETED) {
      throw new Error("Atendimento já foi finalizado");
    }

    if (userRole === "RECEPCAO" && !entry.assignedVetId) {
      throw new Error("Não é possível finalizar atendimento sem veterinário atribuído");
    }

    const result = await this.repository.updateStatus(id, Status.COMPLETED, undefined, new Date());

    if (entry.assignedVetId) {
      this.userRepository.updateLastActivity(entry.assignedVetId).catch(console.error);
    }

    return result;
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
    patientName?: string;
    serviceType?: string;
  }): Promise<QueueEntry[]> {
    return this.repository.listCompleted(filters);
  }

  async getHistoryPaginated(filters?: {
    startDate?: Date;
    endDate?: Date;
    tutorName?: string;
    patientName?: string;
    serviceType?: string;
    page?: number;
    limit?: number;
  }): Promise<{ entries: QueueEntry[]; total: number; page: number; totalPages: number }> {
    return this.repository.listCompletedPaginated(filters);
  }

  async getReports(startDate: Date, endDate: Date) {
    return this.repository.getStats(startDate, endDate);
  }

  async getVetStats(vetId: string, startDate: Date, endDate: Date) {
    return this.repository.getVetStats(vetId, startDate, endDate);
  }

  async getRoomOccupations(currentVetId?: string) {
    return this.repository.getRoomOccupations(currentVetId);
  }
}
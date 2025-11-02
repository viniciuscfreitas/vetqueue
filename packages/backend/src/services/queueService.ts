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
    let priority = data.priority || Priority.NORMAL;

    if (data.hasScheduledAppointment && data.scheduledAt) {
      const scheduledTime = new Date(data.scheduledAt).getTime();
      const now = Date.now();
      const toleranceMs = 15 * 60 * 1000;
      
      if (now >= scheduledTime + toleranceMs) {
        priority = Priority.HIGH;
      }
    }

    console.log(`[QUEUE] addToQueue - Paciente: ${data.patientName}, Tutor: ${data.tutorName}, Serviço: ${data.serviceType}, Prioridade: ${priority}`);
    
    try {
      if (!data.patientName.trim() || !data.tutorName.trim()) {
        throw new Error("Nome do paciente e tutor são obrigatórios");
      }

      const entry = await this.repository.create({
        patientName: data.patientName.trim(),
        tutorName: data.tutorName.trim(),
        serviceType: data.serviceType,
        priority,
        assignedVetId: data.assignedVetId,
        hasScheduledAppointment: data.hasScheduledAppointment,
        scheduledAt: data.scheduledAt,
      });
      
      console.log(`[QUEUE] ✓ Criado - ID: ${entry.id}, Posição na fila calculada`);
      return entry;
    } catch (error) {
      console.error(`[QUEUE] ✗ Erro ao criar entrada:`, error);
      throw error;
    }
  }

  async callNext(vetId?: string, roomId?: string): Promise<QueueEntry | null> {
    console.log(`[QUEUE] callNext - vetId: ${vetId || 'none'}, roomId: ${roomId || 'none'}`);
    
    if (vetId && !roomId) {
      const vet = await this.userRepository.findById(vetId);
      if (!vet?.currentRoomId) {
        console.error(`[QUEUE] ✗ Vet ${vetId} tentou chamar sem check-in em sala`);
        throw new Error("Você deve fazer check-in em uma sala primeiro");
      }
      roomId = vet.currentRoomId;
    }
    
    if (vetId && roomId) {
      const roomOccupied = await this.repository.getVetInRoom(roomId);
      if (roomOccupied && roomOccupied.vetId !== vetId) {
        console.error(`[QUEUE] ✗ Sala ${roomId} ocupada por outro veterinário`);
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
      console.log(`[QUEUE] Nenhuma entrada disponível na fila para vet: ${vetId}`);
      return null;
    }

    let result = await this.repository.updateStatus(
      next.id,
      Status.CALLED,
      new Date(),
      undefined,
      roomId
    );

    if (vetId && !next.assignedVetId) {
      result = await this.repository.updateAssignedVet(next.id, vetId);
    }

    const actualVetId = vetId || (next.assignedVetId || undefined);
    if (actualVetId) {
      this.userRepository.updateLastActivity(actualVetId).catch(console.error);
    }

    console.log(`[QUEUE] ✓ Chamando - Paciente: ${next.patientName} (${next.id}), Sala: ${roomId}`);
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
      const roomOccupied = await this.repository.getVetInRoom(roomId);
      if (roomOccupied && roomOccupied.vetId !== vetId) {
        throw new Error(`Sala já está ocupada por veterinário ${roomOccupied.vetName}`);
      }
    }

    if (!vetId && roomId) {
      const hasVet = await this.repository.hasVetInRoom(roomId);
      if (!hasVet) {
        if (entry.assignedVetId && entry.assignedVet) {
          throw new Error(`Veterinário ${entry.assignedVet.name} deve fazer check-in na sala primeiro`);
        }
        throw new Error("A sala selecionada não possui veterinário ativo");
      }
    }

    let result = await this.repository.updateStatus(
      id,
      Status.CALLED,
      new Date(),
      undefined,
      roomId
    );

    if (vetId && !entry.assignedVetId) {
      result = await this.repository.updateAssignedVet(id, vetId);
    }

    if (vetId) {
      this.userRepository.updateLastActivity(vetId).catch(console.error);
    }

    return result;
  }

  async startService(id: string, userRole?: string): Promise<QueueEntry> {
    console.log(`[QUEUE] startService - EntryId: ${id}`);
    
    if (userRole === "RECEPCAO") {
      throw new Error("Recepção não pode iniciar atendimento");
    }

    const entry = await this.repository.findById(id);

    if (!entry) {
      console.error(`[QUEUE] ✗ Entrada ${id} não encontrada`);
      throw new Error("Entrada não encontrada");
    }

    if (entry.status !== Status.CALLED && entry.status !== Status.WAITING) {
      console.error(`[QUEUE] ✗ Status inválido para iniciar - EntryId: ${id}, Status atual: ${entry.status}`);
      throw new Error("Apenas entradas chamadas ou aguardando podem iniciar atendimento");
    }

    const result = entry.status === Status.WAITING && !entry.calledAt
      ? await this.repository.updateStatus(id, Status.IN_PROGRESS, new Date())
      : await this.repository.updateStatus(id, Status.IN_PROGRESS);

    if (entry.assignedVetId) {
      this.userRepository.updateLastActivity(entry.assignedVetId).catch(console.error);
    }

    console.log(`[QUEUE] ✓ Iniciado atendimento - Paciente: ${entry.patientName}`);
    return result;
  }

  async completeService(id: string, userRole?: string): Promise<QueueEntry> {
    console.log(`[QUEUE] completeService - EntryId: ${id}`);
    const entry = await this.repository.findById(id);

    if (!entry) {
      console.error(`[QUEUE] ✗ Entrada ${id} não encontrada para completar`);
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

    console.log(`[QUEUE] ✓ Completado - Paciente: ${entry.patientName}, Vet: ${entry.assignedVet?.name || 'N/A'}`);
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

  async upgradeScheduledPriorities(): Promise<QueueEntry[]> {
    const entriesNeedingUpgrade = await this.repository.findScheduledEntriesNeedingUpgrade();
    
    const upgradedEntries: QueueEntry[] = [];
    for (const entry of entriesNeedingUpgrade) {
      const upgraded = await this.repository.updatePriority(entry.id, Priority.HIGH);
      upgradedEntries.push(upgraded);
    }
    
    return upgradedEntries;
  }
}
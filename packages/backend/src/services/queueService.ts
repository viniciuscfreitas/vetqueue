import { QueueRepository } from "../repositories/queueRepository";
import { UserRepository } from "../repositories/userRepository";
import { QueueEntry, Priority, Status } from "../core/types";
import { logger } from "../lib/logger";

export class QueueService {
  private userRepository: UserRepository;
  
  constructor(private repository: QueueRepository) {
    this.userRepository = new UserRepository();
  }

  private updateActivityIfNeeded(vetId?: string | null): void {
    if (vetId) {
      this.userRepository.updateLastActivity(vetId).catch((error) => {
        logger.error("Failed to update user activity", { vetId, error: error instanceof Error ? error.message : String(error) });
      });
    }
  }

  private processPriorityAndSchedule(
    basePriority: Priority,
    hasScheduledAppointment?: boolean,
    scheduledAt?: Date
  ): {
    priority: Priority;
    hasScheduledAppointment: boolean;
    scheduledAt: Date | null;
  } {
    if (!hasScheduledAppointment || !scheduledAt) {
      return {
        priority: basePriority,
        hasScheduledAppointment: false,
        scheduledAt: null,
      };
    }

    const scheduledTime = new Date(scheduledAt).getTime();
    const now = Date.now();
    const toleranceMs = 15 * 60 * 1000;
    
    if (now >= scheduledTime + toleranceMs) {
      const finalPriority = basePriority === Priority.EMERGENCY ? Priority.EMERGENCY : Priority.NORMAL;
      return {
        priority: finalPriority,
        hasScheduledAppointment: false,
        scheduledAt: null,
      };
    }
    
    return {
      priority: basePriority,
      hasScheduledAppointment: true,
      scheduledAt: scheduledAt,
    };
  }

  async addToQueue(data: {
    patientName: string;
    tutorName: string;
    serviceType: string;
    priority?: Priority;
    assignedVetId?: string;
    hasScheduledAppointment?: boolean;
    scheduledAt?: Date;
    patientId?: string;
  }): Promise<QueueEntry> {
    logger.debug("addToQueue called", {
      module: "Queue",
      patientName: data.patientName,
      tutorName: data.tutorName,
      serviceType: data.serviceType,
      priority: data.priority,
      assignedVetId: data.assignedVetId,
      hasScheduledAppointment: data.hasScheduledAppointment,
      scheduledAt: data.scheduledAt,
      patientId: data.patientId,
    });
    
    const processed = this.processPriorityAndSchedule(
      data.priority || Priority.NORMAL,
      data.hasScheduledAppointment,
      data.scheduledAt
    );

    if (data.hasScheduledAppointment && !processed.hasScheduledAppointment) {
      logger.info("Scheduled appointment converted to walk-in (late >15min)", {
        module: "Queue",
        eventType: "AppointmentConversion",
        patientName: data.patientName,
        patientId: data.patientId || null,
      });
    }

    if (processed.hasScheduledAppointment && processed.scheduledAt) {
      const now = new Date();
      if (processed.scheduledAt < now) {
        logger.warn("Cannot schedule appointment in the past", {
          module: "Queue",
          scheduledAt: processed.scheduledAt,
          now,
          patientId: data.patientId || null,
        });
        throw new Error("Não é possível agendar para uma data/hora no passado");
      }
    }

    const addQueueMeta: any = {
      module: "Queue",
      eventType: "AnimalEnqueued",
      patientName: data.patientName,
      tutorName: data.tutorName,
      serviceType: data.serviceType,
      priority: processed.priority,
      hasScheduledAppointment: processed.hasScheduledAppointment,
    };
    if (data.patientId) addQueueMeta.patientId = data.patientId;
    
    logger.info("Adding to queue", addQueueMeta);
    
    try {
      if (!data.patientName.trim() || !data.tutorName.trim()) {
        logger.warn("Missing required fields", { hasPatientName: !!data.patientName.trim(), hasTutorName: !!data.tutorName.trim() });
        throw new Error("Nome do paciente e tutor são obrigatórios");
      }

      const startTime = Date.now();
      const entry = await this.repository.create({
        patientName: data.patientName.trim(),
        tutorName: data.tutorName.trim(),
        serviceType: data.serviceType,
        priority: processed.priority,
        assignedVetId: data.assignedVetId,
        hasScheduledAppointment: processed.hasScheduledAppointment,
        scheduledAt: processed.scheduledAt || undefined,
        patientId: data.patientId,
      });
      const dbDuration = Date.now() - startTime;
      
      logger.debug("Queue entry created", {
        module: "Queue",
        entryId: entry.id,
        patientId: entry.patientId || null,
        patientName: entry.patientName,
        dbDuration: `${dbDuration}ms`,
      });
      
      if (dbDuration > 500) {
        logger.warn("Slow database operation", {
          module: "Queue",
          operation: "create queue entry",
          duration: `${dbDuration}ms`,
          entryId: entry.id,
        });
      }
      
      return entry;
    } catch (error) {
      logger.error("Failed to create queue entry", {
        module: "Queue",
        error: error instanceof Error ? error.message : String(error),
        stack: error instanceof Error ? error.stack : undefined,
        patientId: data.patientId || null,
        patientName: data.patientName,
        tutorName: data.tutorName,
        serviceType: data.serviceType,
        priority: processed.priority,
        assignedVetId: data.assignedVetId || null,
        hasScheduledAppointment: processed.hasScheduledAppointment,
      });
      throw error;
    }
  }

  async callNext(vetId?: string, roomId?: string): Promise<QueueEntry | null> {
    logger.debug("Calling next patient", { module: "Queue", vetId, roomId });
    
    if (vetId && !roomId) {
      const vet = await this.userRepository.findById(vetId);
      if (!vet?.currentRoomId) {
        logger.warn("Vet tried to call without room check-in", { module: "Queue", vetId });
        throw new Error("Você deve fazer check-in em uma sala primeiro");
      }
      roomId = vet.currentRoomId;
    }
    
    if (vetId && roomId) {
      const roomOccupied = await this.repository.getVetInRoom(roomId);
      if (roomOccupied && roomOccupied.vetId !== vetId) {
        logger.warn("Room occupied by another vet", { module: "Queue", roomId, vetId });
        throw new Error(`Sala já está ocupada por veterinário ${roomOccupied.vetName}`);
      }
    }

    if (!vetId && roomId) {
      const hasVet = await this.repository.hasVetInRoom(roomId);
      if (!hasVet) {
        logger.warn("Room has no active vet", { module: "Queue", roomId });
        throw new Error("A sala selecionada não possui veterinário ativo");
      }
    }

    const result = await this.repository.callNextWithLock(
      vetId || null,
      roomId,
      new Date()
    );

    if (!result) {
      logger.info("No entries available in queue", { module: "Queue", vetId: vetId || null, roomId: roomId || null });
      return null;
    }

    const actualVetId = vetId || (result.assignedVetId || undefined);
    this.updateActivityIfNeeded(actualVetId);

    logger.info("Patient called", {
      module: "Queue",
      eventType: "StatusTransition",
      entryId: result.id,
      patientId: result.patientId || null,
      patientName: result.patientName,
      oldStatus: Status.WAITING,
      newStatus: Status.CALLED,
      roomId: roomId || null,
      assignedVetId: actualVetId || null,
    });
    return result;
  }

  async callPatient(id: string, vetId?: string, roomId?: string): Promise<QueueEntry> {
    logger.debug("Calling specific patient", { module: "Queue", entryId: id, vetId, roomId });
    const entry = await this.repository.findById(id);

    if (!entry) {
      logger.error("Queue entry not found for call", { module: "Queue", entryId: id });
      throw new Error("Entrada não encontrada");
    }

    if (entry.status !== Status.WAITING) {
      logger.warn("Cannot call patient - invalid status", {
        module: "Queue",
        entryId: id,
        currentStatus: entry.status,
        patientId: entry.patientId || null,
      });
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

    const oldStatus = entry.status;
    const result = await this.repository.callPatientWithLock(
      id,
      vetId,
      roomId,
      new Date()
    );

    this.updateActivityIfNeeded(vetId);

    logger.info("Patient called (direct)", {
      module: "Queue",
      eventType: "StatusTransition",
      entryId: result.id,
      patientId: result.patientId || null,
      patientName: result.patientName,
      oldStatus,
      newStatus: Status.CALLED,
      roomId: roomId || null,
      assignedVetId: vetId || result.assignedVetId || null,
    });

    return result;
  }

  async startService(id: string, userRole?: string): Promise<QueueEntry> {
    logger.debug("Starting service", { module: "Queue", entryId: id, userRole });
    
    if (userRole === "RECEPCAO") {
      throw new Error("Recepção não pode iniciar atendimento");
    }

    const entry = await this.repository.findById(id);

    if (!entry) {
      logger.error("Queue entry not found", { module: "Queue", entryId: id });
      throw new Error("Entrada não encontrada");
    }

    if (entry.status !== Status.CALLED && entry.status !== Status.WAITING) {
      logger.warn("Invalid status to start service", { module: "Queue", entryId: id, currentStatus: entry.status });
      throw new Error("Apenas entradas chamadas ou aguardando podem iniciar atendimento");
    }

    const oldStatus = entry.status;
    const result = entry.status === Status.WAITING && !entry.calledAt
      ? await this.repository.updateStatus(id, Status.IN_PROGRESS, new Date())
      : await this.repository.updateStatus(id, Status.IN_PROGRESS);

    this.updateActivityIfNeeded(entry.assignedVetId);

    logger.info("Service started", {
      module: "Queue",
      eventType: "StatusTransition",
      entryId: id,
      patientId: entry.patientId || null,
      patientName: entry.patientName,
      oldStatus,
      newStatus: Status.IN_PROGRESS,
      assignedVetId: entry.assignedVetId || null,
      userRole: userRole || null,
    });
    return result;
  }

  async completeService(id: string, userRole?: string): Promise<QueueEntry> {
    logger.debug("Completing service", { module: "Queue", entryId: id, userRole });
    const entry = await this.repository.findById(id);

    if (!entry) {
      logger.error("Queue entry not found to complete", { module: "Queue", entryId: id });
      throw new Error("Entrada não encontrada");
    }

    if (entry.status === Status.COMPLETED) {
      throw new Error("Atendimento já foi finalizado");
    }

    if (userRole === "RECEPCAO" && !entry.assignedVetId) {
      throw new Error("Não é possível finalizar atendimento sem veterinário atribuído");
    }

    const oldStatus = entry.status;
    const result = await this.repository.updateStatus(id, Status.COMPLETED, undefined, new Date());

    this.updateActivityIfNeeded(entry.assignedVetId);

    logger.info("Service completed", {
      module: "Queue",
      eventType: "StatusTransition",
      entryId: id,
      patientId: entry.patientId || null,
      patientName: entry.patientName,
      oldStatus,
      newStatus: Status.COMPLETED,
      assignedVetId: entry.assignedVetId || null,
      vetName: entry.assignedVet?.name || null,
      userRole: userRole || null,
    });
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

  async getPatientStatistics(startDate: Date, endDate: Date) {
    return this.repository.getPatientStats(startDate, endDate);
  }

  async getConsultationStatistics(startDate: Date, endDate: Date) {
    return this.repository.getConsultationStats(startDate, endDate);
  }

  async getVaccinationStatistics(startDate: Date, endDate: Date) {
    return this.repository.getVaccinationStats(startDate, endDate);
  }

  async getRoomUtilization(startDate: Date, endDate: Date) {
    return this.repository.getRoomUtilizationStats(startDate, endDate);
  }

  async updateEntry(
    id: string,
    data: {
      patientName?: string;
      tutorName?: string;
      serviceType?: string;
      priority?: Priority;
      assignedVetId?: string | null;
      hasScheduledAppointment?: boolean;
      scheduledAt?: Date;
      patientId?: string | null;
    },
    userRole?: string
  ): Promise<QueueEntry> {
    if (userRole !== "RECEPCAO") {
      throw new Error("Apenas recepção pode editar atendimentos");
    }

    const entry = await this.repository.findById(id);

    if (!entry) {
      throw new Error("Entrada não encontrada");
    }

    if (entry.status !== Status.WAITING) {
      throw new Error("Apenas atendimentos aguardando podem ser editados");
    }

    const processed = this.processPriorityAndSchedule(
      data.priority !== undefined ? data.priority : entry.priority,
      data.hasScheduledAppointment !== undefined ? data.hasScheduledAppointment : entry.hasScheduledAppointment,
      data.scheduledAt !== undefined ? data.scheduledAt : (entry.scheduledAt || undefined)
    );

    const wasScheduled = entry.hasScheduledAppointment;
    const becomesWalkIn = wasScheduled && !processed.hasScheduledAppointment;
    
    if (becomesWalkIn) {
      logger.info("Scheduled appointment converted to walk-in (late >15min) on update", { entryId: id, patientName: entry.patientName });
    }

    logger.debug("Updating queue entry", { entryId: id, data });

    try {
      const updated = await this.repository.update(id, {
        ...data,
        priority: processed.priority,
        hasScheduledAppointment: processed.hasScheduledAppointment,
        scheduledAt: processed.scheduledAt || undefined,
      });
      logger.info("Queue entry updated", { entryId: id, patientName: updated.patientName, priority: processed.priority });
      return updated;
    } catch (error) {
      logger.error("Failed to update queue entry", { 
        entryId: id,
        error: error instanceof Error ? error.message : String(error),
        stack: error instanceof Error ? error.stack : undefined,
        inputData: data
      });
      throw error;
    }
  }
}
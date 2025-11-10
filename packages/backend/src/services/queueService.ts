import {
  FinancialReportData,
  FinancialSummary,
  PaymentStatus,
  Priority,
  QueueEntry,
  Role,
  Status,
  QueueFormPreference,
  PaymentHistoryEntry,
} from "../core/types";
import { logger } from "../lib/logger";
import { QueueRepository } from "../repositories/queueRepository";
import { UserRepository } from "../repositories/userRepository";
import { QueueFormPreferenceRepository } from "../repositories/queueFormPreferenceRepository";
import { randomUUID } from "crypto";

const log = logger.withContext({ module: "Queue" });

export class QueueService {
  private userRepository: UserRepository;
  private preferenceRepository: QueueFormPreferenceRepository;

  constructor(private repository: QueueRepository) {
    this.userRepository = new UserRepository();
    this.preferenceRepository = new QueueFormPreferenceRepository();
  }

  private updateActivityIfNeeded(vetId?: string | null): void {
    if (vetId) {
      this.userRepository.updateLastActivity(vetId).catch((error) => {
        log.error("Failed to update user activity", { vetId, error: error instanceof Error ? error.message : String(error) });
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
    patientName?: string;
    tutorName?: string;
    serviceType: string;
    priority?: Priority;
    assignedVetId?: string;
    hasScheduledAppointment?: boolean;
    scheduledAt?: Date;
    patientId?: string;
    simplesVetId?: string;
    paymentMethod?: string;
    userId?: string;
  }): Promise<QueueEntry> {
    const trimmedPatientName = (data.patientName ?? "").trim();
    const trimmedTutorName = (data.tutorName ?? "").trim();

    log.debug("addToQueue called", {
      patientName: trimmedPatientName || null,
      tutorName: trimmedTutorName || null,
      serviceType: data.serviceType,
      priority: data.priority,
      assignedVetId: data.assignedVetId,
      hasScheduledAppointment: data.hasScheduledAppointment,
      scheduledAt: data.scheduledAt,
      patientId: data.patientId,
    });

    if (!data.patientId && trimmedPatientName.length === 0) {
      log.warn("Missing required patient name for walk-in entry", {
        hasPatientId: !!data.patientId,
      });
      throw new Error("Nome do paciente é obrigatório");
    }

    if (!data.patientId && trimmedTutorName.length === 0) {
      log.warn("Missing required tutor name for walk-in entry", {
        hasPatientId: !!data.patientId,
      });
      throw new Error("Nome do tutor é obrigatório");
    }

    const cleanedPatientName = trimmedPatientName || data.patientName || "";
    const cleanedTutorName = trimmedTutorName || data.tutorName || "";

    const processed = this.processPriorityAndSchedule(
      data.priority || Priority.NORMAL,
      data.hasScheduledAppointment,
      data.scheduledAt
    );

    let systemMessage: string | undefined;

    if (data.hasScheduledAppointment && !processed.hasScheduledAppointment) {
      log.info("Scheduled appointment converted to walk-in (late >15min)", {
        eventType: "AppointmentConversion",
        patientName: cleanedPatientName,
        patientId: data.patientId || null,
      });
      systemMessage = "Entrada convertida para encaixe por atraso maior que 15 minutos.";
    }

    if (processed.hasScheduledAppointment && processed.scheduledAt) {
      const now = new Date();
      if (processed.scheduledAt < now) {
        log.warn("Cannot schedule appointment in the past", {
          scheduledAt: processed.scheduledAt,
          now,
          patientId: data.patientId || null,
        });
        throw new Error("Não é possível agendar para uma data/hora no passado");
      }
    }

    const addQueueMeta: any = {
      eventType: "AnimalEnqueued",
      patientName: cleanedPatientName,
      tutorName: cleanedTutorName,
      serviceType: data.serviceType,
      priority: processed.priority,
      hasScheduledAppointment: processed.hasScheduledAppointment,
    };
    if (data.patientId) addQueueMeta.patientId = data.patientId;

    log.info("Adding to queue", addQueueMeta);

    try {
      const startTime = Date.now();
      const entry = await this.repository.create({
        patientName: cleanedPatientName,
        tutorName: cleanedTutorName,
        serviceType: data.serviceType,
        priority: processed.priority,
        assignedVetId: data.assignedVetId,
        hasScheduledAppointment: processed.hasScheduledAppointment,
        scheduledAt: processed.scheduledAt || undefined,
        patientId: data.patientId,
        simplesVetId: data.simplesVetId,
        paymentMethod: data.paymentMethod,
      });
      const dbDuration = Date.now() - startTime;

      if (systemMessage) {
        entry.systemMessage = systemMessage;
      }

      log.debug("Queue entry created", {
        entryId: entry.id,
        patientId: entry.patientId || null,
        patientName: entry.patientName,
        dbDurationMs: dbDuration,
      });

      if (dbDuration > 500) {
        log.warn("Slow database operation", {
          operation: "create queue entry",
          durationMs: dbDuration,
          entryId: entry.id,
        });
      }

      if (data.userId) {
        this.preferenceRepository
          .save(data.userId, {
            lastTutorId: entry.patient?.tutorId ?? null,
            lastTutorName: entry.tutorName,
            lastPatientId: entry.patientId ?? null,
            lastPatientName: entry.patientName,
            lastServiceType: entry.serviceType,
            lastPriority: entry.priority,
            lastAssignedVetId: entry.assignedVetId ?? null,
            lastHasAppointment: entry.hasScheduledAppointment ?? false,
            lastSimplesVetId: entry.simplesVetId ?? null,
          })
          .catch((error) => {
            log.warn("Failed to persist queue form preferences", {
              error: error instanceof Error ? error.message : String(error),
              userId: data.userId,
            });
          });
      }

      return entry;
    } catch (error) {
      log.error("Failed to create queue entry", {
        error: error instanceof Error ? error.message : String(error),
        stack: error instanceof Error ? error.stack : undefined,
        patientId: data.patientId || null,
        patientName: cleanedPatientName,
        tutorName: cleanedTutorName,
        serviceType: data.serviceType,
        priority: processed.priority,
        assignedVetId: data.assignedVetId || null,
        hasScheduledAppointment: processed.hasScheduledAppointment,
      });
      throw error;
    }
  }

  async getFormPreference(userId: string): Promise<QueueFormPreference | null> {
    return this.preferenceRepository.findByUserId(userId);
  }

  async saveFormPreference(userId: string, data: {
    lastTutorId?: string | null;
    lastTutorName?: string | null;
    lastPatientId?: string | null;
    lastPatientName?: string | null;
    lastServiceType?: string | null;
    lastPriority?: Priority | null;
    lastAssignedVetId?: string | null;
    lastHasAppointment?: boolean;
    lastSimplesVetId?: string | null;
  }): Promise<QueueFormPreference> {
    return this.preferenceRepository.save(userId, {
      lastTutorId: data.lastTutorId ?? null,
      lastTutorName: data.lastTutorName ?? null,
      lastPatientId: data.lastPatientId ?? null,
      lastPatientName: data.lastPatientName ?? null,
      lastServiceType: data.lastServiceType ?? null,
      lastPriority: data.lastPriority ?? null,
      lastAssignedVetId: data.lastAssignedVetId ?? null,
      lastHasAppointment: data.lastHasAppointment ?? false,
      lastSimplesVetId: data.lastSimplesVetId ?? null,
    });
  }

  async recordFormDraft(
    userId: string,
    data: {
      step: "identify" | "details";
      tutorId?: string | null;
      patientId?: string | null;
      serviceType?: string | null;
      priority?: Priority | null;
      hasScheduledAppointment?: boolean;
      scheduledAt?: Date | null;
    }
  ): Promise<void> {
    log.debug("Queue form draft received", {
      eventType: "QueueFormDraft",
      userId,
      step: data.step,
      tutorId: data.tutorId ?? null,
      patientId: data.patientId ?? null,
      serviceType: data.serviceType ?? null,
      priority: data.priority ?? null,
      hasScheduledAppointment: data.hasScheduledAppointment ?? false,
      scheduledAt: data.scheduledAt ?? null,
    });
  }

  async callNext(vetId?: string, roomId?: string): Promise<QueueEntry | null> {
    log.debug("Calling next patient", { vetId, roomId });

    if (vetId && !roomId) {
      const vet = await this.userRepository.findById(vetId);
      if (!vet?.currentRoomId) {
        log.warn("Vet tried to call without room check-in", { vetId });
        throw new Error("Você deve fazer check-in em uma sala primeiro");
      }
      roomId = vet.currentRoomId;
    }

    if (vetId && roomId) {
      const roomOccupied = await this.repository.getVetInRoom(roomId);
      if (roomOccupied && roomOccupied.vetId !== vetId) {
        log.warn("Room occupied by another vet", { roomId, vetId });
        throw new Error(`Sala já está ocupada por veterinário ${roomOccupied.vetName}`);
      }
    }

    if (!vetId && roomId) {
      const hasVet = await this.repository.hasVetInRoom(roomId);
      if (!hasVet) {
        log.warn("Room has no active vet", { roomId });
        throw new Error("A sala selecionada não possui veterinário ativo");
      }
    }

    const result = await this.repository.callNextWithLock(
      vetId || null,
      roomId,
      new Date()
    );

    if (!result) {
      log.info("No entries available in queue", { vetId: vetId || null, roomId: roomId || null });
      return null;
    }

    const actualVetId = vetId || (result.assignedVetId || undefined);
    this.updateActivityIfNeeded(actualVetId);

    log.info("Patient called", {
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
    log.debug("Calling specific patient", { entryId: id, vetId, roomId });
    const entry = await this.repository.findById(id);

    if (!entry) {
      log.error("Queue entry not found for call", { entryId: id });
      throw new Error("Entrada não encontrada");
    }

    if (entry.status !== Status.WAITING) {
      log.warn("Cannot call patient - invalid status", {
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

    log.info("Patient called (direct)", {
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
    log.debug("Starting service", { entryId: id, userRole });

    if (userRole === Role.RECEPCAO) {
      throw new Error("Recepção não pode iniciar atendimento");
    }

    const entry = await this.repository.findById(id);

    if (!entry) {
      log.error("Queue entry not found", { entryId: id });
      throw new Error("Entrada não encontrada");
    }

    if (entry.status !== Status.CALLED && entry.status !== Status.WAITING) {
      log.warn("Invalid status to start service", { entryId: id, currentStatus: entry.status });
      throw new Error("Apenas entradas chamadas ou aguardando podem iniciar atendimento");
    }

    const oldStatus = entry.status;
    const result = entry.status === Status.WAITING && !entry.calledAt
      ? await this.repository.updateStatus(id, Status.IN_PROGRESS, new Date())
      : await this.repository.updateStatus(id, Status.IN_PROGRESS);

    this.updateActivityIfNeeded(entry.assignedVetId);

    log.info("Service started", {
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
    log.debug("Completing service", { entryId: id, userRole });
    const entry = await this.repository.findById(id);

    if (!entry) {
      log.error("Queue entry not found to complete", { entryId: id });
      throw new Error("Entrada não encontrada");
    }

    if (entry.status === Status.COMPLETED) {
      throw new Error("Atendimento já foi finalizado");
    }

    if (userRole === Role.RECEPCAO && !entry.assignedVetId) {
      throw new Error("Não é possível finalizar atendimento sem veterinário atribuído");
    }

    const oldStatus = entry.status;
    const result = await this.repository.updateStatus(id, Status.COMPLETED, undefined, new Date());

    this.updateActivityIfNeeded(entry.assignedVetId);

    log.info("Service completed", {
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

  async getFinancialEntries(filters?: {
    startDate?: Date;
    endDate?: Date;
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
  }): Promise<{ entries: QueueEntry[]; total: number; page: number; totalPages: number }> {
    return this.repository.listFinancialPaginated(filters);
  }

  async getFinancialSummary(
    startDate: Date,
    endDate: Date,
    filters?: {
      tutorName?: string;
      patientName?: string;
      paymentMethod?: string;
      paymentStatus?: PaymentStatus;
      paymentReceivedById?: string;
      serviceType?: string;
      minAmount?: string;
      maxAmount?: string;
    }
  ): Promise<FinancialSummary> {
    return this.repository.getFinancialSummary(startDate, endDate, filters);
  }

  async getFinancialReports(
    startDate: Date,
    endDate: Date,
    filters?: {
      tutorName?: string;
      patientName?: string;
      paymentMethod?: string;
      paymentStatus?: PaymentStatus;
      paymentReceivedById?: string;
      serviceType?: string;
      minAmount?: string;
      maxAmount?: string;
    }
  ): Promise<FinancialReportData> {
    return this.repository.getFinancialReportData(startDate, endDate, filters);
  }

  async updatePayment(
    id: string,
    data: {
      paymentMethod?: string | null;
      paymentStatus?: PaymentStatus;
      paymentAmount?: string | null;
      paymentReceivedById?: string | null;
      paymentReceivedAt?: Date | null;
      paymentNotes?: string | null;
      paymentHistory?: PaymentHistoryEntry[];
    },
    currentUserId?: string
  ): Promise<QueueEntry> {
    const payload: {
      paymentMethod?: string | null;
      paymentStatus?: PaymentStatus;
      paymentAmount?: string | null;
      paymentReceivedById?: string | null;
      paymentReceivedAt?: Date | null;
      paymentNotes?: string | null;
      paymentHistory?: PaymentHistoryEntry[];
    } = {};

    if (data.paymentMethod !== undefined) {
      payload.paymentMethod = data.paymentMethod;
    }

    let targetStatus = data.paymentStatus;
    if (targetStatus !== undefined) {
      payload.paymentStatus = targetStatus;
    }

    if (data.paymentAmount !== undefined) {
      payload.paymentAmount = data.paymentAmount;
    }

    if (data.paymentNotes !== undefined) {
      payload.paymentNotes = data.paymentNotes;
    }

    if (data.paymentHistory !== undefined) {
      payload.paymentHistory = data.paymentHistory;
    }

    if (targetStatus === PaymentStatus.PAID || targetStatus === PaymentStatus.PARTIAL) {
      payload.paymentReceivedById =
        data.paymentReceivedById !== undefined ? data.paymentReceivedById : currentUserId ?? null;
      payload.paymentReceivedAt =
        data.paymentReceivedAt !== undefined ? data.paymentReceivedAt : new Date();
    } else if (targetStatus === PaymentStatus.PENDING || targetStatus === PaymentStatus.CANCELLED) {
      if (data.paymentReceivedById !== undefined) {
        payload.paymentReceivedById = data.paymentReceivedById;
      } else {
        payload.paymentReceivedById = null;
      }
      payload.paymentReceivedAt =
        data.paymentReceivedAt !== undefined ? data.paymentReceivedAt : null;
    } else {
      if (data.paymentReceivedById !== undefined) {
        payload.paymentReceivedById = data.paymentReceivedById;
      }
      if (data.paymentReceivedAt !== undefined) {
        payload.paymentReceivedAt = data.paymentReceivedAt;
      }
    }

    return this.repository.updatePayment(id, payload);
  }

  private calculateHistoryTotal(history: PaymentHistoryEntry[]): number {
    return history.reduce((acc, record) => acc + Number(record.amount ?? 0), 0);
  }

  async addPaymentEntry(
    id: string,
    data: {
      amount?: number;
      paymentMethod?: string;
      paymentTotal?: number;
      installments?: number | null;
      paymentReceivedAt?: Date | null;
      paymentReceivedById?: string | null;
      paymentNotes?: string | null;
    },
    currentUserId?: string
  ): Promise<QueueEntry> {
    const entry = await this.repository.findById(id);
    if (!entry) {
      throw new Error("Entrada não encontrada");
    }

    const existingHistory = entry.paymentHistory ?? [];
    let history: PaymentHistoryEntry[] = existingHistory;
    let paymentMethodResult = entry.paymentMethod ?? null;
    let paymentReceivedAtResult = entry.paymentReceivedAt ?? null;
    let paymentReceivedByResult = entry.paymentReceivedById ?? null;

    if (data.amount !== undefined) {
      if (!Number.isFinite(data.amount) || data.amount <= 0) {
        throw new Error("Valor do pagamento deve ser maior que zero");
      }

      const createdAt = new Date();
      const receivedAt = data.paymentReceivedAt ?? createdAt;
      const normalizedReceivedAt = receivedAt instanceof Date ? receivedAt : new Date(receivedAt);

      if (Number.isNaN(normalizedReceivedAt.getTime())) {
        throw new Error("Data de pagamento inválida");
      }

      const newRecord: PaymentHistoryEntry = {
        id: randomUUID(),
        amount: data.amount.toFixed(2),
        method: data.paymentMethod ?? entry.paymentMethod ?? "UNSPECIFIED",
        installments: data.installments ?? null,
        receivedAt: normalizedReceivedAt,
        receivedById: data.paymentReceivedById ?? currentUserId ?? null,
        notes: data.paymentNotes ?? null,
        createdAt,
      };

      history = [...existingHistory, newRecord];

      const methods = new Set(history.map((record) => record.method).filter(Boolean));
      paymentMethodResult = methods.size === 1 ? Array.from(methods)[0] : "MULTIPLE";
      paymentReceivedAtResult = newRecord.receivedAt ?? null;
      paymentReceivedByResult = newRecord.receivedById ?? null;
    }

    const totalReceived = this.calculateHistoryTotal(history);
    const totalFormatted = totalReceived.toFixed(2);

    const updatePayload: {
      paymentHistory?: PaymentHistoryEntry[];
      paymentAmount?: string | null;
      paymentMethod?: string | null;
      paymentStatus?: PaymentStatus;
      paymentReceivedAt?: Date | null;
      paymentReceivedById?: string | null;
    } = {
    };

    if (history !== existingHistory) {
      updatePayload.paymentHistory = history;
      updatePayload.paymentMethod = paymentMethodResult;
      updatePayload.paymentReceivedAt = paymentReceivedAtResult;
      updatePayload.paymentReceivedById = paymentReceivedByResult;
    }

    const targetTotal =
      data.paymentTotal !== undefined
        ? data.paymentTotal
        : entry.paymentAmount
          ? Number(entry.paymentAmount)
          : undefined;

    if (data.paymentTotal !== undefined) {
      updatePayload.paymentAmount =
        data.paymentTotal != null ? data.paymentTotal.toFixed(2) : null;
    } else if (history !== existingHistory && (!entry.paymentAmount || Number(entry.paymentAmount) === 0)) {
      updatePayload.paymentAmount = totalFormatted;
    }

    if (entry.paymentStatus === PaymentStatus.CANCELLED) {
      updatePayload.paymentStatus = PaymentStatus.CANCELLED;
    } else if (targetTotal !== undefined && Number.isFinite(targetTotal)) {
      const epsilon = 0.005;
      if (totalReceived >= targetTotal - epsilon) {
        updatePayload.paymentStatus = PaymentStatus.PAID;
      } else if (totalReceived > 0) {
        updatePayload.paymentStatus = PaymentStatus.PARTIAL;
      } else {
        updatePayload.paymentStatus = PaymentStatus.PENDING;
      }
    } else {
      updatePayload.paymentStatus =
        totalReceived > 0 ? PaymentStatus.PARTIAL : PaymentStatus.PENDING;
    }

    return this.repository.updatePayment(id, updatePayload);
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
      simplesVetId?: string | null;
      paymentMethod?: string | null;
    },
    userRole?: string
  ): Promise<QueueEntry> {
    if (userRole !== Role.RECEPCAO && userRole !== Role.ADMIN) {
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
    let systemMessage: string | undefined;

    if (becomesWalkIn) {
      log.info("Scheduled appointment converted to walk-in (late >15min) on update", {
        eventType: "AppointmentConversion",
        entryId: id,
        patientId: entry.patientId || null,
        patientName: entry.patientName,
      });
      systemMessage = "Entrada convertida para encaixe por atraso maior que 15 minutos.";
    }

    log.debug("Updating queue entry", { entryId: id, data });

    try {
      const startTime = Date.now();
      const oldStatus = entry.status;
      const updated = await this.repository.update(id, {
        ...data,
        priority: processed.priority,
        hasScheduledAppointment: processed.hasScheduledAppointment,
        scheduledAt: processed.scheduledAt || undefined,
      });
      const operationDuration = Date.now() - startTime;

      if (systemMessage) {
        updated.systemMessage = systemMessage;
      }

      const updateMeta: any = {
        eventType: "QueueEntryUpdated",
        entryId: id,
        patientId: updated.patientId || null,
        patientName: updated.patientName,
        priority: processed.priority,
        operationDurationMs: operationDuration,
      };

      if (updated.status !== oldStatus) {
        updateMeta.eventType = "StatusTransition";
        updateMeta.oldStatus = oldStatus;
        updateMeta.newStatus = updated.status;
      }

      log.info("Queue entry updated", updateMeta);

      if (operationDuration > 500) {
        log.warn("Slow queue entry update", {
          entryId: id,
          durationMs: operationDuration,
        });
      }

      return updated;
    } catch (error) {
      log.error("Failed to update queue entry", {
        eventType: "QueueEntryUpdateFailed",
        entryId: id,
        error: error instanceof Error ? error.message : String(error),
        stack: error instanceof Error ? error.stack : undefined,
        inputData: data
      });
      throw error;
    }
  }
}
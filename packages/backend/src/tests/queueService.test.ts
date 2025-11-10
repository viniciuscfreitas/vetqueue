import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { PaymentStatus, Priority, QueueEntry, Role, Status } from "../core/types";
import { QueueRepository } from "../repositories/queueRepository";
import { QueueService } from "../services/queueService";

class InMemoryQueueRepository implements Partial<QueueRepository> {
  private entries = new Map<string, QueueEntry>();
  private counter = 0;

  private getCurrentDayWindow(now: Date = new Date()) {
    // Mirror repository logic: relies on server local timezone.
    const startOfDay = new Date(now);
    startOfDay.setHours(0, 0, 0, 0);

    const endOfDay = new Date(now);
    endOfDay.setHours(23, 59, 59, 999);

    return { startOfDay, endOfDay };
  }

  private isActiveOrCompletedToday(entry: QueueEntry, now = new Date()) {
    if ([Status.WAITING, Status.CALLED, Status.IN_PROGRESS].includes(entry.status)) {
      return true;
    }

    if (entry.status !== Status.COMPLETED) {
      return false;
    }

    if (entry.paymentStatus === PaymentStatus.PAID) {
      return false;
    }

    if (!entry.completedAt) {
      return false;
    }

    const { startOfDay, endOfDay } = this.getCurrentDayWindow(now);
    const completedAtTime = entry.completedAt.getTime();
    return completedAtTime >= startOfDay.getTime() && completedAtTime <= endOfDay.getTime();
  }

  private orderEntries(entries: QueueEntry[]) {
    return [...entries].sort((a, b) => {
      if (a.priority !== b.priority) {
        return a.priority - b.priority;
      }
      return a.createdAt.getTime() - b.createdAt.getTime();
    });
  }

  async create(data: Parameters<QueueRepository["create"]>[0]): Promise<QueueEntry> {
    const entry: QueueEntry = {
      id: `entry-${++this.counter}`,
      patientName: data.patientName,
      tutorName: data.tutorName,
      serviceType: data.serviceType,
      priority: data.priority,
      status: Status.WAITING,
      createdAt: new Date(),
      calledAt: null,
      completedAt: null,
      assignedVetId: data.assignedVetId ?? null,
      assignedVet: null,
      roomId: null,
      room: null,
      hasScheduledAppointment: data.hasScheduledAppointment ?? false,
      scheduledAt: data.scheduledAt ?? null,
      patientId: data.patientId ?? null,
      patient: null,
      simplesVetId: data.simplesVetId ?? null,
      paymentMethod: data.paymentMethod ?? null,
      paymentStatus: data.paymentStatus ?? PaymentStatus.PENDING,
      paymentAmount: data.paymentAmount ?? null,
      paymentReceivedById: data.paymentReceivedById ?? null,
      paymentReceivedBy: null,
      paymentReceivedAt: data.paymentReceivedAt ?? null,
      paymentNotes: data.paymentNotes ?? null,
      paymentHistory: data.paymentHistory ?? [],
    };

    this.entries.set(entry.id, entry);
    return entry;
  }

  async findById(id: string): Promise<QueueEntry | null> {
    return this.entries.get(id) ?? null;
  }

  async update(id: string, data: Parameters<QueueRepository["update"]>[1]): Promise<QueueEntry> {
    const existing = this.entries.get(id);
    if (!existing) {
      throw new Error("Entry not found");
    }

    const updated: QueueEntry = {
      ...existing,
      ...data,
      assignedVetId: data.assignedVetId !== undefined ? data.assignedVetId : existing.assignedVetId,
      hasScheduledAppointment:
        data.hasScheduledAppointment !== undefined ? data.hasScheduledAppointment : existing.hasScheduledAppointment,
      scheduledAt: data.scheduledAt !== undefined ? data.scheduledAt ?? null : existing.scheduledAt ?? null,
      patientId: data.patientId !== undefined ? data.patientId : existing.patientId,
      simplesVetId: data.simplesVetId !== undefined ? data.simplesVetId : existing.simplesVetId,
      paymentMethod: data.paymentMethod !== undefined ? data.paymentMethod : existing.paymentMethod,
    };

    this.entries.set(id, updated);
    return updated;
  }

  async updatePayment(id: string, data: Parameters<QueueRepository["updatePayment"]>[1]): Promise<QueueEntry> {
    const existing = this.entries.get(id);
    if (!existing) {
      throw new Error("Entry not found");
    }

    const updated: QueueEntry = {
      ...existing,
      paymentMethod: data.paymentMethod !== undefined ? data.paymentMethod : existing.paymentMethod,
      paymentStatus: data.paymentStatus !== undefined ? data.paymentStatus : existing.paymentStatus,
      paymentAmount: data.paymentAmount !== undefined ? data.paymentAmount : existing.paymentAmount,
      paymentReceivedById:
        data.paymentReceivedById !== undefined ? data.paymentReceivedById : existing.paymentReceivedById ?? null,
      paymentReceivedAt:
        data.paymentReceivedAt !== undefined ? data.paymentReceivedAt : existing.paymentReceivedAt ?? null,
      paymentNotes: data.paymentNotes !== undefined ? data.paymentNotes : existing.paymentNotes,
      paymentHistory: data.paymentHistory !== undefined ? data.paymentHistory : existing.paymentHistory ?? [],
    };

    this.entries.set(id, updated);
    return updated;
  }

  async updateStatus(
    id: string,
    status: Status,
    calledAt?: Date,
    completedAt?: Date,
    roomId?: string
  ): Promise<QueueEntry> {
    const existing = this.entries.get(id);
    if (!existing) {
      throw new Error("Entry not found");
    }

    const updated: QueueEntry = {
      ...existing,
      status,
      ...(calledAt !== undefined ? { calledAt } : {}),
      ...(completedAt !== undefined ? { completedAt } : {}),
      ...(roomId !== undefined
        ? {
            roomId,
            room: roomId ? { id: roomId, name: `Sala ${roomId}`, isActive: true, createdAt: new Date() } : null,
          }
        : {}),
    };

    this.entries.set(id, updated);
    return updated;
  }

  async listActive(): Promise<QueueEntry[]> {
    const now = new Date();
    const entries = Array.from(this.entries.values()).filter((entry) =>
      this.isActiveOrCompletedToday(entry, now)
    );
    return this.orderEntries(entries);
  }

  async listActiveByVet(assignedVetId: string): Promise<QueueEntry[]> {
    const now = new Date();
    const entries = Array.from(this.entries.values()).filter(
      (entry) =>
        this.isActiveOrCompletedToday(entry, now) &&
        (entry.assignedVetId === assignedVetId || entry.assignedVetId === null)
    );
    return this.orderEntries(entries);
  }

  async listActiveGeneral(): Promise<QueueEntry[]> {
    const now = new Date();
    const entries = Array.from(this.entries.values()).filter(
      (entry) => this.isActiveOrCompletedToday(entry, now) && entry.assignedVetId === null
    );
    return this.orderEntries(entries);
  }
}

const buildService = () => {
  const repository = new InMemoryQueueRepository();
  const service = new QueueService(repository as unknown as QueueRepository);
  return { repository, service };
};

describe("QueueService critical flows", () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2025-01-01T15:00:00.000Z"));
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("converts agendamento atrasado em atendimento presencial", async () => {
    const { service } = buildService();
    const scheduledAt = new Date("2025-01-01T14:30:00.000Z");

    const entry = await service.addToQueue({
      patientName: "Rex",
      tutorName: "João",
      serviceType: "CONSULTA",
      priority: Priority.NORMAL,
      hasScheduledAppointment: true,
      scheduledAt,
    });

    expect(entry.hasScheduledAppointment).toBe(false);
    expect(entry.scheduledAt).toBeNull();
  });

  it("mantém agendamento quando dentro da tolerância", async () => {
    const { service } = buildService();
    const scheduledAt = new Date("2025-01-01T15:10:00.000Z");

    const entry = await service.addToQueue({
      patientName: "Luna",
      tutorName: "Maria",
      serviceType: "VACINACAO",
      priority: Priority.HIGH,
      hasScheduledAppointment: true,
      scheduledAt,
    });

    expect(entry.hasScheduledAppointment).toBe(true);
    expect(entry.scheduledAt?.toISOString()).toBe(scheduledAt.toISOString());
  });

  it("recusa cadastro quando campos obrigatórios estão vazios", async () => {
    const { service } = buildService();

    await expect(async () =>
      service.addToQueue({
        patientName: "   ",
        tutorName: "",
        serviceType: "CONSULTA",
        priority: Priority.NORMAL,
      })
    ).rejects.toThrowError(/Nome do paciente é obrigatório/);
  });

  it("preenche dados de pagamento automaticamente quando marcado como pago", async () => {
    const { service, repository } = buildService();
    const entry = await service.addToQueue({
      patientName: "Milo",
      tutorName: "Paula",
      serviceType: "CONSULTA",
      priority: Priority.NORMAL,
    });

    const updated = await service.updatePayment(entry.id, {
      paymentStatus: PaymentStatus.PAID,
      paymentAmount: "150.00",
    }, "user-123");

    expect(updated.paymentStatus).toBe(PaymentStatus.PAID);
    expect(updated.paymentReceivedById).toBe("user-123");
    expect(updated.paymentReceivedAt).toBeInstanceOf(Date);

    const stored = await repository.findById(entry.id);
    expect(stored?.paymentAmount).toBe("150.00");
  });

  it("permite apenas recepção ou admin atualizar atendimento", async () => {
    const { service } = buildService();
    const entry = await service.addToQueue({
      patientName: "Thor",
      tutorName: "Clara",
      serviceType: "CONSULTA",
      priority: Priority.NORMAL,
    });

    await expect(
      service.updateEntry(entry.id, { tutorName: "Clara Atualizada" }, Role.VET)
    ).rejects.toThrowError(/Apenas recepção pode editar atendimentos/);

    const updated = await service.updateEntry(entry.id, { tutorName: "Clara Atualizada" }, Role.ADMIN);
    expect(updated.tutorName).toBe("Clara Atualizada");
  });

  it("mantém atendimento concluído não pago na lista ativa até que seja pago", async () => {
    const { service } = buildService();
    const entry = await service.addToQueue({
      patientName: "Dexter",
      tutorName: "Helena",
      serviceType: "CONSULTA",
      priority: Priority.NORMAL,
    });

    await service.completeService(entry.id, Role.ADMIN);

    let activeEntries = await service.listActive();
    expect(activeEntries.map((item) => item.id)).toContain(entry.id);

    await service.updatePayment(entry.id, { paymentStatus: PaymentStatus.PAID }, "cashier-1");

    activeEntries = await service.listActive();
    expect(activeEntries.map((item) => item.id)).not.toContain(entry.id);
  });

  it("remove atendimento concluído não pago da lista ativa após virada do dia", async () => {
    const { service } = buildService();
    const entry = await service.addToQueue({
      patientName: "Luka",
      tutorName: "Renata",
      serviceType: "CONSULTA",
      priority: Priority.NORMAL,
    });

    await service.completeService(entry.id, Role.ADMIN);

    let activeEntries = await service.listActive();
    expect(activeEntries.map((item) => item.id)).toContain(entry.id);

    vi.setSystemTime(new Date("2025-01-02T09:00:00.000Z"));

    activeEntries = await service.listActive();
    expect(activeEntries.map((item) => item.id)).not.toContain(entry.id);
  });

  it("acumula pagamentos parciais registrando histórico e status", async () => {
    const { service, repository } = buildService();
    const entry = await service.addToQueue({
      patientName: "Bob",
      tutorName: "Eva",
      serviceType: "CONSULTA",
      priority: Priority.NORMAL,
    });

    const first = await service.addPaymentEntry(
      entry.id,
      {
        amount: "50",
        paymentMethod: "PIX",
      },
      "cashier-1",
    );

    expect(first.paymentAmount).toBe("50.00");
    expect(first.paymentStatus).toBe(PaymentStatus.PARTIAL);
    expect(first.paymentMethod).toBe("PIX");
    expect(first.paymentHistory).toHaveLength(1);
    expect(first.paymentHistory?.[0].receivedById).toBe("cashier-1");

    const second = await service.addPaymentEntry(
      entry.id,
      {
        amount: "30",
        paymentMethod: "CASH",
        paymentNotes: "Entrada parcial",
      },
      "cashier-2",
    );

    expect(second.paymentAmount).toBe("80.00");
    expect(second.paymentStatus).toBe(PaymentStatus.PARTIAL);
    expect(second.paymentMethod).toBe("MULTIPLE");
    expect(second.paymentHistory).toHaveLength(2);
    expect(second.paymentHistory?.[1].notes).toBe("Entrada parcial");

    const stored = await repository.findById(entry.id);
    expect(stored?.paymentHistory).toHaveLength(2);
  });
});


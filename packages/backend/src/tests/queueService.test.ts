import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { PaymentStatus, Priority, QueueEntry, Status } from "../core/types";
import { QueueRepository } from "../repositories/queueRepository";
import { QueueService } from "../services/queueService";

class InMemoryQueueRepository implements Partial<QueueRepository> {
  private entries = new Map<string, QueueEntry>();
  private counter = 0;

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
    };

    this.entries.set(id, updated);
    return updated;
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

    expect(entry.hasScheduledApepointment).toBe(true);
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
    ).rejects.toThrowError(/Nome do paciente e tutor são obrigatórios/);
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
});


import { Prisma, QueueEntry as PrismaQueueEntry } from "@prisma/client";
import { QueueEntry, Priority, Status, User, Role, Patient, PaymentStatus } from "../core/types";
import { prisma } from "../lib/prisma";

function mapPrismaToDomain(entry: PrismaQueueEntry & {
  assignedVet?: { id: string; username: string; name: string; role: string; createdAt: Date } | null;
  room?: { id: string; name: string; isActive: boolean; createdAt: Date } | null;
  patient?: { id: string; name: string; species: string | null; breed: string | null; birthDate: Date | null; gender: string | null; tutorName: string; tutorPhone: string | null; tutorEmail: string | null; notes: string | null; createdAt: Date; updatedAt: Date } | null;
  paymentReceivedBy?: { id: string; username: string; name: string; role: string; createdAt: Date } | null;
}): QueueEntry {
  return {
    id: entry.id,
    patientName: entry.patientName,
    tutorName: entry.tutorName,
    serviceType: entry.serviceType,
    priority: entry.priority as Priority,
    status: entry.status as Status,
    createdAt: entry.createdAt,
    calledAt: entry.calledAt,
    completedAt: entry.completedAt,
    assignedVetId: entry.assignedVetId,
    assignedVet: entry.assignedVet ? {
      id: entry.assignedVet.id,
      username: entry.assignedVet.username,
      name: entry.assignedVet.name,
      role: entry.assignedVet.role as Role,
      createdAt: entry.assignedVet.createdAt,
    } : null,
    roomId: entry.roomId,
    room: entry.room ? {
      id: entry.room.id,
      name: entry.room.name,
      isActive: entry.room.isActive,
      createdAt: entry.room.createdAt,
    } : null,
    hasScheduledAppointment: entry.hasScheduledAppointment,
    scheduledAt: entry.scheduledAt,
    patientId: entry.patientId,
    simplesVetId: entry.simplesVetId || null,
    paymentMethod: entry.paymentMethod || null,
    paymentStatus: (entry.paymentStatus as PaymentStatus) || PaymentStatus.PENDING,
    paymentAmount: entry.paymentAmount ? entry.paymentAmount.toString() : null,
    paymentReceivedById: entry.paymentReceivedById || null,
    paymentReceivedBy: entry.paymentReceivedBy
      ? {
          id: entry.paymentReceivedBy.id,
          username: entry.paymentReceivedBy.username,
          name: entry.paymentReceivedBy.name,
          role: entry.paymentReceivedBy.role as Role,
          createdAt: entry.paymentReceivedBy.createdAt,
        }
      : null,
    paymentReceivedAt: entry.paymentReceivedAt || null,
    paymentNotes: entry.paymentNotes || null,
    patient: entry.patient ? {
      id: entry.patient.id,
      name: entry.patient.name,
      species: entry.patient.species,
      breed: entry.patient.breed,
      birthDate: entry.patient.birthDate,
      gender: entry.patient.gender,
      tutorName: entry.patient.tutorName,
      tutorPhone: entry.patient.tutorPhone,
      tutorEmail: entry.patient.tutorEmail,
      notes: entry.patient.notes,
      createdAt: entry.patient.createdAt,
      updatedAt: entry.patient.updatedAt,
    } : null,
  };
}

export class QueueRepository {
  async create(data: {
    patientName: string;
    tutorName: string;
    serviceType: string;
    priority: Priority;
    assignedVetId?: string;
    hasScheduledAppointment?: boolean;
    scheduledAt?: Date;
    patientId?: string;
    simplesVetId?: string;
    paymentMethod?: string;
    paymentStatus?: PaymentStatus;
    paymentAmount?: string;
    paymentReceivedById?: string;
    paymentReceivedAt?: Date;
    paymentNotes?: string;
  }): Promise<QueueEntry> {
    let patientName = data.patientName;
    let tutorName = data.tutorName;

    if (data.patientId) {
      const patient = await prisma.patient.findUnique({
        where: { id: data.patientId },
      });
      if (patient) {
        patientName = patient.name;
        tutorName = patient.tutorName;
      }
    }

    const entry = await prisma.queueEntry.create({
      data: {
        patientName,
        tutorName,
        serviceType: data.serviceType,
        priority: data.priority,
        status: Status.WAITING,
        assignedVetId: data.assignedVetId,
        hasScheduledAppointment: data.hasScheduledAppointment ?? false,
        scheduledAt: data.scheduledAt,
        patientId: data.patientId,
        simplesVetId: data.simplesVetId,
        paymentMethod: data.paymentMethod,
        paymentStatus: data.paymentStatus ?? PaymentStatus.PENDING,
        paymentAmount: data.paymentAmount !== undefined ? new Prisma.Decimal(data.paymentAmount) : undefined,
        paymentReceivedById: data.paymentReceivedById,
        paymentReceivedAt: data.paymentReceivedAt,
        paymentNotes: data.paymentNotes,
      },
      include: { assignedVet: true, room: true, patient: true, paymentReceivedBy: true },
    });
    return mapPrismaToDomain(entry);
  }

  async findById(id: string): Promise<QueueEntry | null> {
    const entry = await prisma.queueEntry.findUnique({
      where: { id },
      include: { assignedVet: true, room: true, patient: true, paymentReceivedBy: true },
    });
    return entry ? mapPrismaToDomain(entry) : null;
  }

  async findNextWaiting(assignedVetId?: string | null): Promise<QueueEntry | null> {
    const whereClause: any = {
      status: Status.WAITING,
    };

    if (assignedVetId) {
      whereClause.OR = [
        { assignedVetId: assignedVetId },
        { assignedVetId: null }
      ];
    } else {
      whereClause.assignedVetId = null;
    }

    const entry = await prisma.queueEntry.findFirst({
      where: whereClause,
      include: { assignedVet: true, room: true, patient: true, paymentReceivedBy: true },
      orderBy: [
        { priority: "asc" },
        { createdAt: "asc" },
      ],
    });
    return entry ? mapPrismaToDomain(entry) : null;
  }

  async findNextWaitingGeneral(): Promise<QueueEntry | null> {
    const entry = await prisma.queueEntry.findFirst({
      where: {
        status: Status.WAITING,
        assignedVetId: null,
      },
      include: { assignedVet: true, room: true, patient: true, paymentReceivedBy: true },
      orderBy: [
        { priority: "asc" },
        { createdAt: "asc" },
      ],
    });
    return entry ? mapPrismaToDomain(entry) : null;
  }

  async updateStatus(
    id: string,
    status: Status,
    calledAt?: Date,
    completedAt?: Date,
    roomId?: string
  ): Promise<QueueEntry> {
    const data: Prisma.QueueEntryUpdateInput = { status };
    if (calledAt !== undefined) {
      data.calledAt = calledAt;
    }
    if (completedAt !== undefined) {
      data.completedAt = completedAt;
    }
    if (roomId !== undefined) {
      data.room = roomId ? { connect: { id: roomId } } : { disconnect: true };
    }
    const entry = await prisma.queueEntry.update({
      where: { id },
      data,
      include: { assignedVet: true, room: true, patient: true, paymentReceivedBy: true },
    });
    return mapPrismaToDomain(entry);
  }

  async updateAssignedVet(
    id: string,
    assignedVetId: string
  ): Promise<QueueEntry> {
    const entry = await prisma.queueEntry.update({
      where: { id },
      data: { assignedVetId },
      include: { assignedVet: true, room: true, patient: true, paymentReceivedBy: true },
    });
    return mapPrismaToDomain(entry);
  }

  async callNextWithLock(
    vetId?: string | null,
    roomId?: string,
    calledAt?: Date
  ): Promise<QueueEntry | null> {
    return await prisma.$transaction(async (tx) => {
      const whereClause: any = {
        status: Status.WAITING,
      };

      if (vetId) {
        whereClause.OR = [
          { assignedVetId: vetId },
          { assignedVetId: null }
        ];
      } else {
        whereClause.assignedVetId = null;
      }

      const entry = await tx.queueEntry.findFirst({
        where: whereClause,
        include: { assignedVet: true, room: true, patient: true, paymentReceivedBy: true },
        orderBy: [
          { priority: "asc" },
          { createdAt: "asc" },
        ],
      });

      if (!entry || entry.status !== Status.WAITING) {
        return null;
      }

      const updateData: Prisma.QueueEntryUpdateInput = {
        status: Status.CALLED,
        calledAt: calledAt || new Date(),
      };

      if (roomId) {
        updateData.room = { connect: { id: roomId } };
      }

      const updated = await tx.queueEntry.update({
        where: { id: entry.id },
        data: updateData,
        include: { assignedVet: true, room: true, patient: true, paymentReceivedBy: true },
      });

      if (vetId && !entry.assignedVetId) {
        const withVet = await tx.queueEntry.update({
          where: { id: entry.id },
          data: { assignedVetId: vetId },
          include: { assignedVet: true, room: true, patient: true, paymentReceivedBy: true },
        });
        return mapPrismaToDomain(withVet);
      }

      return mapPrismaToDomain(updated);
    });
  }

  async callPatientWithLock(
    id: string,
    vetId?: string,
    roomId?: string,
    calledAt?: Date
  ): Promise<QueueEntry> {
    return await prisma.$transaction(async (tx) => {
      const entry = await tx.queueEntry.findUnique({
        where: { id },
        include: { assignedVet: true, room: true, patient: true, paymentReceivedBy: true },
      });

      if (!entry) {
        throw new Error("Entrada não encontrada");
      }

      if (entry.status !== Status.WAITING) {
        throw new Error("Apenas pacientes aguardando podem ser chamados");
      }

      const updateData: Prisma.QueueEntryUpdateInput = {
        status: Status.CALLED,
        calledAt: calledAt || new Date(),
      };

      if (roomId) {
        updateData.room = { connect: { id: roomId } };
      }

      const updated = await tx.queueEntry.update({
        where: { id },
        data: updateData,
        include: { assignedVet: true, room: true, patient: true, paymentReceivedBy: true },
      });

      if (vetId && !entry.assignedVetId) {
        const withVet = await tx.queueEntry.update({
          where: { id },
          data: { assignedVetId: vetId },
          include: { assignedVet: true, room: true, patient: true, paymentReceivedBy: true },
        });
        return mapPrismaToDomain(withVet);
      }

      return mapPrismaToDomain(updated);
    });
  }

  async listActive(): Promise<QueueEntry[]> {
    const entries = await prisma.queueEntry.findMany({
      where: {
        status: {
          in: [Status.WAITING, Status.CALLED, Status.IN_PROGRESS],
        },
      },
      include: { assignedVet: true, room: true, patient: true, paymentReceivedBy: true },
      orderBy: [
        { priority: "asc" },
        { createdAt: "asc" },
      ],
    });
    return entries.map(mapPrismaToDomain);
  }

  async listActiveByVet(assignedVetId: string): Promise<QueueEntry[]> {
    const entries = await prisma.queueEntry.findMany({
      where: {
        status: {
          in: [Status.WAITING, Status.CALLED, Status.IN_PROGRESS],
        },
        OR: [
          { assignedVetId: assignedVetId },
          { assignedVetId: null }
        ]
      },
      include: { assignedVet: true, room: true, patient: true, paymentReceivedBy: true },
      orderBy: [
        { priority: "asc" },
        { createdAt: "asc" },
      ],
    });
    return entries.map(mapPrismaToDomain);
  }

  async listActiveGeneral(): Promise<QueueEntry[]> {
    const entries = await prisma.queueEntry.findMany({
      where: {
        status: {
          in: [Status.WAITING, Status.CALLED, Status.IN_PROGRESS],
        },
        assignedVetId: null,
      },
      include: { assignedVet: true, room: true, patient: true, paymentReceivedBy: true },
      orderBy: [
        { priority: "asc" },
        { createdAt: "asc" },
      ],
    });
    return entries.map(mapPrismaToDomain);
  }

  async listCompleted(filters?: {
    startDate?: Date;
    endDate?: Date;
    tutorName?: string;
    patientName?: string;
    serviceType?: string;
  }): Promise<QueueEntry[]> {
    const where: Prisma.QueueEntryWhereInput = {
      status: Status.COMPLETED,
    };

    if (filters?.startDate || filters?.endDate) {
      where.completedAt = {};
      if (filters.startDate) {
        where.completedAt.gte = filters.startDate;
      }
      if (filters.endDate) {
        where.completedAt.lte = filters.endDate;
      }
    }

    if (filters?.tutorName) {
      where.tutorName = {
        contains: filters.tutorName,
        mode: "insensitive",
      };
    }

    if (filters?.patientName) {
      where.patientName = {
        contains: filters.patientName,
        mode: "insensitive",
      };
    }

    if (filters?.serviceType) {
      where.serviceType = { contains: filters.serviceType, mode: "insensitive" };
    }

    const entries = await prisma.queueEntry.findMany({
      where,
      include: { assignedVet: true, room: true, patient: true, paymentReceivedBy: true },
      orderBy: { completedAt: "desc" },
    });
    return entries.map(mapPrismaToDomain);
  }

  async listCompletedPaginated(filters?: {
    startDate?: Date;
    endDate?: Date;
    tutorName?: string;
    patientName?: string;
    serviceType?: string;
    page?: number;
    limit?: number;
  }): Promise<{ entries: QueueEntry[]; total: number; page: number; totalPages: number }> {
    const page = filters?.page || 1;
    const limit = filters?.limit || 20;
    const skip = (page - 1) * limit;

    const where: Prisma.QueueEntryWhereInput = {
      status: Status.COMPLETED,
    };

    if (filters?.startDate || filters?.endDate) {
      where.completedAt = {};
      if (filters.startDate) {
        where.completedAt.gte = filters.startDate;
      }
      if (filters.endDate) {
        where.completedAt.lte = filters.endDate;
      }
    }

    if (filters?.tutorName) {
      where.tutorName = {
        contains: filters.tutorName,
        mode: "insensitive",
      };
    }

    if (filters?.patientName) {
      where.patientName = {
        contains: filters.patientName,
        mode: "insensitive",
      };
    }

    if (filters?.serviceType) {
      where.serviceType = { contains: filters.serviceType, mode: "insensitive" };
    }

    const [entries, total] = await Promise.all([
      prisma.queueEntry.findMany({
        where,
        include: { assignedVet: true, room: true, patient: true, paymentReceivedBy: true },
        orderBy: { completedAt: "desc" },
        skip,
        take: limit,
      }),
      prisma.queueEntry.count({ where }),
    ]);

    const totalPages = Math.ceil(total / limit);

    return {
      entries: entries.map(mapPrismaToDomain),
      total,
      page,
      totalPages,
    };
  }

  async listFinancialPaginated(filters?: {
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
    const page = filters?.page || 1;
    const limit = filters?.limit || 20;
    const skip = (page - 1) * limit;

    const where: Prisma.QueueEntryWhereInput = {
      status: Status.COMPLETED,
    };

    if (filters?.startDate || filters?.endDate) {
      where.completedAt = {};
      if (filters.startDate) {
        where.completedAt.gte = filters.startDate;
      }
      if (filters.endDate) {
        where.completedAt.lte = filters.endDate;
      }
    }

    if (filters?.tutorName) {
      where.tutorName = {
        contains: filters.tutorName,
        mode: "insensitive",
      };
    }

    if (filters?.patientName) {
      where.patientName = {
        contains: filters.patientName,
        mode: "insensitive",
      };
    }

    if (filters?.paymentMethod) {
      where.paymentMethod = filters.paymentMethod;
    }

    if (filters?.paymentStatus) {
      where.paymentStatus = filters.paymentStatus;
    }

    if (filters?.paymentReceivedById) {
      where.paymentReceivedById = filters.paymentReceivedById;
    }

    if (filters?.serviceType) {
      where.serviceType = { contains: filters.serviceType, mode: "insensitive" };
    }

    if (filters?.minAmount || filters?.maxAmount) {
      const amountFilter: Prisma.DecimalNullableFilter = {};
      if (filters.minAmount) {
        amountFilter.gte = new Prisma.Decimal(filters.minAmount);
      }
      if (filters.maxAmount) {
        amountFilter.lte = new Prisma.Decimal(filters.maxAmount);
      }
      where.paymentAmount = amountFilter;
    }

    const [entries, total] = await Promise.all([
      prisma.queueEntry.findMany({
        where,
        include: { assignedVet: true, room: true, patient: true, paymentReceivedBy: true },
        orderBy: { completedAt: "desc" },
        skip,
        take: limit,
      }),
      prisma.queueEntry.count({ where }),
    ]);

    const totalPages = Math.ceil(total / limit);

    return {
      entries: entries.map(mapPrismaToDomain),
      total,
      page,
      totalPages,
    };
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
  ) {
    const where: Prisma.QueueEntryWhereInput = {
      status: Status.COMPLETED,
      completedAt: {
        gte: startDate,
        lte: endDate,
      },
    };

    if (filters?.tutorName) {
      where.tutorName = { contains: filters.tutorName, mode: "insensitive" };
    }

    if (filters?.patientName) {
      where.patientName = { contains: filters.patientName, mode: "insensitive" };
    }

    if (filters?.paymentMethod) {
      where.paymentMethod = filters.paymentMethod;
    }

    if (filters?.paymentStatus) {
      where.paymentStatus = filters.paymentStatus;
    }

    if (filters?.paymentReceivedById) {
      where.paymentReceivedById = filters.paymentReceivedById;
    }

    if (filters?.serviceType) {
      where.serviceType = { contains: filters.serviceType, mode: "insensitive" };
    }

    if (filters?.minAmount || filters?.maxAmount) {
      const amountFilter: Prisma.DecimalNullableFilter = {};
      if (filters.minAmount) {
        amountFilter.gte = new Prisma.Decimal(filters.minAmount);
      }
      if (filters.maxAmount) {
        amountFilter.lte = new Prisma.Decimal(filters.maxAmount);
      }
      where.paymentAmount = amountFilter;
    }

    const entries = await prisma.queueEntry.findMany({
      where,
      select: {
        paymentMethod: true,
        paymentStatus: true,
        paymentAmount: true,
        hasScheduledAppointment: true,
        paymentReceivedById: true,
      },
    });

    const zero = new Prisma.Decimal(0);
    const byPaymentMethod: Record<string, { count: number; amount: Prisma.Decimal }> = {};
    const byStatus: Record<PaymentStatus, { count: number; amount: Prisma.Decimal }> = {
      PENDING: { count: 0, amount: zero },
      PARTIAL: { count: 0, amount: zero },
      PAID: { count: 0, amount: zero },
      CANCELLED: { count: 0, amount: zero },
    };

    let totalAmount = zero;
    let totalPending = zero;
    let totalPartial = zero;
    let totalPaid = zero;
    let scheduledCount = 0;
    let walkInCount = 0;

    entries.forEach((entry) => {
      const method = entry.paymentMethod || "NÃO_INFORMADO";
      const status = entry.paymentStatus as PaymentStatus;
      const amount = entry.paymentAmount ?? zero;

      if (!byPaymentMethod[method]) {
        byPaymentMethod[method] = { count: 0, amount: zero };
      }
      byPaymentMethod[method] = {
        count: byPaymentMethod[method].count + 1,
        amount: byPaymentMethod[method].amount.plus(amount),
      };

      if (byStatus[status]) {
        byStatus[status] = {
          count: byStatus[status].count + 1,
          amount: byStatus[status].amount.plus(amount),
        };
      }

      if (status === PaymentStatus.PAID) {
        totalPaid = totalPaid.plus(amount);
      } else if (status === PaymentStatus.PARTIAL) {
        totalPartial = totalPartial.plus(amount);
      } else if (status === PaymentStatus.PENDING) {
        totalPending = totalPending.plus(amount);
      }

      totalAmount = totalAmount.plus(amount);

      if (entry.hasScheduledAppointment) {
        scheduledCount += 1;
      } else {
        walkInCount += 1;
      }
    });

    const serializeDecimal = (value: Prisma.Decimal) => value.toFixed(2);

    const serializedByPaymentMethod = Object.fromEntries(
      Object.entries(byPaymentMethod).map(([method, data]) => [
        method,
        { count: data.count, amount: serializeDecimal(data.amount) },
      ]),
    );

    const serializedByStatus = Object.fromEntries(
      Object.entries(byStatus).map(([status, data]) => [
        status,
        { count: data.count, amount: serializeDecimal(data.amount) },
      ]),
    ) as Record<PaymentStatus, { count: number; amount: string }>;

    return {
      totalEntries: entries.length,
      totals: {
        amount: serializeDecimal(totalAmount),
        paid: serializeDecimal(totalPaid),
        partial: serializeDecimal(totalPartial),
        pending: serializeDecimal(totalPending),
      },
      byPaymentMethod: serializedByPaymentMethod,
      byStatus: serializedByStatus,
      walkIns: walkInCount,
      scheduled: scheduledCount,
      receivedEntries: entries.filter((e) => e.paymentReceivedById).length,
    };
  }

  async getFinancialReportData(
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
  ) {
    const where: Prisma.QueueEntryWhereInput = {
      status: Status.COMPLETED,
      completedAt: {
        gte: startDate,
        lte: endDate,
      },
    };

    if (filters?.tutorName) {
      where.tutorName = { contains: filters.tutorName, mode: "insensitive" };
    }

    if (filters?.patientName) {
      where.patientName = { contains: filters.patientName, mode: "insensitive" };
    }

    if (filters?.paymentMethod) {
      where.paymentMethod = filters.paymentMethod;
    }

    if (filters?.paymentStatus) {
      where.paymentStatus = filters.paymentStatus;
    }

    if (filters?.paymentReceivedById) {
      where.paymentReceivedById = filters.paymentReceivedById;
    }

    if (filters?.serviceType) {
      where.serviceType = { contains: filters.serviceType, mode: "insensitive" };
    }

    if (filters?.minAmount || filters?.maxAmount) {
      const amountFilter: Prisma.DecimalNullableFilter = {};
      if (filters.minAmount) {
        amountFilter.gte = new Prisma.Decimal(filters.minAmount);
      }
      if (filters.maxAmount) {
        amountFilter.lte = new Prisma.Decimal(filters.maxAmount);
      }
      where.paymentAmount = amountFilter;
    }

    const entries = await prisma.queueEntry.findMany({
      where,
      select: {
        id: true,
        patientName: true,
        tutorName: true,
        serviceType: true,
        paymentStatus: true,
        paymentAmount: true,
        paymentReceivedAt: true,
        paymentReceivedBy: {
          select: {
            id: true,
            name: true,
          },
        },
        paymentNotes: true,
        completedAt: true,
      },
      orderBy: { completedAt: "desc" },
    });

    const zero = new Prisma.Decimal(0);

    const revenueByDayMap = new Map<string, { amount: Prisma.Decimal; count: number }>();
    const revenueByServiceMap = new Map<string, { amount: Prisma.Decimal; count: number }>();
    const revenueByReceiverMap = new Map<string | null, { id: string | null; name: string; amount: Prisma.Decimal; count: number }>();
    const pendingPayments: Array<{
      id: string;
      patientName: string;
      tutorName: string;
      serviceType: string;
      paymentStatus: PaymentStatus;
      paymentAmount: string | null;
      completedAt: Date | null;
      paymentNotes: string | null;
    }> = [];

    entries.forEach((entry) => {
      const amountDecimal = entry.paymentAmount ?? zero;
      const status = entry.paymentStatus as PaymentStatus;
      const amount = amountDecimal;

      const serviceKey = entry.serviceType || "NÃO_INFORMADO";
      const serviceAggregate = revenueByServiceMap.get(serviceKey) || { amount: zero, count: 0 };
      revenueByServiceMap.set(serviceKey, {
        amount: serviceAggregate.amount.plus(amount),
        count: serviceAggregate.count + 1,
      });

      if (status === PaymentStatus.PAID || status === PaymentStatus.PARTIAL) {
        if (entry.paymentReceivedAt) {
          const dateKey = entry.paymentReceivedAt.toISOString().slice(0, 10);
          const dayAggregate = revenueByDayMap.get(dateKey) || { amount: zero, count: 0 };
          revenueByDayMap.set(dateKey, {
            amount: dayAggregate.amount.plus(amount),
            count: dayAggregate.count + 1,
          });
        }

        const receiverId = entry.paymentReceivedBy?.id || null;
        const receiverName = entry.paymentReceivedBy?.name || "Não informado";
        const receiverAggregate = revenueByReceiverMap.get(receiverId) || {
          id: receiverId,
          name: receiverName,
          amount: zero,
          count: 0,
        };
        revenueByReceiverMap.set(receiverId, {
          id: receiverId,
          name: receiverName,
          amount: receiverAggregate.amount.plus(amount),
          count: receiverAggregate.count + 1,
        });
      } else {
        pendingPayments.push({
          id: entry.id,
          patientName: entry.patientName,
          tutorName: entry.tutorName,
          serviceType: entry.serviceType,
          paymentStatus: status,
          paymentAmount: amountDecimal ? amountDecimal.toFixed(2) : null,
          completedAt: entry.completedAt,
          paymentNotes: entry.paymentNotes || null,
        });
      }
    });

    const serializeDecimal = (value: Prisma.Decimal) => value.toFixed(2);

    const revenueByDay = Array.from(revenueByDayMap.entries())
      .sort((a, b) => a[0].localeCompare(b[0]))
      .map(([date, data]) => ({
        date,
        amount: serializeDecimal(data.amount),
        count: data.count,
      }));

    const revenueByService = Array.from(revenueByServiceMap.entries())
      .sort((a, b) => b[1].amount.comparedTo(a[1].amount))
      .map(([service, data]) => ({
        service,
        amount: serializeDecimal(data.amount),
        count: data.count,
      }));

    const revenueByReceiver = Array.from(revenueByReceiverMap.values())
      .sort((a, b) => b.amount.comparedTo(a.amount))
      .map((data) => ({
        receiverId: data.id,
        receiverName: data.name,
        amount: serializeDecimal(data.amount),
        count: data.count,
      }));

    const sortedPending = pendingPayments.sort((a, b) => {
      const dateA = a.completedAt ? a.completedAt.getTime() : 0;
      const dateB = b.completedAt ? b.completedAt.getTime() : 0;
      return dateA - dateB;
    });

    return {
      revenueByDay,
      revenueByService,
      revenueByReceiver,
      pendingPayments: sortedPending,
    };
  }

  async getStats(startDate: Date, endDate: Date) {
    const [completed, cancelled, allCreated] = await Promise.all([
      prisma.queueEntry.findMany({
        where: {
          status: Status.COMPLETED,
          completedAt: {
            gte: startDate,
            lte: endDate,
          },
        },
        include: {
          assignedVet: {
            select: {
              id: true,
              name: true,
            },
          },
        },
      }),
      prisma.queueEntry.count({
        where: {
          status: Status.CANCELLED,
          createdAt: {
            gte: startDate,
            lte: endDate,
          },
        },
      }),
      prisma.queueEntry.count({
        where: {
          createdAt: {
            gte: startDate,
            lte: endDate,
          },
        },
      }),
    ]);

    const total = completed.length;
    const byService = completed.reduce(
      (acc: Record<string, number>, entry: PrismaQueueEntry) => {
        acc[entry.serviceType] = (acc[entry.serviceType] || 0) + 1;
        return acc;
      },
      {} as Record<string, number>
    );

    let waitTimeSum = 0;
    let entriesWithCalledAt = 0;
    
    completed.forEach((entry: PrismaQueueEntry) => {
      if (entry.calledAt && entry.createdAt) {
        const waitTime = entry.calledAt.getTime() - entry.createdAt.getTime();
        waitTimeSum += waitTime;
        entriesWithCalledAt++;
      }
    });

    const avgWaitTime = entriesWithCalledAt > 0 
      ? waitTimeSum / entriesWithCalledAt 
      : 0;

    let serviceTimeSum = 0;
    let entriesWithServiceTime = 0;
    
    completed.forEach((entry: PrismaQueueEntry) => {
      if (entry.calledAt && entry.completedAt) {
        const serviceTime = entry.completedAt.getTime() - entry.calledAt.getTime();
        serviceTimeSum += serviceTime;
        entriesWithServiceTime++;
      }
    });

    const avgServiceTime = entriesWithServiceTime > 0 
      ? serviceTimeSum / entriesWithServiceTime 
      : 0;

    const cancellationRate = allCreated > 0 
      ? (cancelled / allCreated) * 100 
      : 0;

    const vetCounts = completed.reduce(
      (acc: Record<string, { name: string; count: number }>, entry) => {
        if (entry.assignedVetId && entry.assignedVet) {
          if (!acc[entry.assignedVetId]) {
            acc[entry.assignedVetId] = {
              name: entry.assignedVet.name,
              count: 0,
            };
          }
          acc[entry.assignedVetId].count++;
        }
        return acc;
      },
      {} as Record<string, { name: string; count: number }>
    );

    const topVets = Object.values(vetCounts)
      .sort((a, b) => b.count - a.count)
      .slice(0, 3);

    const daysInPeriod = Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24)) || 1;
    const avgPerDay = total / daysInPeriod;

    const byPriority = completed.reduce(
      (acc: { emergency: number; high: number; normal: number }, entry: PrismaQueueEntry) => {
        if (entry.priority === 1) acc.emergency++;
        else if (entry.priority === 2) acc.high++;
        else if (entry.priority === 3) acc.normal++;
        return acc;
      },
      { emergency: 0, high: 0, normal: 0 }
    );

    return {
      total,
      byService,
      avgWaitTimeMinutes: Math.round(avgWaitTime / 1000 / 60),
      avgServiceTimeMinutes: Math.round(avgServiceTime / 1000 / 60),
      cancellationRate: Math.round(cancellationRate * 10) / 10,
      topVets,
      avgPerDay: Math.round(avgPerDay * 10) / 10,
      byPriority,
    };
  }

  async getVetStats(vetId: string, startDate: Date, endDate: Date) {
    const completed = await prisma.queueEntry.findMany({
      where: {
        status: Status.COMPLETED,
        assignedVetId: vetId,
        completedAt: {
          gte: startDate,
          lte: endDate,
        },
      },
    });

    let serviceTimeSum = 0;
    let entriesWithServiceTime = 0;
    
    completed.forEach((entry: PrismaQueueEntry) => {
      if (entry.calledAt && entry.completedAt) {
        const serviceTime = entry.completedAt.getTime() - entry.calledAt.getTime();
        serviceTimeSum += serviceTime;
        entriesWithServiceTime++;
      }
    });

    const avgServiceTime = entriesWithServiceTime > 0 
      ? serviceTimeSum / entriesWithServiceTime 
      : 0;

    const days = Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24));
    const attendancePerDay = days > 0 ? completed.length / days : 0;

    return {
      total: completed.length,
      avgServiceTimeMinutes: Math.round(avgServiceTime / 1000 / 60),
      attendancePerDay: Math.round(attendancePerDay * 10) / 10,
    };
  }

  async hasOtherVetActivePatient(roomId: string, currentVetId: string): Promise<{ vetId: string; vetName: string } | null> {
    const occupiedEntry = await prisma.queueEntry.findFirst({
      where: {
        roomId,
        AND: [
          { assignedVetId: { not: null } },
          { assignedVetId: { not: currentVetId } },
        ],
        status: {
          in: [Status.CALLED, Status.IN_PROGRESS],
        },
      },
      include: {
        assignedVet: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    });

    if (!occupiedEntry || !occupiedEntry.assignedVet) {
      return null;
    }

    return {
      vetId: occupiedEntry.assignedVet.id,
      vetName: occupiedEntry.assignedVet.name,
    };
  }

  async hasVetInRoom(roomId: string): Promise<boolean> {
    const vet = await prisma.user.findFirst({
      where: {
        currentRoomId: roomId,
        role: "VET",
      },
    });
    return !!vet;
  }

  async getVetInRoom(roomId: string): Promise<{ vetId: string; vetName: string } | null> {
    const vet = await prisma.user.findFirst({
      where: {
        currentRoomId: roomId,
        role: "VET",
      },
      select: {
        id: true,
        name: true,
      },
    });
    
    if (!vet) {
      return null;
    }
    
    return {
      vetId: vet.id,
      vetName: vet.name,
    };
  }

  async getRoomOccupations(currentVetId?: string): Promise<Record<string, { vetId: string; vetName: string } | null>> {
    const vetsCheckedIn = await prisma.user.findMany({
      where: {
        currentRoomId: { not: null },
        role: "VET",
        ...(currentVetId ? { id: { not: currentVetId } } : {}),
      },
      select: {
        id: true,
        name: true,
        currentRoomId: true,
      },
    });

    const occupations: Record<string, { vetId: string; vetName: string } | null> = {};

    vetsCheckedIn.forEach((vet) => {
      if (vet.currentRoomId) {
        if (currentVetId && vet.id === currentVetId) {
          return;
        }
        occupations[vet.currentRoomId] = {
          vetId: vet.id,
          vetName: vet.name,
        };
      }
    });

    return occupations;
  }

  async getActiveVets(): Promise<Array<{ vetId: string; vetName: string; roomId: string; roomName: string }>> {
    const activeVets = await prisma.user.findMany({
      where: {
        role: "VET",
        currentRoomId: { not: null },
      },
      include: {
        currentRoom: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    });

    return activeVets
      .filter(vet => vet.currentRoom)
      .map(vet => ({
        vetId: vet.id,
        vetName: vet.name,
        roomId: vet.currentRoom!.id,
        roomName: vet.currentRoom!.name,
      }));
  }

  async findScheduledEntriesNeedingUpgrade(): Promise<QueueEntry[]> {
    const now = new Date();
    const toleranceMs = 15 * 60 * 1000;
    const cutoffTime = new Date(now.getTime() - toleranceMs);

    const entries = await prisma.queueEntry.findMany({
      where: {
        status: Status.WAITING,
        hasScheduledAppointment: true,
        priority: { not: Priority.HIGH },
        scheduledAt: { lte: cutoffTime },
      },
      include: { assignedVet: true, room: true, patient: true, paymentReceivedBy: true },
    });

    return entries.map(mapPrismaToDomain);
  }

  async updatePriority(entryId: string, priority: Priority): Promise<QueueEntry> {
    const entry = await prisma.queueEntry.update({
      where: { id: entryId },
      data: { priority },
      include: { assignedVet: true, room: true, patient: true, paymentReceivedBy: true },
    });
    return mapPrismaToDomain(entry);
  }

  async update(entryId: string, data: {
    patientName?: string;
    tutorName?: string;
    serviceType?: string;
    priority?: Priority;
    assignedVetId?: string | null;
    hasScheduledAppointment?: boolean;
    scheduledAt?: Date | null;
    patientId?: string | null;
    simplesVetId?: string | null;
    paymentMethod?: string | null;
  }): Promise<QueueEntry> {
    const updateData: any = { ...data };

    if (data.patientId) {
      const patient = await prisma.patient.findUnique({
        where: { id: data.patientId },
      });
      if (patient) {
        updateData.patientName = patient.name;
        updateData.tutorName = patient.tutorName;
      }
    }

    const entry = await prisma.queueEntry.update({
      where: { id: entryId },
      data: updateData,
      include: { assignedVet: true, room: true, patient: true, paymentReceivedBy: true },
    });
    return mapPrismaToDomain(entry);
  }

  async updatePayment(entryId: string, data: {
    paymentMethod?: string | null;
    paymentStatus?: PaymentStatus;
    paymentAmount?: string | null;
    paymentReceivedById?: string | null;
    paymentReceivedAt?: Date | null;
    paymentNotes?: string | null;
  }): Promise<QueueEntry> {
    const updateData: Prisma.QueueEntryUpdateInput = {};

    if (data.paymentMethod !== undefined) {
      updateData.paymentMethod = data.paymentMethod;
    }
    if (data.paymentStatus !== undefined) {
      updateData.paymentStatus = data.paymentStatus;
    }
    if (data.paymentAmount !== undefined) {
      updateData.paymentAmount = data.paymentAmount !== null ? new Prisma.Decimal(data.paymentAmount) : null;
    }
    if (data.paymentReceivedById !== undefined) {
      updateData.paymentReceivedBy = data.paymentReceivedById
        ? {
            connect: { id: data.paymentReceivedById },
          }
        : {
            disconnect: true,
          };
    }
    if (data.paymentReceivedAt !== undefined) {
      updateData.paymentReceivedAt = data.paymentReceivedAt;
    }
    if (data.paymentNotes !== undefined) {
      updateData.paymentNotes = data.paymentNotes;
    }

    const entry = await prisma.queueEntry.update({
      where: { id: entryId },
      data: updateData,
      include: { assignedVet: true, room: true, patient: true, paymentReceivedBy: true },
    });
    return mapPrismaToDomain(entry);
  }

  async findByPatientId(patientId: string): Promise<QueueEntry[]> {
    const entries = await prisma.queueEntry.findMany({
      where: { patientId },
      include: { assignedVet: true, room: true, patient: true, paymentReceivedBy: true },
      orderBy: { createdAt: "desc" },
    });
    return entries.map(mapPrismaToDomain);
  }

  async hasVetActivePatients(vetId: string): Promise<boolean> {
    const activePatient = await prisma.queueEntry.findFirst({
      where: {
        assignedVetId: vetId,
        status: {
          in: [Status.CALLED, Status.IN_PROGRESS],
        },
      },
    });
    return !!activePatient;
  }

  async getPatientStats(startDate: Date, endDate: Date) {
    const [totalPatients, newPatients, patientsWithVisits, speciesCount] = await Promise.all([
      prisma.patient.count(),
      prisma.patient.count({
        where: {
          createdAt: {
            gte: startDate,
            lte: endDate,
          },
        },
      }),
      prisma.patient.findMany({
        include: {
          queueEntries: {
            where: {
              status: Status.COMPLETED,
              completedAt: {
                gte: startDate,
                lte: endDate,
              },
            },
          },
        },
      }),
      prisma.patient.groupBy({
        by: ['species'],
        where: {
          species: { not: null },
        },
        _count: true,
      }),
    ]);

    const topSpecies = speciesCount
      .filter(item => item.species)
      .map(item => ({
        species: item.species!,
        count: item._count,
      }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 5);

    const patientsMultipleVisits = patientsWithVisits.filter(
      patient => patient.queueEntries.length > 1
    ).length;

    const patientsWithBirthDate = await prisma.patient.findMany({
      where: {
        birthDate: { not: null },
      },
      select: {
        birthDate: true,
      },
    });

    const avgAge = patientsWithBirthDate.length > 0
      ? patientsWithBirthDate.reduce((sum, patient) => {
          const birthYear = patient.birthDate!.getFullYear();
          const currentYear = new Date().getFullYear();
          return sum + (currentYear - birthYear);
        }, 0) / patientsWithBirthDate.length
      : 0;

    return {
      totalPatients,
      newPatientsInPeriod: newPatients,
      topSpecies,
      averageAge: Math.round(avgAge * 10) / 10,
      patientsWithMultipleVisits: patientsMultipleVisits,
    };
  }

  async getConsultationStats(startDate: Date, endDate: Date) {
    const [consultations, topDiagnoses, consultationsByVet] = await Promise.all([
      prisma.consultation.findMany({
        where: {
          date: {
            gte: startDate,
            lte: endDate,
          },
        },
        include: {
          vet: {
            select: {
              name: true,
            },
          },
        },
      }),
      prisma.consultation.groupBy({
        by: ['diagnosis'],
        where: {
          diagnosis: { not: null },
          date: {
            gte: startDate,
            lte: endDate,
          },
        },
        _count: true,
      }),
      prisma.consultation.groupBy({
        by: ['vetId'],
        where: {
          date: {
            gte: startDate,
            lte: endDate,
          },
          vetId: { not: null },
        },
        _count: true,
      }),
    ]);

    const consultationsWithWeight = consultations.filter(c => c.weightInKg !== null);
    const avgWeight = consultationsWithWeight.length > 0
      ? consultationsWithWeight.reduce((sum, c) => sum + (c.weightInKg || 0), 0) / consultationsWithWeight.length
      : 0;

    const topDiagnosesList = topDiagnoses
      .filter(item => item.diagnosis)
      .map(item => ({
        diagnosis: item.diagnosis!,
        count: item._count,
      }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 5);

    const vetIdToName = new Map<string, string>();
    consultations.forEach(c => {
      if (c.vet && c.vetId) {
        vetIdToName.set(c.vetId, c.vet.name);
      }
    });

    const consultationsPerVet = consultationsByVet
      .map(item => ({
        vetName: vetIdToName.get(item.vetId!) || 'Desconhecido',
        count: item._count,
      }))
      .sort((a, b) => b.count - a.count);

    return {
      totalConsultations: consultations.length,
      averageWeight: Math.round(avgWeight * 10) / 10,
      topDiagnoses: topDiagnosesList,
      consultationsPerVet,
    };
  }

  async getVaccinationStats(startDate: Date, endDate: Date) {
    const [vaccinations, topVaccines, vaccinationsByVet, upcomingDoses] = await Promise.all([
      prisma.vaccination.findMany({
        where: {
          appliedDate: {
            gte: startDate,
            lte: endDate,
          },
        },
        include: {
          vet: {
            select: {
              name: true,
            },
          },
        },
      }),
      prisma.vaccination.groupBy({
        by: ['vaccineName'],
        where: {
          appliedDate: {
            gte: startDate,
            lte: endDate,
          },
        },
        _count: true,
      }),
      prisma.vaccination.groupBy({
        by: ['vetId'],
        where: {
          appliedDate: {
            gte: startDate,
            lte: endDate,
          },
          vetId: { not: null },
        },
        _count: true,
      }),
      prisma.vaccination.count({
        where: {
          nextDoseDate: {
            gte: startDate,
            lte: endDate,
          },
        },
      }),
    ]);

    const topVaccinesList = topVaccines
      .map(item => ({
        vaccineName: item.vaccineName,
        count: item._count,
      }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 5);

    const vetIdToName = new Map<string, string>();
    vaccinations.forEach(v => {
      if (v.vet && v.vetId) {
        vetIdToName.set(v.vetId, v.vet.name);
      }
    });

    const vaccinationsPerVet = vaccinationsByVet
      .map(item => ({
        vetName: vetIdToName.get(item.vetId!) || 'Desconhecido',
        count: item._count,
      }))
      .sort((a, b) => b.count - a.count);

    return {
      totalVaccinations: vaccinations.length,
      topVaccines: topVaccinesList,
      upcomingDoses,
      vaccinationsPerVet,
    };
  }

  async getRoomUtilizationStats(startDate: Date, endDate: Date) {
    const entries = await prisma.queueEntry.findMany({
      where: {
        status: Status.COMPLETED,
        completedAt: {
          gte: startDate,
          lte: endDate,
        },
        calledAt: { not: null },
        roomId: { not: null },
      },
      include: {
        room: {
          select: {
            name: true,
          },
        },
      },
    });

    const roomUtilization: Record<string, { hoursUsed: number; count: number }> = {};

    entries.forEach(entry => {
      if (entry.room && entry.calledAt && entry.completedAt) {
        const serviceTimeMs = entry.completedAt.getTime() - entry.calledAt.getTime();
        const serviceTimeHours = serviceTimeMs / (1000 * 60 * 60);

        if (!roomUtilization[entry.roomId!]) {
          roomUtilization[entry.roomId!] = { hoursUsed: 0, count: 0 };
        }
        roomUtilization[entry.roomId!].hoursUsed += serviceTimeHours;
        roomUtilization[entry.roomId!].count += 1;
      }
    });

    const allRooms = await prisma.room.findMany({
      where: { isActive: true },
    });

    const totalHours = Object.values(roomUtilization).reduce(
      (sum, room) => sum + room.hoursUsed, 0
    );

    const daysInPeriod = Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24)) || 1;
    const maxPossibleHours = allRooms.length * 24 * daysInPeriod;

    const utilizationPerRoom = allRooms.map(room => {
      const stats = roomUtilization[room.id] || { hoursUsed: 0, count: 0 };
      const roomMaxHours = 24 * daysInPeriod;
      const utilizationRate = roomMaxHours > 0
        ? Math.round((stats.hoursUsed / roomMaxHours) * 100)
        : 0;

      return {
        roomName: room.name,
        hoursUsed: Math.round(stats.hoursUsed * 10) / 10,
        utilizationRate,
        count: stats.count,
      };
    }).sort((a, b) => b.utilizationRate - a.utilizationRate);

    const hourCounts: Record<number, number> = {};
    entries.forEach(entry => {
      if (entry.calledAt) {
        const hour = entry.calledAt.getHours();
        hourCounts[hour] = (hourCounts[hour] || 0) + 1;
      }
    });

    const peakHours = Object.entries(hourCounts)
      .map(([hour, count]) => ({ hour: parseInt(hour), count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 6);

    return {
      totalHours: Math.round(totalHours * 10) / 10,
      utilizationPerRoom,
      peakHours,
    };
  }
}


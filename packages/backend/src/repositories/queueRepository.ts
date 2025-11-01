import { PrismaClient, Prisma, QueueEntry as PrismaQueueEntry } from "@prisma/client";
import { QueueEntry, Priority, Status, User, Role } from "../core/types";

const prisma = new PrismaClient();

function mapPrismaToDomain(entry: PrismaQueueEntry & { assignedVet?: { id: string; username: string; name: string; role: string; createdAt: Date } | null }): QueueEntry {
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
  };
}

export class QueueRepository {
  async create(data: {
    patientName: string;
    tutorName: string;
    serviceType: string;
    priority: Priority;
    assignedVetId?: string;
  }): Promise<QueueEntry> {
    const entry = await prisma.queueEntry.create({
      data: {
        patientName: data.patientName,
        tutorName: data.tutorName,
        serviceType: data.serviceType,
        priority: data.priority,
        status: Status.WAITING,
        assignedVetId: data.assignedVetId,
      },
      include: { assignedVet: true },
    });
    return mapPrismaToDomain(entry);
  }

  async findById(id: string): Promise<QueueEntry | null> {
    const entry = await prisma.queueEntry.findUnique({
      where: { id },
      include: { assignedVet: true },
    });
    return entry ? mapPrismaToDomain(entry) : null;
  }

  async findNextWaiting(assignedVetId?: string | null): Promise<QueueEntry | null> {
    const whereClause: any = {
      status: Status.WAITING,
      assignedVetId: assignedVetId || null,
    };

    const entry = await prisma.queueEntry.findFirst({
      where: whereClause,
      include: { assignedVet: true },
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
      include: { assignedVet: true },
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
      include: { assignedVet: true },
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
      include: { assignedVet: true },
    });
    return mapPrismaToDomain(entry);
  }

  async listActive(): Promise<QueueEntry[]> {
    const entries = await prisma.queueEntry.findMany({
      where: {
        status: {
          in: [Status.WAITING, Status.CALLED, Status.IN_PROGRESS],
        },
      },
      include: { assignedVet: true },
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
      include: { assignedVet: true },
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
      include: { assignedVet: true },
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
      where.serviceType = filters.serviceType;
    }

    const entries = await prisma.queueEntry.findMany({
      where,
      include: { assignedVet: true },
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
      where.serviceType = filters.serviceType;
    }

    const [entries, total] = await Promise.all([
      prisma.queueEntry.findMany({
        where,
        include: { assignedVet: true },
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

  async getStats(startDate: Date, endDate: Date) {
    const completed = await prisma.queueEntry.findMany({
      where: {
        status: Status.COMPLETED,
        completedAt: {
          gte: startDate,
          lte: endDate,
        },
      },
    });

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

    return {
      total,
      byService,
      avgWaitTimeMinutes: Math.round(avgWaitTime / 1000 / 60),
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

  async isRoomOccupiedByOtherVet(roomId: string, currentVetId: string): Promise<{ vetId: string; vetName: string } | null> {
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

  async getRoomOccupations(currentVetId?: string): Promise<Record<string, { vetId: string; vetName: string } | null>> {
    const occupiedEntries = await prisma.queueEntry.findMany({
      where: {
        roomId: { not: null },
        assignedVetId: currentVetId ? { not: currentVetId } : { not: null },
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

    const occupations: Record<string, { vetId: string; vetName: string } | null> = {};
    
    occupiedEntries.forEach((entry) => {
      if (entry.roomId && entry.assignedVet) {
        occupations[entry.roomId] = {
          vetId: entry.assignedVet.id,
          vetName: entry.assignedVet.name,
        };
      }
    });

    return occupations;
  }
}


import { PrismaClient, QueueEntry as PrismaQueueEntry } from "@prisma/client";
import { QueueEntry, Priority, Status, ServiceType } from "../core/types";

const prisma = new PrismaClient();

function mapPrismaToDomain(entry: PrismaQueueEntry): QueueEntry {
  return {
    id: entry.id,
    patientName: entry.patientName,
    tutorName: entry.tutorName,
    serviceType: entry.serviceType as ServiceType,
    priority: entry.priority as Priority,
    status: entry.status as Status,
    createdAt: entry.createdAt,
    calledAt: entry.calledAt,
    completedAt: entry.completedAt,
  };
}

export class QueueRepository {
  async create(data: {
    patientName: string;
    tutorName: string;
    serviceType: ServiceType;
    priority: Priority;
  }): Promise<QueueEntry> {
    const entry = await prisma.queueEntry.create({
      data: {
        patientName: data.patientName,
        tutorName: data.tutorName,
        serviceType: data.serviceType,
        priority: data.priority,
        status: Status.WAITING,
      },
    });
    return mapPrismaToDomain(entry);
  }

  async findById(id: string): Promise<QueueEntry | null> {
    const entry = await prisma.queueEntry.findUnique({
      where: { id },
    });
    return entry ? mapPrismaToDomain(entry) : null;
  }

  async findNextWaiting(): Promise<QueueEntry | null> {
    const entry = await prisma.queueEntry.findFirst({
      where: {
        status: Status.WAITING,
      },
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
    completedAt?: Date
  ): Promise<QueueEntry> {
    const entry = await prisma.queueEntry.update({
      where: { id },
      data: {
        status,
        calledAt: calledAt || undefined,
        completedAt: completedAt || undefined,
      },
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
    serviceType?: ServiceType;
  }): Promise<QueueEntry[]> {
    const where: any = {
      status: Status.COMPLETED,
    };

    if (filters?.startDate || filters?.endDate) {
      where.createdAt = {};
      if (filters.startDate) {
        where.createdAt.gte = filters.startDate;
      }
      if (filters.endDate) {
        where.createdAt.lte = filters.endDate;
      }
    }

    if (filters?.tutorName) {
      where.tutorName = {
        contains: filters.tutorName,
        mode: "insensitive",
      };
    }

    if (filters?.serviceType) {
      where.serviceType = filters.serviceType;
    }

    const entries = await prisma.queueEntry.findMany({
      where,
      orderBy: { completedAt: "desc" },
    });
    return entries.map(mapPrismaToDomain);
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

    const avgWaitTime =
      completed.reduce((sum: number, entry: PrismaQueueEntry) => {
        if (entry.calledAt && entry.createdAt) {
          const waitTime =
            entry.calledAt.getTime() - entry.createdAt.getTime();
          return sum + waitTime;
        }
        return sum;
      }, 0) / (total || 1);

    return {
      total,
      byService,
      avgWaitTimeMinutes: Math.round(avgWaitTime / 1000 / 60),
    };
  }
}


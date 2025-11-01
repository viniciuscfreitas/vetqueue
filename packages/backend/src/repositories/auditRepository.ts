import { PrismaClient, AuditLog as PrismaAuditLog } from "@prisma/client";
import { AuditLog, Role } from "../core/types";

const prisma = new PrismaClient();

function mapPrismaToDomain(entry: PrismaAuditLog & { user?: { id: string; username: string; name: string; role: string; createdAt: Date } | null }): AuditLog {
  return {
    id: entry.id,
    userId: entry.userId,
    user: entry.user ? {
      id: entry.user.id,
      username: entry.user.username,
      name: entry.user.name,
      role: entry.user.role as Role,
      createdAt: entry.user.createdAt,
    } : undefined,
    action: entry.action,
    entityType: entry.entityType,
    entityId: entry.entityId,
    metadata: entry.metadata,
    timestamp: entry.timestamp,
  };
}

export class AuditRepository {
  async create(data: {
    userId: string;
    action: string;
    entityType: string;
    entityId?: string;
    metadata?: any;
  }): Promise<AuditLog> {
    const log = await prisma.auditLog.create({
      data,
      include: { user: true },
    });
    return mapPrismaToDomain(log);
  }

  async findByEntity(entityType: string, entityId: string): Promise<AuditLog[]> {
    const logs = await prisma.auditLog.findMany({
      where: {
        entityType,
        entityId,
      },
      include: { user: true },
      orderBy: { timestamp: "desc" },
    });
    return logs.map(mapPrismaToDomain);
  }

  async findByUser(userId: string): Promise<AuditLog[]> {
    const logs = await prisma.auditLog.findMany({
      where: { userId },
      include: { user: true },
      orderBy: { timestamp: "desc" },
    });
    return logs.map(mapPrismaToDomain);
  }

  async findAll(filters?: {
    startDate?: Date;
    endDate?: Date;
    userId?: string;
    action?: string;
    entityType?: string;
    page?: number;
    limit?: number;
  }): Promise<{ logs: AuditLog[]; total: number; page: number; totalPages: number }> {
    const page = filters?.page || 1;
    const limit = filters?.limit || 20;
    const skip = (page - 1) * limit;

    const where: any = {};

    if (filters?.startDate || filters?.endDate) {
      where.timestamp = {};
      if (filters.startDate) {
        where.timestamp.gte = filters.startDate;
      }
      if (filters.endDate) {
        where.timestamp.lte = filters.endDate;
      }
    }

    if (filters?.userId) {
      where.userId = filters.userId;
    }

    if (filters?.action) {
      where.action = filters.action;
    }

    if (filters?.entityType) {
      where.entityType = filters.entityType;
    }

    const [logs, total] = await Promise.all([
      prisma.auditLog.findMany({
        where,
        include: { user: true },
        orderBy: { timestamp: "desc" },
        skip,
        take: limit,
      }),
      prisma.auditLog.count({ where }),
    ]);

    const totalPages = Math.ceil(total / limit);

    return {
      logs: logs.map(mapPrismaToDomain),
      total,
      page,
      totalPages,
    };
  }
}


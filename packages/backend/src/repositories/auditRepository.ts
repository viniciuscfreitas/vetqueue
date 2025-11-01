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
}


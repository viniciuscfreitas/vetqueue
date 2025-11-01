import { AuditRepository } from "../repositories/auditRepository";

export class AuditService {
  constructor(private repository: AuditRepository) {}

  async log(data: {
    userId: string;
    action: string;
    entityType: string;
    entityId?: string;
    metadata?: any;
  }): Promise<void> {
    await this.repository.create(data);
  }

  async getAuditLogsByEntity(entityType: string, entityId: string) {
    return this.repository.findByEntity(entityType, entityId);
  }

  async getAuditLogsByUser(userId: string) {
    return this.repository.findByUser(userId);
  }
}


import { prisma } from "../lib/prisma";
import { QueueFormPreference } from "../core/types";

function mapToDomain(record: any): QueueFormPreference {
  return {
    userId: record.userId,
    lastTutorId: record.lastTutorId,
    lastTutorName: record.lastTutorName,
    lastPatientId: record.lastPatientId,
    lastPatientName: record.lastPatientName,
    lastServiceType: record.lastServiceType,
    lastPriority: record.lastPriority ?? null,
    lastAssignedVetId: record.lastAssignedVetId,
    lastHasAppointment: record.lastHasAppointment ?? false,
    lastSimplesVetId: record.lastSimplesVetId,
    updatedAt: record.updatedAt,
    createdAt: record.createdAt,
  };
}

export class QueueFormPreferenceRepository {
  async findByUserId(userId: string): Promise<QueueFormPreference | null> {
    const record = await prisma.queueFormPreference.findUnique({
      where: { userId },
    });

    return record ? mapToDomain(record) : null;
  }

  async save(userId: string, data: {
    lastTutorId?: string | null;
    lastTutorName?: string | null;
    lastPatientId?: string | null;
    lastPatientName?: string | null;
    lastServiceType?: string | null;
    lastPriority?: number | null;
    lastAssignedVetId?: string | null;
    lastHasAppointment?: boolean;
    lastSimplesVetId?: string | null;
  }): Promise<QueueFormPreference> {
    const record = await prisma.queueFormPreference.upsert({
      where: { userId },
      update: {
        lastTutorId: data.lastTutorId ?? null,
        lastTutorName: data.lastTutorName ?? null,
        lastPatientId: data.lastPatientId ?? null,
        lastPatientName: data.lastPatientName ?? null,
        lastServiceType: data.lastServiceType ?? null,
        lastPriority: data.lastPriority ?? null,
        lastAssignedVetId: data.lastAssignedVetId ?? null,
        lastHasAppointment: data.lastHasAppointment ?? false,
        lastSimplesVetId: data.lastSimplesVetId ?? null,
      },
      create: {
        userId,
        lastTutorId: data.lastTutorId ?? null,
        lastTutorName: data.lastTutorName ?? null,
        lastPatientId: data.lastPatientId ?? null,
        lastPatientName: data.lastPatientName ?? null,
        lastServiceType: data.lastServiceType ?? null,
        lastPriority: data.lastPriority ?? null,
        lastAssignedVetId: data.lastAssignedVetId ?? null,
        lastHasAppointment: data.lastHasAppointment ?? false,
        lastSimplesVetId: data.lastSimplesVetId ?? null,
      },
    });

    return mapToDomain(record);
  }
}


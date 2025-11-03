import { Consultation as PrismaConsultation } from "@prisma/client";
import { Consultation } from "../core/types";
import { prisma } from "../lib/prisma";

function mapPrismaToDomain(
  consultation: PrismaConsultation & {
    patient?: {
      id: string;
      name: string;
      species: string | null;
      breed: string | null;
      birthDate: Date | null;
      gender: string | null;
      tutorName: string;
      tutorPhone: string | null;
      tutorEmail: string | null;
      notes: string | null;
      createdAt: Date;
      updatedAt: Date;
    } | null;
    queueEntry?: {
      id: string;
      patientName: string;
      tutorName: string;
      serviceType: string;
      priority: number;
      status: string;
      createdAt: Date;
      calledAt: Date | null;
      completedAt: Date | null;
    } | null;
    vet?: {
      id: string;
      username: string;
      name: string;
      role: string;
      createdAt: Date;
    } | null;
  }
): Consultation {
  return {
    id: consultation.id,
    patientId: consultation.patientId,
    patient: consultation.patient ? {
      id: consultation.patient.id,
      name: consultation.patient.name,
      species: consultation.patient.species,
      breed: consultation.patient.breed,
      birthDate: consultation.patient.birthDate,
      gender: consultation.patient.gender,
      tutorName: consultation.patient.tutorName,
      tutorPhone: consultation.patient.tutorPhone,
      tutorEmail: consultation.patient.tutorEmail,
      notes: consultation.patient.notes,
      createdAt: consultation.patient.createdAt,
      updatedAt: consultation.patient.updatedAt,
    } : null,
    queueEntryId: consultation.queueEntryId,
    queueEntry: consultation.queueEntry ? {
      id: consultation.queueEntry.id,
      patientName: consultation.queueEntry.patientName,
      tutorName: consultation.queueEntry.tutorName,
      serviceType: consultation.queueEntry.serviceType,
      priority: consultation.queueEntry.priority as any,
      status: consultation.queueEntry.status as any,
      createdAt: consultation.queueEntry.createdAt,
      calledAt: consultation.queueEntry.calledAt,
      completedAt: consultation.queueEntry.completedAt,
      assignedVetId: null,
      assignedVet: null,
      roomId: null,
      room: null,
      hasScheduledAppointment: false,
      scheduledAt: null,
      patientId: null,
      patient: null,
    } : null,
    vetId: consultation.vetId,
    vet: consultation.vet ? {
      id: consultation.vet.id,
      username: consultation.vet.username,
      name: consultation.vet.name,
      role: consultation.vet.role as any,
      createdAt: consultation.vet.createdAt,
    } : null,
    diagnosis: consultation.diagnosis,
    treatment: consultation.treatment,
    prescription: consultation.prescription,
    weightInKg: consultation.weightInKg,
    notes: consultation.notes,
    date: consultation.date,
    createdAt: consultation.createdAt,
    updatedAt: consultation.updatedAt,
  };
}

export class ConsultationRepository {
  async findAll(filters?: { patientId?: string; queueEntryId?: string; vetId?: string }): Promise<Consultation[]> {
    const where: any = {};

    if (filters?.patientId) {
      where.patientId = filters.patientId;
    }

    if (filters?.queueEntryId) {
      where.queueEntryId = filters.queueEntryId;
    }

    if (filters?.vetId) {
      where.vetId = filters.vetId;
    }

    const consultations = await prisma.consultation.findMany({
      where,
      include: {
        patient: true,
        queueEntry: true,
        vet: true,
      },
      orderBy: { date: "desc" },
    });
    return consultations.map(mapPrismaToDomain);
  }

  async findById(id: string): Promise<Consultation | null> {
    const consultation = await prisma.consultation.findUnique({
      where: { id },
      include: {
        patient: true,
        queueEntry: true,
        vet: true,
      },
    });
    return consultation ? mapPrismaToDomain(consultation) : null;
  }

  async create(data: {
    patientId: string;
    queueEntryId?: string | null;
    vetId?: string | null;
    diagnosis?: string | null;
    treatment?: string | null;
    prescription?: string | null;
    weightInKg?: number | null;
    notes?: string | null;
    date?: Date;
  }): Promise<Consultation> {
    const consultation = await prisma.consultation.create({
      data: {
        ...data,
        date: data.date || new Date(),
      },
      include: {
        patient: true,
        queueEntry: true,
        vet: true,
      },
    });
    return mapPrismaToDomain(consultation);
  }

  async update(id: string, data: {
    diagnosis?: string | null;
    treatment?: string | null;
    prescription?: string | null;
    weightInKg?: number | null;
    notes?: string | null;
    date?: Date;
  }): Promise<Consultation> {
    const consultation = await prisma.consultation.update({
      where: { id },
      data,
      include: {
        patient: true,
        queueEntry: true,
        vet: true,
      },
    });
    return mapPrismaToDomain(consultation);
  }

  async delete(id: string): Promise<void> {
    await prisma.consultation.delete({
      where: { id },
    });
  }
}


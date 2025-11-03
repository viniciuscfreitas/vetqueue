import { Vaccination as PrismaVaccination } from "@prisma/client";
import { Vaccination } from "../core/types";
import { prisma } from "../lib/prisma";

function mapPrismaToDomain(
  vaccination: PrismaVaccination & {
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
    vet?: {
      id: string;
      username: string;
      name: string;
      role: string;
      createdAt: Date;
    } | null;
  }
): Vaccination {
  return {
    id: vaccination.id,
    patientId: vaccination.patientId,
    patient: vaccination.patient ? {
      id: vaccination.patient.id,
      name: vaccination.patient.name,
      species: vaccination.patient.species,
      breed: vaccination.patient.breed,
      birthDate: vaccination.patient.birthDate,
      gender: vaccination.patient.gender,
      tutorName: vaccination.patient.tutorName,
      tutorPhone: vaccination.patient.tutorPhone,
      tutorEmail: vaccination.patient.tutorEmail,
      notes: vaccination.patient.notes,
      createdAt: vaccination.patient.createdAt,
      updatedAt: vaccination.patient.updatedAt,
    } : null,
    vaccineName: vaccination.vaccineName,
    appliedDate: vaccination.appliedDate,
    batchNumber: vaccination.batchNumber,
    vetId: vaccination.vetId,
    vet: vaccination.vet ? {
      id: vaccination.vet.id,
      username: vaccination.vet.username,
      name: vaccination.vet.name,
      role: vaccination.vet.role as any,
      createdAt: vaccination.vet.createdAt,
    } : null,
    nextDoseDate: vaccination.nextDoseDate,
    notes: vaccination.notes,
    createdAt: vaccination.createdAt,
  };
}

export class VaccinationRepository {
  async findAll(filters?: { patientId?: string; vetId?: string; upcomingDoses?: boolean }): Promise<Vaccination[]> {
    const where: any = {};

    if (filters?.patientId) {
      where.patientId = filters.patientId;
    }

    if (filters?.vetId) {
      where.vetId = filters.vetId;
    }

    if (filters?.upcomingDoses) {
      const sevenDaysFromNow = new Date();
      sevenDaysFromNow.setDate(sevenDaysFromNow.getDate() + 7);
      where.nextDoseDate = {
        lte: sevenDaysFromNow,
        gte: new Date(),
      };
    }

    const vaccinations = await prisma.vaccination.findMany({
      where,
      include: {
        patient: true,
        vet: true,
      },
      orderBy: { appliedDate: "desc" },
    });
    return vaccinations.map(mapPrismaToDomain);
  }

  async findById(id: string): Promise<Vaccination | null> {
    const vaccination = await prisma.vaccination.findUnique({
      where: { id },
      include: {
        patient: true,
        vet: true,
      },
    });
    return vaccination ? mapPrismaToDomain(vaccination) : null;
  }

  async create(data: {
    patientId: string;
    vaccineName: string;
    appliedDate?: Date;
    batchNumber?: string | null;
    vetId?: string | null;
    nextDoseDate?: Date | null;
    notes?: string | null;
  }): Promise<Vaccination> {
    const vaccination = await prisma.vaccination.create({
      data: {
        ...data,
        appliedDate: data.appliedDate || new Date(),
      },
      include: {
        patient: true,
        vet: true,
      },
    });
    return mapPrismaToDomain(vaccination);
  }

  async update(id: string, data: {
    vaccineName?: string;
    appliedDate?: Date;
    batchNumber?: string | null;
    nextDoseDate?: Date | null;
    notes?: string | null;
  }): Promise<Vaccination> {
    const vaccination = await prisma.vaccination.update({
      where: { id },
      data,
      include: {
        patient: true,
        vet: true,
      },
    });
    return mapPrismaToDomain(vaccination);
  }

  async delete(id: string): Promise<void> {
    await prisma.vaccination.delete({
      where: { id },
    });
  }

  async getVaccineNameSuggestions(): Promise<string[]> {
    const vaccinations = await prisma.vaccination.findMany({
      select: {
        vaccineName: true,
      },
      distinct: ["vaccineName"],
      orderBy: {
        vaccineName: "asc",
      },
      take: 50,
    });
    return vaccinations.map((v: { vaccineName: string }) => v.vaccineName);
  }
}


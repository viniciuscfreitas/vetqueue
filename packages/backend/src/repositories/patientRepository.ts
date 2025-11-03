import { Patient as PrismaPatient } from "@prisma/client";
import { Patient } from "../core/types";
import { prisma } from "../lib/prisma";

function mapPrismaToDomain(patient: PrismaPatient): Patient {
  return {
    id: patient.id,
    name: patient.name,
    species: patient.species,
    breed: patient.breed,
    birthDate: patient.birthDate,
    gender: patient.gender,
    tutorName: patient.tutorName,
    tutorPhone: patient.tutorPhone,
    tutorEmail: patient.tutorEmail,
    notes: patient.notes,
    createdAt: patient.createdAt,
    updatedAt: patient.updatedAt,
  };
}

export class PatientRepository {
  async findAll(filters?: { name?: string; tutorName?: string }): Promise<Patient[]> {
    const where: any = {};
    
    if (filters?.name) {
      where.name = {
        contains: filters.name,
        mode: "insensitive",
      };
    }
    
    if (filters?.tutorName) {
      where.tutorName = {
        contains: filters.tutorName,
        mode: "insensitive",
      };
    }

    const patients = await prisma.patient.findMany({
      where,
      orderBy: { name: "asc" },
    });
    return patients.map(mapPrismaToDomain);
  }

  async findById(id: string): Promise<Patient | null> {
    const patient = await prisma.patient.findUnique({
      where: { id },
    });
    return patient ? mapPrismaToDomain(patient) : null;
  }

  async create(data: {
    name: string;
    species?: string | null;
    breed?: string | null;
    birthDate?: Date | null;
    gender?: string | null;
    tutorName: string;
    tutorPhone?: string | null;
    tutorEmail?: string | null;
    notes?: string | null;
  }): Promise<Patient> {
    const patient = await prisma.patient.create({
      data,
    });
    return mapPrismaToDomain(patient);
  }

  async update(id: string, data: {
    name?: string;
    species?: string | null;
    breed?: string | null;
    birthDate?: Date | null;
    gender?: string | null;
    tutorName?: string;
    tutorPhone?: string | null;
    tutorEmail?: string | null;
    notes?: string | null;
  }): Promise<Patient> {
    const patient = await prisma.patient.update({
      where: { id },
      data,
    });
    return mapPrismaToDomain(patient);
  }

  async delete(id: string): Promise<void> {
    await prisma.patient.delete({
      where: { id },
    });
  }
}


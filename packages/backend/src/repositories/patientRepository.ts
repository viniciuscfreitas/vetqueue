import { Patient as PrismaPatient } from "@prisma/client";
import { Patient, Tutor } from "../core/types";
import { prisma } from "../lib/prisma";

function mapPrismaToDomain(patient: PrismaPatient & { tutor?: { id: string; name: string; phone: string | null; email: string | null; cpfCnpj: string | null; address: string | null; createdAt: Date; updatedAt: Date } | null }): Patient {
  return {
    id: patient.id,
    name: patient.name,
    species: patient.species,
    breed: patient.breed,
    birthDate: patient.birthDate,
    gender: patient.gender,
    microchip: patient.microchip,
    color: patient.color,
    currentWeight: patient.currentWeight,
    allergies: patient.allergies,
    ongoingMedications: patient.ongoingMedications,
    temperament: patient.temperament,
    neutered: patient.neutered,
    photoUrl: patient.photoUrl,
    tutorId: patient.tutorId,
    tutor: patient.tutor ? {
      id: patient.tutor.id,
      name: patient.tutor.name,
      phone: patient.tutor.phone,
      email: patient.tutor.email,
      cpfCnpj: patient.tutor.cpfCnpj,
      address: patient.tutor.address,
      createdAt: patient.tutor.createdAt,
      updatedAt: patient.tutor.updatedAt,
    } : null,
    tutorName: patient.tutorName,
    tutorPhone: patient.tutorPhone,
    tutorEmail: patient.tutorEmail,
    tutorCpfCnpj: patient.tutorCpfCnpj,
    tutorAddress: patient.tutorAddress,
    notes: patient.notes,
    createdAt: patient.createdAt,
    updatedAt: patient.updatedAt,
  };
}

export class PatientRepository {
  async findAll(filters?: { name?: string; tutorName?: string; tutorId?: string }): Promise<Patient[]> {
    const where: any = {};
    
    if (filters?.name) {
      where.name = {
        contains: filters.name,
        mode: "insensitive",
      };
    }
    
    if (filters?.tutorId) {
      where.tutorId = filters.tutorId;
    } else if (filters?.tutorName) {
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
      include: { tutor: true },
    });
    return patient ? mapPrismaToDomain(patient) : null;
  }

  async create(data: {
    name: string;
    species?: string | null;
    breed?: string | null;
    birthDate?: Date | null;
    gender?: string | null;
    microchip?: string | null;
    color?: string | null;
    currentWeight?: number | null;
    allergies?: string | null;
    ongoingMedications?: string | null;
    temperament?: string | null;
    neutered?: boolean | null;
    photoUrl?: string | null;
    tutorId?: string | null;
    tutorName: string;
    tutorPhone?: string | null;
    tutorEmail?: string | null;
    tutorCpfCnpj?: string | null;
    tutorAddress?: string | null;
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
    microchip?: string | null;
    color?: string | null;
    currentWeight?: number | null;
    allergies?: string | null;
    ongoingMedications?: string | null;
    temperament?: string | null;
    neutered?: boolean | null;
    photoUrl?: string | null;
    tutorId?: string | null;
    tutorName?: string;
    tutorPhone?: string | null;
    tutorEmail?: string | null;
    tutorCpfCnpj?: string | null;
    tutorAddress?: string | null;
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

  async hasQueueEntries(id: string): Promise<boolean> {
    const count = await prisma.queueEntry.count({
      where: { patientId: id },
    });
    return count > 0;
  }
}


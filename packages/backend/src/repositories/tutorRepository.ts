import { Tutor as PrismaTutor } from "@prisma/client";
import { Tutor } from "../core/types";
import { prisma } from "../lib/prisma";

function mapPrismaToDomain(tutor: PrismaTutor): Tutor {
  return {
    id: tutor.id,
    name: tutor.name,
    phone: tutor.phone,
    email: tutor.email,
    cpfCnpj: tutor.cpfCnpj,
    address: tutor.address,
    createdAt: tutor.createdAt,
    updatedAt: tutor.updatedAt,
  };
}

export class TutorRepository {
  async findAll(filters?: { name?: string; phone?: string; cpfCnpj?: string }): Promise<Tutor[]> {
    const where: any = {};
    
    if (filters?.name) {
      where.name = {
        contains: filters.name,
        mode: "insensitive",
      };
    }
    
    if (filters?.phone) {
      where.phone = {
        contains: filters.phone,
        mode: "insensitive",
      };
    }
    
    if (filters?.cpfCnpj) {
      where.cpfCnpj = {
        contains: filters.cpfCnpj,
        mode: "insensitive",
      };
    }

    const tutors = await prisma.tutor.findMany({
      where,
      orderBy: { name: "asc" },
    });
    return tutors.map(mapPrismaToDomain);
  }

  async findById(id: string): Promise<Tutor | null> {
    const tutor = await prisma.tutor.findUnique({
      where: { id },
    });
    return tutor ? mapPrismaToDomain(tutor) : null;
  }

  async findByPhone(phone: string): Promise<Tutor | null> {
    const tutor = await prisma.tutor.findFirst({
      where: { phone },
    });
    return tutor ? mapPrismaToDomain(tutor) : null;
  }

  async findByCpfCnpj(cpfCnpj: string): Promise<Tutor | null> {
    const tutor = await prisma.tutor.findFirst({
      where: { cpfCnpj },
    });
    return tutor ? mapPrismaToDomain(tutor) : null;
  }

  async create(data: {
    name: string;
    phone?: string | null;
    email?: string | null;
    cpfCnpj?: string | null;
    address?: string | null;
  }): Promise<Tutor> {
    const tutor = await prisma.tutor.create({
      data,
    });
    return mapPrismaToDomain(tutor);
  }

  async update(id: string, data: {
    name?: string;
    phone?: string | null;
    email?: string | null;
    cpfCnpj?: string | null;
    address?: string | null;
  }): Promise<Tutor> {
    const tutor = await prisma.tutor.update({
      where: { id },
      data,
    });
    return mapPrismaToDomain(tutor);
  }

  async delete(id: string): Promise<void> {
    await prisma.tutor.delete({
      where: { id },
    });
  }

  async hasPatients(id: string): Promise<boolean> {
    const count = await prisma.patient.count({
      where: { tutorId: id },
    });
    return count > 0;
  }
}


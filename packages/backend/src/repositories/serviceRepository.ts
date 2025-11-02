import { Service as PrismaService } from "@prisma/client";
import { Service } from "../core/types";
import { prisma } from "../lib/prisma";

function mapPrismaToDomain(service: PrismaService): Service {
  return {
    id: service.id,
    name: service.name,
    isActive: service.isActive,
    createdAt: service.createdAt,
  };
}

export class ServiceRepository {
  async findAll(): Promise<Service[]> {
    const services = await prisma.service.findMany({
      orderBy: { name: "asc" },
    });
    return services.map(mapPrismaToDomain);
  }

  async findActive(): Promise<Service[]> {
    const services = await prisma.service.findMany({
      where: { isActive: true },
      orderBy: { name: "asc" },
    });
    return services.map(mapPrismaToDomain);
  }

  async findById(id: string): Promise<Service | null> {
    const service = await prisma.service.findUnique({
      where: { id },
    });
    return service ? mapPrismaToDomain(service) : null;
  }

  async findByName(name: string): Promise<Service | null> {
    const service = await prisma.service.findUnique({
      where: { name },
    });
    return service ? mapPrismaToDomain(service) : null;
  }

  async create(data: { name: string }): Promise<Service> {
    const service = await prisma.service.create({
      data: {
        name: data.name,
        isActive: true,
      },
    });
    return mapPrismaToDomain(service);
  }

  async update(id: string, data: { name?: string; isActive?: boolean }): Promise<Service> {
    const service = await prisma.service.update({
      where: { id },
      data,
    });
    return mapPrismaToDomain(service);
  }

  async delete(id: string): Promise<void> {
    await prisma.service.update({
      where: { id },
      data: { isActive: false },
    });
  }
}


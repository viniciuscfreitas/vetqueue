import { Room as PrismaRoom } from "@prisma/client";
import { Room } from "../core/types";
import { prisma } from "../lib/prisma";

function mapPrismaToDomain(room: PrismaRoom): Room {
  return {
    id: room.id,
    name: room.name,
    isActive: room.isActive,
    createdAt: room.createdAt,
  };
}

export class RoomRepository {
  async findAll(): Promise<Room[]> {
    const rooms = await prisma.room.findMany({
      orderBy: { name: "asc" },
    });
    return rooms.map(mapPrismaToDomain);
  }

  async findActive(): Promise<Room[]> {
    const rooms = await prisma.room.findMany({
      where: { isActive: true },
      orderBy: { name: "asc" },
    });
    return rooms.map(mapPrismaToDomain);
  }

  async findById(id: string): Promise<Room | null> {
    const room = await prisma.room.findUnique({
      where: { id },
    });
    return room ? mapPrismaToDomain(room) : null;
  }

  async create(data: { name: string }): Promise<Room> {
    const room = await prisma.room.create({
      data: {
        name: data.name,
        isActive: true,
      },
    });
    return mapPrismaToDomain(room);
  }

  async update(id: string, data: { name?: string; isActive?: boolean }): Promise<Room> {
    const room = await prisma.room.update({
      where: { id },
      data,
    });
    return mapPrismaToDomain(room);
  }

  async delete(id: string): Promise<void> {
    await prisma.room.update({
      where: { id },
      data: { isActive: false },
    });
  }
}


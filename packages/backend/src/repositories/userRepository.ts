import { User as PrismaUser } from "@prisma/client";
import { User, Role } from "../core/types";
import { prisma } from "../lib/prisma";

function mapPrismaToDomain(user: PrismaUser): User {
  return {
    id: user.id,
    username: user.username,
    name: user.name,
    role: user.role as Role,
    createdAt: user.createdAt,
    currentRoomId: user.currentRoomId,
    roomCheckedInAt: user.roomCheckedInAt,
    lastActivityAt: user.lastActivityAt,
  };
}

export class UserRepository {
  async findAll(): Promise<User[]> {
    const users = await prisma.user.findMany({
      orderBy: { name: "asc" },
    });
    return users.map(mapPrismaToDomain);
  }

  async findById(id: string): Promise<User | null> {
    const user = await prisma.user.findUnique({
      where: { id },
    });
    return user ? mapPrismaToDomain(user) : null;
  }

  async findByUsername(username: string): Promise<User | null> {
    const user = await prisma.user.findUnique({
      where: { username },
    });
    return user ? mapPrismaToDomain(user) : null;
  }

  async create(data: {
    username: string;
    password: string;
    name: string;
    role: Role;
  }): Promise<User> {
    const user = await prisma.user.create({
      data: {
        username: data.username,
        password: data.password,
        name: data.name,
        role: data.role,
      },
    });
    return mapPrismaToDomain(user);
  }

  async update(id: string, data: {
    name?: string;
    role?: Role;
    password?: string;
  }): Promise<User> {
    const updateData: any = {};
    if (data.name) updateData.name = data.name;
    if (data.role) updateData.role = data.role;
    if (data.password) updateData.password = data.password;

    const user = await prisma.user.update({
      where: { id },
      data: updateData,
    });
    return mapPrismaToDomain(user);
  }

  async checkInRoom(vetId: string, roomId: string): Promise<User> {
    const user = await prisma.$transaction(async (tx) => {
      const currentUser = await tx.user.findUnique({
        where: { id: vetId },
      });

      if (currentUser && currentUser.currentRoomId === roomId) {
        return currentUser;
      }

      const existingUserInRoom = await tx.user.findFirst({
        where: { 
          currentRoomId: roomId,
          id: { not: vetId },
        },
      });

      if (existingUserInRoom) {
        throw new Error(`Sala já está ocupada por ${existingUserInRoom.name}`);
      }

      const user = await tx.user.update({
        where: { id: vetId },
        data: {
          currentRoomId: roomId,
          roomCheckedInAt: new Date(),
          lastActivityAt: new Date(),
        },
      });

      return user;
    });

    return mapPrismaToDomain(user);
  }

  async checkOutRoom(vetId: string): Promise<User> {
    const user = await prisma.user.update({
      where: { id: vetId },
      data: {
        currentRoomId: null,
        roomCheckedInAt: null,
        lastActivityAt: null,
      },
    });
    return mapPrismaToDomain(user);
  }

  async changeRoom(vetId: string, newRoomId: string): Promise<User> {
    const user = await prisma.$transaction(async (tx) => {
      const existingUserInRoom = await tx.user.findFirst({
        where: { 
          currentRoomId: newRoomId,
          id: { not: vetId },
        },
      });

      if (existingUserInRoom) {
        throw new Error(`Sala já está ocupada por ${existingUserInRoom.name}`);
      }

      const user = await tx.user.update({
        where: { id: vetId },
        data: {
          currentRoomId: newRoomId,
          roomCheckedInAt: new Date(),
          lastActivityAt: new Date(),
        },
      });

      return user;
    });

    return mapPrismaToDomain(user);
  }

  async updateLastActivity(vetId: string): Promise<void> {
    await prisma.user.update({
      where: { id: vetId },
      data: {
        lastActivityAt: new Date(),
      },
    });
  }

  async findInactiveRoomCheckins(maxAgeMinutes: number): Promise<User[]> {
    const cutoffTime = new Date(Date.now() - maxAgeMinutes * 60 * 1000);
    
    const users = await prisma.user.findMany({
      where: {
        currentRoomId: { not: null },
        roomCheckedInAt: { not: null },
        role: "VET",
        OR: [
          {
            lastActivityAt: null,
            roomCheckedInAt: { lte: cutoffTime },
          },
          {
            lastActivityAt: { not: null, lte: cutoffTime },
          },
        ],
      },
    });

    return users.map(mapPrismaToDomain);
  }

  async clearRoomCheckin(userId: string): Promise<User> {
    const user = await prisma.user.update({
      where: { id: userId },
      data: {
        currentRoomId: null,
        roomCheckedInAt: null,
        lastActivityAt: null,
      },
    });
    return mapPrismaToDomain(user);
  }
}


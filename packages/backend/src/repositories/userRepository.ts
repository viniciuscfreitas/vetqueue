import { PrismaClient, User as PrismaUser } from "@prisma/client";
import { User, Role } from "../core/types";

const prisma = new PrismaClient();

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
      const existingUserInRoom = await tx.user.findFirst({
        where: { currentRoomId: roomId },
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

  async updateLastActivity(vetId: string): Promise<void> {
    await prisma.user.update({
      where: { id: vetId },
      data: {
        lastActivityAt: new Date(),
      },
    });
  }
}


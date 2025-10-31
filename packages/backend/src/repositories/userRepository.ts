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
}


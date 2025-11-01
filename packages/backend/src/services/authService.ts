import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import { PrismaClient } from "@prisma/client";
import { User, Role } from "../core/types";

const prisma = new PrismaClient();

const JWT_SECRET = process.env.JWT_SECRET || "vetqueue-secret-key-change-in-production";
const JWT_EXPIRES_IN = "24h";

export interface LoginResult {
  user: User;
  token: string;
}

export class AuthService {
  async login(username: string, password: string): Promise<LoginResult> {
    const user = await prisma.user.findUnique({
      where: { username },
    });

    if (!user) {
      throw new Error("Credenciais inválidas");
    }

    const passwordMatch = await bcrypt.compare(password, user.password);

    if (!passwordMatch) {
      throw new Error("Credenciais inválidas");
    }

    const token = jwt.sign(
      {
        id: user.id,
        username: user.username,
        name: user.name,
        role: user.role,
      },
      JWT_SECRET,
      { expiresIn: JWT_EXPIRES_IN }
    );

    return {
      user: {
        id: user.id,
        username: user.username,
        name: user.name,
        role: user.role as Role,
        createdAt: user.createdAt,
        currentRoomId: user.currentRoomId,
        roomCheckedInAt: user.roomCheckedInAt,
        lastActivityAt: user.lastActivityAt,
      },
      token,
    };
  }

  verifyToken(token: string): any {
    try {
      return jwt.verify(token, JWT_SECRET);
    } catch (error) {
      throw new Error("Token inválido");
    }
  }
}


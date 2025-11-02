import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import { User, Role } from "../core/types";
import { prisma } from "../lib/prisma";

const JWT_SECRET = process.env.JWT_SECRET || "vetqueue-secret-key-change-in-production";
const JWT_EXPIRES_IN = "24h";

export interface LoginResult {
  user: User;
  token: string;
}

export class AuthService {
  async login(username: string, password: string): Promise<LoginResult> {
    console.log(`[AUTH] Tentativa de login - Username: ${username}`);
    
    const user = await prisma.user.findUnique({
      where: { username },
    });

    if (!user) {
      console.warn(`[AUTH] ✗ Login falhou - Usuário não encontrado: ${username}`);
      throw new Error("Credenciais inválidas");
    }

    const passwordMatch = await bcrypt.compare(password, user.password);

    if (!passwordMatch) {
      console.warn(`[AUTH] ✗ Login falhou - Senha incorreta para: ${username}`);
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

    console.log(`[AUTH] ✓ Login bem-sucedido - ${user.name} (${user.role})`);
    
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


import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import { User, Role } from "../core/types";
import { prisma } from "../lib/prisma";
import { logger } from "../lib/logger";

const JWT_SECRET = process.env.JWT_SECRET || "vetqueue-secret-key-change-in-production";
const JWT_EXPIRES_IN = "24h";

export interface LoginResult {
  user: User;
  token: string;
}

export class AuthService {
  async login(username: string, password: string): Promise<LoginResult> {
    logger.info("Login attempt", { module: "Auth", username });
    
    const user = await prisma.user.findUnique({
      where: { username },
    });

    if (!user) {
      logger.warn("Login failed - user not found", { module: "Auth", username });
      throw new Error("Credenciais inválidas");
    }

    const passwordMatch = await bcrypt.compare(password, user.password);

    if (!passwordMatch) {
      logger.warn("Login failed - invalid password", { module: "Auth", username, userId: user.id });
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

    logger.info("Login successful", {
      module: "Auth",
      eventType: "AuthenticationSuccess",
      userId: user.id,
      username: user.username,
      userRole: user.role,
    });
    
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
      logger.warn("Token verification failed", {
        module: "Auth",
        eventType: "AuthenticationFailure",
        error: error instanceof Error ? error.message : String(error),
        tokenLength: token?.length,
        tokenPrefix: token?.substring(0, 20),
      });
      throw new Error("Token inválido");
    }
  }
}


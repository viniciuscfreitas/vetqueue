import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import { User, Role, ModuleKey } from "../core/types";
import { prisma } from "../lib/prisma";
import { logger } from "../lib/logger";
import { PermissionService } from "./permissionService";

const JWT_SECRET = process.env.JWT_SECRET || "vetqueue-secret-key-change-in-production";
const JWT_EXPIRES_IN = "24h";

export interface LoginResult {
  user: User;
  token: string;
  permissions: ModuleKey[];
}

export class AuthService {
  constructor(private permissionService: PermissionService = new PermissionService()) {}

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

    const role = user.role as Role;
    const permissions = await this.permissionService.getModulesForRole(role);

    const token = jwt.sign(
      {
        id: user.id,
        username: user.username,
        name: user.name,
        role: user.role,
        permissions,
      },
      JWT_SECRET,
      { expiresIn: JWT_EXPIRES_IN }
    );

    logger.info("Login successful", {
      module: "Auth",
      eventType: "AuthenticationSuccess",
      userId: user.id,
      userRole: user.role,
    });

    return {
      user: {
        id: user.id,
        username: user.username,
        name: user.name,
        role,
        createdAt: user.createdAt,
        currentRoomId: user.currentRoomId,
        roomCheckedInAt: user.roomCheckedInAt,
        lastActivityAt: user.lastActivityAt,
        permissions,
      },
      token,
      permissions,
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


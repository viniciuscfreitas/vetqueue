import { NextFunction, Request, Response } from "express";
import { ModuleKey, Role } from "../core/types";
import { AuthService } from "../services/authService";
import { PermissionService } from "../services/permissionService";

export interface AuthenticatedRequest extends Request {
  user?: {
    id: string;
    username: string;
    name: string;
    role: string;
    permissions?: ModuleKey[];
  };
}

const authService = new AuthService();
const permissionService = new PermissionService();

export async function authMiddleware(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
) {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      res.status(401).json({ error: "Token não fornecido" });
      return;
    }

    const token = authHeader.substring(7);
    const decoded = authService.verifyToken(token);

    const role = (decoded as any).role as Role | undefined;
    if (!role || !Object.values(Role).includes(role)) {
      res.status(401).json({ error: "Token inválido" });
      return;
    }

    let permissions: ModuleKey[] = [];
    try {
      permissions = await permissionService.getModulesForRole(role);
    } catch (permissionError) {
      res.status(500).json({ error: "Não foi possível validar permissões" });
      return;
    }

    req.user = {
      id: (decoded as any).id,
      username: (decoded as any).username,
      name: (decoded as any).name,
      role,
      permissions,
    };

    next();
  } catch (error) {
    res.status(401).json({ error: "Token inválido" });
  }
}

export function requireRole(roles: string[]) {
  return (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    if (!req.user) {
      res.status(401).json({ error: "Não autenticado" });
      return;
    }

    if (!roles.includes(req.user.role)) {
      res.status(403).json({ error: "Acesso negado" });
      return;
    }

    next();
  };
}

export function requireModule(requiredModules: ModuleKey | ModuleKey[]) {
  const modules = Array.isArray(requiredModules)
    ? requiredModules
    : [requiredModules];

  return (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    if (!req.user) {
      res.status(401).json({ error: "Não autenticado" });
      return;
    }

    if (req.user.role === Role.ADMIN) {
      next();
      return;
    }

    const userModules = req.user.permissions ?? [];
    const hasAccess = modules.every((module) => userModules.includes(module));

    if (!hasAccess) {
      res.status(403).json({ error: "Acesso negado" });
      return;
    }

    next();
  };
}


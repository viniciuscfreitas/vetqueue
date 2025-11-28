import { Router, Request, Response } from "express";
import { AuthService } from "../../services/authService";
import { UserRepository } from "../../repositories/userRepository";
import { authMiddleware, AuthenticatedRequest } from "../../middleware/authMiddleware";
import { z } from "zod";
import { asyncHandler } from "../../middleware/asyncHandler";
import { PermissionService } from "../../services/permissionService";

const router = Router();
const authService = new AuthService();
const userRepository = new UserRepository();
const permissionService = new PermissionService();

const loginSchema = z.object({
  username: z.string().trim().min(1, "Usuário é obrigatório"),
  password: z.string().trim().min(1, "Senha é obrigatória"),
});

router.post("/login", asyncHandler(async (req: Request, res: Response) => {
  const data = loginSchema.parse(req.body);
  try {
    const result = await authService.login(data.username, data.password);
    res.json(result);
  } catch (error) {
    if (error instanceof Error && error.message === "Credenciais inválidas") {
      res.status(401).json({ error: error.message });
      return;
    }
    throw error;
  }
}));

router.get("/me", authMiddleware, asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  if (!req.user?.id) {
    res.status(401).json({ error: "Não autenticado" });
    return;
  }
  const user = await userRepository.findById(req.user.id);
  if (!user) {
    res.status(401).json({ error: "Usuário não encontrado" });
    return;
  }
  const permissions = await permissionService.getModulesForRole(user.role);
  res.json({ user: { ...user, permissions }, permissions });
}));

router.post("/reset-password", asyncHandler(async (req: Request, res: Response) => {
  const { username, newPassword } = req.body;

  if (!username || !newPassword) {
    res.status(400).json({ error: "Username e newPassword são obrigatórios" });
    return;
  }

  const bcrypt = require("bcrypt");
  const hashedPassword = await bcrypt.hash(newPassword, 10);

  const { prisma } = require("../../lib/prisma");
  const updated = await prisma.user.update({
    where: { username },
    data: { password: hashedPassword },
  });

  res.json({ message: `Senha atualizada para ${username}`, username: updated.username });
}));

router.post("/test-bcrypt", asyncHandler(async (req: Request, res: Response) => {
  const { username, password } = req.body;

  if (!username || !password) {
    res.status(400).json({ error: "Username e password são obrigatórios" });
    return;
  }

  const { prisma } = require("../../lib/prisma");
  const bcrypt = require("bcrypt");

  const user = await prisma.user.findUnique({
    where: { username },
  });

  if (!user) {
    res.status(404).json({ error: "Usuário não encontrado" });
    return;
  }

  const testHash = await bcrypt.hash(password, 10);
  const compareResult = await bcrypt.compare(password, user.password);
  const testCompareResult = await bcrypt.compare(password, testHash);

  res.json({
    username: user.username,
    storedHashPrefix: user.password.substring(0, 30),
    newHashPrefix: testHash.substring(0, 30),
    compareWithStored: compareResult,
    compareWithNew: testCompareResult,
    inputPassword: password,
    inputLength: password.length,
    storedHashLength: user.password.length,
  });
}));


export default router;


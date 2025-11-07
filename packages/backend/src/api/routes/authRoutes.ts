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
  username: z.string().min(1, "Usuário é obrigatório"),
  password: z.string().min(1, "Senha é obrigatória"),
});

router.post("/login", async (req: Request, res: Response) => {
  try {
    const data = loginSchema.parse(req.body);
    const result = await authService.login(data.username, data.password);
    res.json(result);
  } catch (error) {
    if (error instanceof z.ZodError) {
      res.status(400).json({ error: error.errors });
      return;
    }
    res.status(401).json({ error: (error as Error).message });
  }
});

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

export default router;


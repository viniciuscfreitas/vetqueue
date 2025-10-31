import { Router, Request, Response } from "express";
import { AuthService } from "../../services/authService";
import { authMiddleware, AuthenticatedRequest } from "../../middleware/authMiddleware";
import { z } from "zod";

const router = Router();
const authService = new AuthService();

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

router.get("/me", authMiddleware, async (req: AuthenticatedRequest, res: Response) => {
  res.json({ user: req.user });
});

export default router;


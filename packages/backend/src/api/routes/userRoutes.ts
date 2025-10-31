import { Router, Request, Response } from "express";
import { UserService } from "../../services/userService";
import { UserRepository } from "../../repositories/userRepository";
import { Role } from "../../core/types";
import { authMiddleware, requireRole } from "../../middleware/authMiddleware";
import { z } from "zod";

const router = Router();
const repository = new UserRepository();
const userService = new UserService(repository);

const createUserSchema = z.object({
  username: z.string().min(1, "Username é obrigatório"),
  password: z.string().min(6, "Senha deve ter no mínimo 6 caracteres"),
  name: z.string().min(1, "Nome é obrigatório"),
  role: z.nativeEnum(Role),
});

router.get("/", authMiddleware, requireRole(["RECEPCAO"]), async (req: Request, res: Response) => {
  try {
    const users = await userService.listUsers();
    res.json(users);
  } catch (error) {
    res.status(500).json({ error: (error as Error).message });
  }
});

router.post("/", authMiddleware, requireRole(["RECEPCAO"]), async (req: Request, res: Response) => {
  try {
    const data = createUserSchema.parse(req.body);
    const user = await userService.createUser(data);
    res.status(201).json(user);
  } catch (error) {
    if (error instanceof z.ZodError) {
      res.status(400).json({ error: error.errors });
      return;
    }
    res.status(400).json({ error: (error as Error).message });
  }
});

export default router;


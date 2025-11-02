import { Router, Request, Response } from "express";
import { UserService } from "../../services/userService";
import { UserRepository } from "../../repositories/userRepository";
import { QueueRepository } from "../../repositories/queueRepository";
import { Role } from "../../core/types";
import { authMiddleware, requireRole, AuthenticatedRequest } from "../../middleware/authMiddleware";
import { z } from "zod";
import { asyncHandler } from "../../middleware/asyncHandler";

const router = Router();
const repository = new UserRepository();
const userService = new UserService(repository);
const queueRepository = new QueueRepository();

const createUserSchema = z.object({
  username: z.string().min(1, "Username é obrigatório"),
  password: z.string().min(6, "Senha deve ter no mínimo 6 caracteres"),
  name: z.string().min(1, "Nome é obrigatório"),
  role: z.nativeEnum(Role),
});

const updateUserSchema = z.object({
  name: z.string().min(1, "Nome é obrigatório").optional(),
  role: z.nativeEnum(Role).optional(),
  password: z.string().min(6, "Senha deve ter no mínimo 6 caracteres").optional(),
});

router.get("/", authMiddleware, requireRole(["RECEPCAO"]), asyncHandler(async (req: Request, res: Response) => {
  const users = await userService.listUsers();
  res.json(users);
}));

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

router.patch("/:id", authMiddleware, requireRole(["RECEPCAO"]), async (req: Request, res: Response) => {
  try {
    const data = updateUserSchema.parse(req.body);
    const user = await userService.updateUser(req.params.id, data);
    res.json(user);
  } catch (error) {
    if (error instanceof z.ZodError) {
      res.status(400).json({ error: error.errors });
      return;
    }
    res.status(400).json({ error: (error as Error).message });
  }
});

router.get("/active-vets", authMiddleware, requireRole(["RECEPCAO"]), asyncHandler(async (req: Request, res: Response) => {
  const activeVets = await queueRepository.getActiveVets();
  res.json(activeVets);
}));

router.post("/rooms/:roomId/check-in", authMiddleware, requireRole(["VET"]), async (req: AuthenticatedRequest, res: Response) => {
  try {
    const vetId = req.user?.id;
    if (!vetId) {
      res.status(401).json({ error: "Não autenticado" });
      return;
    }
    const user = await userService.checkInRoom(vetId, req.params.roomId);
    res.json(user);
  } catch (error) {
    res.status(400).json({ error: (error as Error).message });
  }
});

router.post("/rooms/check-out", authMiddleware, requireRole(["VET"]), async (req: AuthenticatedRequest, res: Response) => {
  try {
    const vetId = req.user?.id;
    if (!vetId) {
      res.status(401).json({ error: "Não autenticado" });
      return;
    }
    const user = await userService.checkOutRoom(vetId);
    res.json(user);
  } catch (error) {
    res.status(400).json({ error: (error as Error).message });
  }
});

router.post("/:vetId/rooms/check-out", authMiddleware, requireRole(["RECEPCAO"]), async (req: Request, res: Response) => {
  try {
    const user = await userService.checkOutRoom(req.params.vetId);
    res.json(user);
  } catch (error) {
    res.status(400).json({ error: (error as Error).message });
  }
});

router.post("/rooms/:roomId/change", authMiddleware, requireRole(["VET"]), async (req: AuthenticatedRequest, res: Response) => {
  try {
    const vetId = req.user?.id;
    if (!vetId) {
      res.status(401).json({ error: "Não autenticado" });
      return;
    }
    const user = await userService.changeRoom(vetId, req.params.roomId);
    res.json(user);
  } catch (error) {
    res.status(400).json({ error: (error as Error).message });
  }
});

export default router;


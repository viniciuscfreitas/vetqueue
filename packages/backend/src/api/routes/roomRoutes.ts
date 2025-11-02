import { Router, Request, Response } from "express";
import { RoomService } from "../../services/roomService";
import { RoomRepository } from "../../repositories/roomRepository";
import { authMiddleware, requireRole } from "../../middleware/authMiddleware";
import { z } from "zod";
import { asyncHandler } from "../../middleware/asyncHandler";

const router = Router();
const repository = new RoomRepository();
const roomService = new RoomService(repository);

const createRoomSchema = z.object({
  name: z.string().min(1, "Nome da sala é obrigatório"),
});

const updateRoomSchema = z.object({
  name: z.string().optional(),
  isActive: z.boolean().optional(),
});

router.get("/", authMiddleware, asyncHandler(async (req: Request, res: Response) => {
  const rooms = await roomService.listRooms();
  res.json(rooms);
}));

router.get("/all", authMiddleware, requireRole(["RECEPCAO"]), asyncHandler(async (req: Request, res: Response) => {
  const rooms = await roomService.getAllRooms();
  res.json(rooms);
}));

router.post("/", authMiddleware, requireRole(["RECEPCAO"]), async (req: Request, res: Response) => {
  try {
    const data = createRoomSchema.parse(req.body);
    const room = await roomService.createRoom(data);
    res.status(201).json(room);
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
    const data = updateRoomSchema.parse(req.body);
    const room = await roomService.updateRoom(req.params.id, data);
    res.json(room);
  } catch (error) {
    if (error instanceof z.ZodError) {
      res.status(400).json({ error: error.errors });
      return;
    }
    res.status(400).json({ error: (error as Error).message });
  }
});

router.delete("/:id", authMiddleware, requireRole(["RECEPCAO"]), asyncHandler(async (req: Request, res: Response) => {
  await roomService.deleteRoom(req.params.id);
  res.json({ message: "Sala desativada com sucesso" });
}));

export default router;


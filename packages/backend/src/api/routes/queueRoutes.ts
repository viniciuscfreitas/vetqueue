import { Router, Request, Response } from "express";
import { QueueService } from "../../services/queueService";
import { QueueRepository } from "../../repositories/queueRepository";
import { Priority, ServiceType } from "../../core/types";
import { authMiddleware, AuthenticatedRequest, requireRole } from "../../middleware/authMiddleware";
import { z } from "zod";

const router = Router();
const repository = new QueueRepository();
const queueService = new QueueService(repository);

const addQueueSchema = z.object({
  patientName: z.string().min(1, "Nome do paciente é obrigatório"),
  tutorName: z.string().min(1, "Nome do tutor é obrigatório"),
  serviceType: z.nativeEnum(ServiceType),
  priority: z.nativeEnum(Priority).optional(),
  assignedVetId: z.string().optional(),
});

const callNextSchema = z.object({
  vetId: z.string().optional(),
  roomId: z.string().min(1, "Sala é obrigatória"),
});

router.post("/", authMiddleware, async (req: Request, res: Response) => {
  try {
    const data = addQueueSchema.parse(req.body);
    const entry = await queueService.addToQueue(data);
    res.status(201).json(entry);
  } catch (error) {
    if (error instanceof z.ZodError) {
      res.status(400).json({ error: error.errors });
      return;
    }
    res.status(400).json({ error: (error as Error).message });
  }
});

router.get("/active", authMiddleware, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const vetId = req.query.vetId as string | undefined;
    const finalVetId = vetId === "null" ? null : vetId;
    const entries = await queueService.listActive(finalVetId);
    res.json(entries);
  } catch (error) {
    res.status(500).json({ error: (error as Error).message });
  }
});

router.post("/call-next", authMiddleware, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const data = callNextSchema.parse(req.body);
    const vetId = data.vetId || (req.user?.role === "VET" ? req.user.id : undefined);
    const next = await queueService.callNext(vetId, data.roomId);
    if (!next) {
      res.status(200).json({ message: "Nenhuma entrada aguardando na fila" });
      return;
    }
    res.json(next);
  } catch (error) {
    if (error instanceof z.ZodError) {
      res.status(400).json({ error: error.errors });
      return;
    }
    res.status(400).json({ error: (error as Error).message });
  }
});

router.post("/:id/claim", authMiddleware, requireRole(["VET"]), async (req: AuthenticatedRequest, res: Response) => {
  try {
    const entry = await queueService.claimPatient(req.params.id, req.user!.id);
    res.json(entry);
  } catch (error) {
    res.status(400).json({ error: (error as Error).message });
  }
});

router.patch("/:id/start", authMiddleware, async (req: Request, res: Response) => {
  try {
    const entry = await queueService.startService(req.params.id);
    res.json(entry);
  } catch (error) {
    res.status(400).json({ error: (error as Error).message });
  }
});

router.patch("/:id/complete", authMiddleware, async (req: Request, res: Response) => {
  try {
    const entry = await queueService.completeService(req.params.id);
    res.json(entry);
  } catch (error) {
    res.status(400).json({ error: (error as Error).message });
  }
});

router.patch("/:id/cancel", authMiddleware, requireRole(["RECEPCAO"]), async (req: Request, res: Response) => {
  try {
    const entry = await queueService.cancelEntry(req.params.id);
    res.json(entry);
  } catch (error) {
    res.status(400).json({ error: (error as Error).message });
  }
});

interface HistoryFilters {
  startDate?: Date;
  endDate?: Date;
  tutorName?: string;
  serviceType?: ServiceType;
}

router.get("/history", authMiddleware, async (req: Request, res: Response) => {
  try {
    const filters: HistoryFilters = {};

    if (req.query.startDate) {
      const dateStr = req.query.startDate as string;
      const date = new Date(dateStr + "T00:00:00-03:00");
      filters.startDate = date;
    }
    if (req.query.endDate) {
      const dateStr = req.query.endDate as string;
      const date = new Date(dateStr + "T23:59:59.999-03:00");
      filters.endDate = date;
    }
    if (req.query.tutorName) {
      filters.tutorName = req.query.tutorName as string;
    }
    if (req.query.serviceType) {
      filters.serviceType = req.query.serviceType as ServiceType;
    }

    const entries = await queueService.getHistory(filters);
    res.json(entries);
  } catch (error) {
    res.status(500).json({ error: (error as Error).message });
  }
});

router.get("/reports", authMiddleware, async (req: Request, res: Response) => {
  try {
    const startDate = req.query.startDate
      ? new Date((req.query.startDate as string) + "T00:00:00-03:00")
      : new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    const endDate = req.query.endDate
      ? new Date((req.query.endDate as string) + "T23:59:59.999-03:00")
      : new Date();

    const stats = await queueService.getReports(startDate, endDate);
    res.json(stats);
  } catch (error) {
    res.status(500).json({ error: (error as Error).message });
  }
});

router.get("/room-occupations", authMiddleware, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const vetId = req.user?.id;
    const occupations = await queueService.getRoomOccupations(vetId);
    res.json(occupations);
  } catch (error) {
    res.status(500).json({ error: (error as Error).message });
  }
});

export default router;


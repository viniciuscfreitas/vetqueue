import { Router, Request, Response } from "express";
import { QueueService } from "../../services/queueService";
import { QueueRepository } from "../../repositories/queueRepository";
import { Priority, ServiceType } from "../../core/types";
import { z } from "zod";

const router = Router();
const repository = new QueueRepository();
const queueService = new QueueService(repository);

const addQueueSchema = z.object({
  patientName: z.string().min(1, "Nome do paciente é obrigatório"),
  tutorName: z.string().min(1, "Nome do tutor é obrigatório"),
  serviceType: z.nativeEnum(ServiceType),
  priority: z.nativeEnum(Priority).optional(),
});

router.post("/", async (req: Request, res: Response) => {
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

router.get("/active", async (req: Request, res: Response) => {
  try {
    const entries = await queueService.listActive();
    res.json(entries);
  } catch (error) {
    res.status(500).json({ error: (error as Error).message });
  }
});

router.post("/call-next", async (req: Request, res: Response) => {
  try {
    const next = await queueService.callNext();
    if (!next) {
      res.status(404).json({ message: "Nenhuma entrada aguardando na fila" });
      return;
    }
    res.json(next);
  } catch (error) {
    res.status(500).json({ error: (error as Error).message });
  }
});

router.patch("/:id/start", async (req: Request, res: Response) => {
  try {
    const entry = await queueService.startService(req.params.id);
    res.json(entry);
  } catch (error) {
    res.status(400).json({ error: (error as Error).message });
  }
});

router.patch("/:id/complete", async (req: Request, res: Response) => {
  try {
    const entry = await queueService.completeService(req.params.id);
    res.json(entry);
  } catch (error) {
    res.status(400).json({ error: (error as Error).message });
  }
});

router.patch("/:id/cancel", async (req: Request, res: Response) => {
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

router.get("/history", async (req: Request, res: Response) => {
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

router.get("/reports", async (req: Request, res: Response) => {
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

export default router;


import { Router, Request, Response } from "express";
import { QueueService } from "../../services/queueService";
import { QueueRepository } from "../../repositories/queueRepository";
import { AuditService } from "../../services/auditService";
import { AuditRepository } from "../../repositories/auditRepository";
import { Priority } from "../../core/types";
import { authMiddleware, AuthenticatedRequest, requireRole } from "../../middleware/authMiddleware";
import { z } from "zod";

const router = Router();
const repository = new QueueRepository();
const queueService = new QueueService(repository);
const auditRepository = new AuditRepository();
const auditService = new AuditService(auditRepository);

const addQueueSchema = z.object({
  patientName: z.string().min(1, "Nome do paciente é obrigatório"),
  tutorName: z.string().min(1, "Nome do tutor é obrigatório"),
  serviceType: z.string().min(1, "Tipo de serviço é obrigatório"),
  priority: z.nativeEnum(Priority).optional(),
  assignedVetId: z.string().optional(),
  hasScheduledAppointment: z.boolean().optional(),
  scheduledAt: z.string().datetime().optional(),
});

const callNextSchema = z.object({
  vetId: z.string().optional(),
  roomId: z.string().min(1, "Sala é obrigatória"),
});

const callPatientSchema = z.object({
  vetId: z.string().optional(),
  roomId: z.string().min(1, "Sala é obrigatória"),
});

router.post("/", authMiddleware, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const data = addQueueSchema.parse(req.body);
    const entry = await queueService.addToQueue({
      ...data,
      scheduledAt: data.scheduledAt ? new Date(data.scheduledAt) : undefined,
    });
    if (req.user) {
      auditService.log({
        userId: req.user.id,
        action: "CREATE",
        entityType: "QueueEntry",
        entityId: entry.id,
        metadata: { patientName: entry.patientName, tutorName: entry.tutorName, serviceType: entry.serviceType },
      }).catch(console.error);
    }
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
    if (req.user) {
      auditService.log({
        userId: req.user.id,
        action: "CALL",
        entityType: "QueueEntry",
        entityId: next.id,
        metadata: { roomId: data.roomId },
      }).catch(console.error);
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

router.post("/:id/call", authMiddleware, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const data = callPatientSchema.parse(req.body);
    const vetId = data.vetId || (req.user?.role === "VET" ? req.user.id : undefined);
    const entry = await queueService.callPatient(req.params.id, vetId, data.roomId);
    if (req.user) {
      auditService.log({
        userId: req.user.id,
        action: "CALL_DIRECT",
        entityType: "QueueEntry",
        entityId: entry.id,
        metadata: { roomId: data.roomId },
      }).catch(console.error);
    }
    res.json(entry);
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

router.patch("/:id/start", authMiddleware, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const userRole = req.user?.role;
    const entry = await queueService.startService(req.params.id, userRole);
    if (req.user) {
      auditService.log({
        userId: req.user.id,
        action: "START",
        entityType: "QueueEntry",
        entityId: entry.id,
      }).catch(console.error);
    }
    res.json(entry);
  } catch (error) {
    res.status(400).json({ error: (error as Error).message });
  }
});

router.patch("/:id/complete", authMiddleware, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const userRole = req.user?.role;
    const entry = await queueService.completeService(req.params.id, userRole);
    if (req.user) {
      auditService.log({
        userId: req.user.id,
        action: "COMPLETE",
        entityType: "QueueEntry",
        entityId: entry.id,
      }).catch(console.error);
    }
    res.json(entry);
  } catch (error) {
    res.status(400).json({ error: (error as Error).message });
  }
});

router.patch("/:id/cancel", authMiddleware, requireRole(["RECEPCAO"]), async (req: AuthenticatedRequest, res: Response) => {
  try {
    const entry = await queueService.cancelEntry(req.params.id);
    if (req.user) {
      auditService.log({
        userId: req.user.id,
        action: "CANCEL",
        entityType: "QueueEntry",
        entityId: entry.id,
      }).catch(console.error);
    }
    res.json(entry);
  } catch (error) {
    res.status(400).json({ error: (error as Error).message });
  }
});

interface HistoryFilters {
  startDate?: Date;
  endDate?: Date;
  tutorName?: string;
  patientName?: string;
  serviceType?: string;
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
    if (req.query.patientName) {
      filters.patientName = req.query.patientName as string;
    }
    if (req.query.serviceType) {
      filters.serviceType = req.query.serviceType as string;
    }

    const page = req.query.page ? parseInt(req.query.page as string) : undefined;
    const limit = req.query.limit ? parseInt(req.query.limit as string) : undefined;

    if (page !== undefined || limit !== undefined) {
      const result = await queueService.getHistoryPaginated({
        ...filters,
        page,
        limit,
      });
      res.json(result);
    } else {
      const entries = await queueService.getHistory(filters);
      res.json(entries);
    }
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

router.get("/vet-stats/:vetId", authMiddleware, async (req: Request, res: Response) => {
  try {
    const startDate = req.query.startDate
      ? new Date((req.query.startDate as string) + "T00:00:00-03:00")
      : new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    const endDate = req.query.endDate
      ? new Date((req.query.endDate as string) + "T23:59:59.999-03:00")
      : new Date();

    const stats = await queueService.getVetStats(req.params.vetId, startDate, endDate);
    res.json(stats);
  } catch (error) {
    res.status(500).json({ error: (error as Error).message });
  }
});

router.get("/entry/:id/audit", authMiddleware, requireRole(["RECEPCAO"]), async (req: Request, res: Response) => {
  try {
    const logs = await auditService.getAuditLogsByEntity("QueueEntry", req.params.id);
    res.json(logs);
  } catch (error) {
    res.status(500).json({ error: (error as Error).message });
  }
});

router.get("/audit/logs", authMiddleware, requireRole(["RECEPCAO"]), async (req: Request, res: Response) => {
  try {
    const filters: any = {};

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
    if (req.query.userId) {
      filters.userId = req.query.userId as string;
    }
    if (req.query.action) {
      filters.action = req.query.action as string;
    }
    if (req.query.entityType) {
      filters.entityType = req.query.entityType as string;
    }

    const page = req.query.page ? parseInt(req.query.page as string) : undefined;
    const limit = req.query.limit ? parseInt(req.query.limit as string) : undefined;

    const result = await auditService.getAllLogs({
      ...filters,
      page,
      limit,
    });
    
    res.json({
      entries: result.logs,
      total: result.total,
      page: result.page,
      totalPages: result.totalPages,
    });
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

router.post("/upgrade-priorities", authMiddleware, async (req: Request, res: Response) => {
  try {
    const upgradedEntries = await queueService.upgradeScheduledPriorities();
    res.json({ upgraded: upgradedEntries.map(e => e.id), entries: upgradedEntries });
  } catch (error) {
    res.status(500).json({ error: (error as Error).message });
  }
});

export default router;


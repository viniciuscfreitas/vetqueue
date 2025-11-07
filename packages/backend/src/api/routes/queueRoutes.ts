import { Router, Request, Response } from "express";
import { QueueService } from "../../services/queueService";
import { QueueRepository } from "../../repositories/queueRepository";
import { AuditService } from "../../services/auditService";
import { AuditRepository } from "../../repositories/auditRepository";
import { Priority, PaymentStatus, ModuleKey } from "../../core/types";
import { authMiddleware, AuthenticatedRequest, requireRole, requireModule } from "../../middleware/authMiddleware";
import { z } from "zod";
import { parseDateRange } from "../../utils/dateParsing";
import { asyncHandler } from "../../middleware/asyncHandler";
import { logger } from "../../lib/logger";
import auditRoutes from "./auditRoutes";

const router = Router();
const repository = new QueueRepository();
const queueService = new QueueService(repository);
const auditRepository = new AuditRepository();
const auditService = new AuditService(auditRepository);

const paymentMethodEnum = z.enum(["CREDIT", "DEBIT", "CASH", "PIX"]);
const paymentStatusEnum = z.enum(["PENDING", "PARTIAL", "PAID", "CANCELLED"]);

const addQueueSchema = z.object({
  patientName: z.string().min(1, "Nome do paciente é obrigatório"),
  tutorName: z.string().min(1, "Nome do tutor é obrigatório"),
  serviceType: z.string().min(1, "Tipo de serviço é obrigatório"),
  priority: z.nativeEnum(Priority).optional(),
  assignedVetId: z.string().optional(),
  hasScheduledAppointment: z.boolean().optional(),
  scheduledAt: z.string().datetime().optional(),
  patientId: z.string().optional(),
  simplesVetId: z.string().optional(),
  paymentMethod: paymentMethodEnum.optional(),
});

const updateQueueSchema = z.object({
  patientName: z.string().min(1, "Nome do paciente é obrigatório").optional(),
  tutorName: z.string().min(1, "Nome do tutor é obrigatório").optional(),
  serviceType: z.string().min(1, "Tipo de serviço é obrigatório").optional(),
  priority: z.nativeEnum(Priority).optional(),
  assignedVetId: z.string().nullable().optional(),
  hasScheduledAppointment: z.boolean().optional(),
  scheduledAt: z.string().datetime().optional(),
  patientId: z.string().nullable().optional(),
  simplesVetId: z.string().nullable().optional(),
  paymentMethod: paymentMethodEnum.nullable().optional(),
});

const callNextSchema = z.object({
  vetId: z.string().optional(),
  roomId: z.string().min(1, "Sala é obrigatória"),
});

const callPatientSchema = z.object({
  vetId: z.string().optional(),
  roomId: z.string().min(1, "Sala é obrigatória"),
});

function extractFinancialFilters(req: Request) {
  const filters: {
    tutorName?: string;
    patientName?: string;
    paymentMethod?: string;
    paymentStatus?: PaymentStatus;
    paymentReceivedById?: string;
    serviceType?: string;
    minAmount?: string;
    maxAmount?: string;
  } = {};

  if (req.query.tutorName) {
    filters.tutorName = req.query.tutorName as string;
  }

  if (req.query.patientName) {
    filters.patientName = req.query.patientName as string;
  }

  if (req.query.paymentMethod) {
    const parsedMethod = paymentMethodEnum.safeParse(req.query.paymentMethod);
    if (parsedMethod.success) {
      filters.paymentMethod = parsedMethod.data;
    }
  }

  if (req.query.paymentStatus) {
    const parsedStatus = paymentStatusEnum.safeParse(req.query.paymentStatus);
    if (parsedStatus.success) {
      filters.paymentStatus = parsedStatus.data as PaymentStatus;
    }
  }

  if (req.query.paymentReceivedById) {
    filters.paymentReceivedById = req.query.paymentReceivedById as string;
  }

  if (req.query.serviceType) {
    filters.serviceType = req.query.serviceType as string;
  }

  if (req.query.minAmount) {
    filters.minAmount = String(req.query.minAmount);
  }

  if (req.query.maxAmount) {
    filters.maxAmount = String(req.query.maxAmount);
  }

  return filters;
}

const paymentSchema = z.object({
  paymentMethod: paymentMethodEnum.nullable().optional(),
  paymentStatus: paymentStatusEnum.optional(),
  paymentAmount: z.union([z.string(), z.number()]).nullable().optional(),
  paymentReceivedAt: z.string().datetime().nullable().optional(),
  paymentNotes: z.string().nullable().optional(),
  paymentReceivedById: z.string().nullable().optional(),
});

router.post("/", authMiddleware, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const data = addQueueSchema.parse(req.body);
    const entry = await queueService.addToQueue({
      ...data,
      scheduledAt: data.scheduledAt ? new Date(data.scheduledAt) : undefined,
      patientId: data.patientId,
    });
    if (req.user) {
      auditService.log({
        userId: req.user.id,
        action: "CREATE",
        entityType: "QueueEntry",
        entityId: entry.id,
        metadata: { patientName: entry.patientName, tutorName: entry.tutorName, serviceType: entry.serviceType },
      }).catch((error) => {
        logger.error("Failed to log audit", {
          error: error instanceof Error ? error.message : String(error)
        });
      });
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

router.get("/active", authMiddleware, asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  const vetId = req.query.vetId as string | undefined;
  const finalVetId = vetId === "null" ? null : vetId;
  const entries = await queueService.listActive(finalVetId);
  res.json(entries);
}));

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
        metadata: {
          patientName: next.patientName,
          tutorName: next.tutorName,
          serviceType: next.serviceType,
          roomId: data.roomId,
        },
      }).catch((error) => {
        logger.error("Failed to log audit", {
          error: error instanceof Error ? error.message : String(error)
        });
      });
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
        metadata: {
          patientName: entry.patientName,
          tutorName: entry.tutorName,
          serviceType: entry.serviceType,
          roomId: data.roomId,
        },
      }).catch((error) => {
        logger.error("Failed to log audit", {
          error: error instanceof Error ? error.message : String(error)
        });
      });
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

router.post("/:id/claim", authMiddleware, requireRole(["VET"]), asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  const entry = await queueService.claimPatient(req.params.id, req.user!.id);
  res.json(entry);
}));

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
        metadata: {
          patientName: entry.patientName,
          tutorName: entry.tutorName,
          serviceType: entry.serviceType,
        },
      }).catch((error) => {
        logger.error("Failed to log audit", {
          error: error instanceof Error ? error.message : String(error)
        });
      });
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
        metadata: {
          patientName: entry.patientName,
          tutorName: entry.tutorName,
          serviceType: entry.serviceType,
        },
      }).catch((error) => {
        logger.error("Failed to log audit", {
          error: error instanceof Error ? error.message : String(error)
        });
      });
    }
    res.json(entry);
  } catch (error) {
    res.status(400).json({ error: (error as Error).message });
  }
});

router.patch("/:id/cancel", authMiddleware, requireModule(ModuleKey.QUEUE), async (req: AuthenticatedRequest, res: Response) => {
  try {
    const entry = await queueService.cancelEntry(req.params.id);
    if (req.user) {
      auditService.log({
        userId: req.user.id,
        action: "CANCEL",
        entityType: "QueueEntry",
        entityId: entry.id,
        metadata: {
          patientName: entry.patientName,
          tutorName: entry.tutorName,
          serviceType: entry.serviceType,
        },
      }).catch((error) => {
        logger.error("Failed to log audit", {
          error: error instanceof Error ? error.message : String(error)
        });
      });
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

router.get("/history", authMiddleware, asyncHandler(async (req: Request, res: Response) => {
  const dateRange = parseDateRange(req.query);
  const filters: HistoryFilters = {
    startDate: dateRange.start,
    endDate: dateRange.end,
  };
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
}));

router.get("/reports", authMiddleware, asyncHandler(async (req: Request, res: Response) => {
  const dateRange = parseDateRange(req.query);
  const startDate = dateRange.start || new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
  const endDate = dateRange.end || new Date();

  const stats = await queueService.getReports(startDate, endDate);
  res.json(stats);
}));

router.get("/vet-stats/:vetId", authMiddleware, asyncHandler(async (req: Request, res: Response) => {
  const dateRange = parseDateRange(req.query);
  const startDate = dateRange.start || new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
  const endDate = dateRange.end || new Date();

  const stats = await queueService.getVetStats(req.params.vetId, startDate, endDate);
  res.json(stats);
}));

router.get("/reports/patients", authMiddleware, asyncHandler(async (req: Request, res: Response) => {
  const dateRange = parseDateRange(req.query);
  const startDate = dateRange.start || new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
  const endDate = dateRange.end || new Date();

  const stats = await queueService.getPatientStatistics(startDate, endDate);
  res.json(stats);
}));

router.get("/reports/consultations", authMiddleware, asyncHandler(async (req: Request, res: Response) => {
  const dateRange = parseDateRange(req.query);
  const startDate = dateRange.start || new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
  const endDate = dateRange.end || new Date();

  const stats = await queueService.getConsultationStatistics(startDate, endDate);
  res.json(stats);
}));

router.get("/reports/vaccinations", authMiddleware, asyncHandler(async (req: Request, res: Response) => {
  const dateRange = parseDateRange(req.query);
  const startDate = dateRange.start || new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
  const endDate = dateRange.end || new Date();

  const stats = await queueService.getVaccinationStatistics(startDate, endDate);
  res.json(stats);
}));

router.get("/reports/rooms", authMiddleware, asyncHandler(async (req: Request, res: Response) => {
  const dateRange = parseDateRange(req.query);
  const startDate = dateRange.start || new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
  const endDate = dateRange.end || new Date();

  const stats = await queueService.getRoomUtilization(startDate, endDate);
  res.json(stats);
}));

router.get("/entry/:id/audit", authMiddleware, requireModule(ModuleKey.AUDIT), asyncHandler(async (req: Request, res: Response) => {
  const logs = await auditService.getAuditLogsByEntity("QueueEntry", req.params.id);
  res.json(logs);
}));

router.use("/audit", auditRoutes);

router.get("/room-occupations", authMiddleware, asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  const vetId = req.user?.id;
  const occupations = await queueService.getRoomOccupations(vetId);
  res.json(occupations);
}));


router.patch("/:id", authMiddleware, requireModule(ModuleKey.QUEUE), async (req: AuthenticatedRequest, res: Response) => {
  try {
    const data = updateQueueSchema.parse(req.body);
    const userRole = req.user?.role;

    const updatedEntry = await queueService.updateEntry(
      req.params.id,
      {
        ...data,
        scheduledAt: data.scheduledAt ? new Date(data.scheduledAt) : undefined,
        patientId: data.patientId || null,
      },
      userRole
    );

    if (req.user) {
      auditService.log({
        userId: req.user.id,
        action: "UPDATE",
        entityType: "QueueEntry",
        entityId: updatedEntry.id,
        metadata: { patientName: updatedEntry.patientName, tutorName: updatedEntry.tutorName, serviceType: updatedEntry.serviceType },
      }).catch((error) => {
        logger.error("Failed to log audit", {
          error: error instanceof Error ? error.message : String(error)
        });
      });
    }

    res.json(updatedEntry);
  } catch (error) {
    if (error instanceof z.ZodError) {
      res.status(400).json({ error: error.errors });
      return;
    }
    res.status(400).json({ error: (error as Error).message });
  }
});

router.get("/financial", authMiddleware, requireModule(ModuleKey.FINANCIAL), asyncHandler(async (req: AuthenticatedRequest, res: Response) => {

  const dateRange = parseDateRange(req.query);
  const filters: any = extractFinancialFilters(req);

  if (dateRange.start) {
    filters.startDate = dateRange.start;
  }
  if (dateRange.end) {
    filters.endDate = dateRange.end;
  }

  const page = req.query.page ? parseInt(req.query.page as string) : undefined;
  const limit = req.query.limit ? parseInt(req.query.limit as string) : undefined;

  const result = await queueService.getFinancialEntries({
    ...filters,
    page: page || 1,
    limit: limit || 20,
  });
  res.json(result);
}));

router.patch("/:id/payment", authMiddleware, requireModule(ModuleKey.FINANCIAL), asyncHandler(async (req: AuthenticatedRequest, res: Response) => {

  try {
    const validated = paymentSchema.parse(req.body);

    const paymentAmount =
      validated.paymentAmount === undefined
        ? undefined
        : validated.paymentAmount === null || validated.paymentAmount === ""
          ? null
          : typeof validated.paymentAmount === "number"
            ? validated.paymentAmount.toFixed(2)
            : validated.paymentAmount;

    const paymentReceivedAt =
      validated.paymentReceivedAt === undefined
        ? undefined
        : validated.paymentReceivedAt === null
          ? null
          : new Date(validated.paymentReceivedAt);

    const updatedEntry = await queueService.updatePayment(
      req.params.id,
      {
        paymentMethod: validated.paymentMethod ?? undefined,
        paymentStatus: validated.paymentStatus ? (validated.paymentStatus as PaymentStatus) : undefined,
        paymentAmount,
        paymentReceivedAt,
        paymentNotes: validated.paymentNotes ?? undefined,
        paymentReceivedById: validated.paymentReceivedById ?? undefined,
      },
      req.user?.id
    );

    if (req.user) {
      auditService.log({
        userId: req.user.id,
        action: "UPDATE_PAYMENT",
        entityType: "QueueEntry",
        entityId: updatedEntry.id,
        metadata: {
          paymentMethod: validated.paymentMethod ?? null,
          paymentStatus: validated.paymentStatus ?? null,
          paymentAmount,
        },
      }).catch((error) => {
        logger.error("Failed to log audit", {
          error: error instanceof Error ? error.message : String(error)
        });
      });
    }

    res.json(updatedEntry);
  } catch (error) {
    if (error instanceof z.ZodError) {
      res.status(400).json({ error: error.errors });
      return;
    }
    res.status(400).json({ error: (error as Error).message });
  }
}));

router.get("/financial/summary", authMiddleware, requireModule(ModuleKey.FINANCIAL), asyncHandler(async (req: AuthenticatedRequest, res: Response) => {

  const dateRange = parseDateRange(req.query);
  const startDate = dateRange.start || new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
  const endDate = dateRange.end || new Date();

  const filters = extractFinancialFilters(req);

  const summary = await queueService.getFinancialSummary(startDate, endDate, filters);
  res.json(summary);
}));

router.get("/financial/reports", authMiddleware, requireModule(ModuleKey.FINANCIAL), asyncHandler(async (req: AuthenticatedRequest, res: Response) => {

  const dateRange = parseDateRange(req.query);
  const startDate = dateRange.start || new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
  const endDate = dateRange.end || new Date();

  const filters = extractFinancialFilters(req);

  const reports = await queueService.getFinancialReports(startDate, endDate, filters);
  res.json(reports);
}));

export default router;


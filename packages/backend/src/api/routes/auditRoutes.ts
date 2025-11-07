import { Router, Request, Response } from "express";
import { ModuleKey } from "../../core/types";
import { AuditRepository } from "../../repositories/auditRepository";
import { AuditService } from "../../services/auditService";
import { authMiddleware, requireModule } from "../../middleware/authMiddleware";
import { asyncHandler } from "../../middleware/asyncHandler";
import { parseDateRange } from "../../utils/dateParsing";

const router = Router();
const auditRepository = new AuditRepository();
const auditService = new AuditService(auditRepository);

function parseModule(value: unknown): ModuleKey | undefined {
  if (typeof value !== "string") {
    return undefined;
  }

  const moduleValues = Object.values(ModuleKey) as string[];
  if (moduleValues.includes(value)) {
    return value as ModuleKey;
  }

  return undefined;
}

router.get(
  "/logs",
  authMiddleware,
  requireModule(ModuleKey.AUDIT),
  asyncHandler(async (req: Request, res: Response) => {
    const dateRange = parseDateRange(req.query);
    const page = req.query.page ? parseInt(req.query.page as string, 10) : undefined;
    const limit = req.query.limit ? parseInt(req.query.limit as string, 10) : undefined;

    const result = await auditService.getAllLogs({
      startDate: dateRange.start,
      endDate: dateRange.end,
      userId: req.query.userId as string | undefined,
      action: req.query.action as string | undefined,
      entityType: req.query.entityType as string | undefined,
      module: parseModule(req.query.module),
      page,
      limit,
    });

    res.json({
      entries: result.logs,
      total: result.total,
      page: result.page,
      totalPages: result.totalPages,
    });
  })
);

export default router;


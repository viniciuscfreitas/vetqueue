import { Router, Request, Response } from "express";
import { z } from "zod";
import { PermissionService } from "../../services/permissionService";
import { authMiddleware, requireModule } from "../../middleware/authMiddleware";
import { asyncHandler } from "../../middleware/asyncHandler";
import { ModuleKey, Role } from "../../core/types";

const router = Router();
const permissionService = new PermissionService();

const roleParamSchema = z.object({
  role: z.nativeEnum(Role),
});

const updateModulesSchema = z.object({
  modules: z.array(z.string()).default([]),
});

router.get(
  "/modules",
  authMiddleware,
  requireModule(ModuleKey.PERMISSIONS),
  (req: Request, res: Response) => {
    const modules = permissionService.listModules();
    res.json(modules);
  }
);

router.get(
  "/roles/:role",
  authMiddleware,
  requireModule(ModuleKey.PERMISSIONS),
  asyncHandler(async (req: Request, res: Response) => {
    const { role } = roleParamSchema.parse(req.params);
    const modules = await permissionService.getModulesForRole(role);
    res.json({ role, modules });
  })
);

router.patch(
  "/roles/:role",
  authMiddleware,
  requireModule(ModuleKey.PERMISSIONS),
  asyncHandler(async (req: Request, res: Response) => {
    const { role } = roleParamSchema.parse(req.params);
    const { modules } = updateModulesSchema.parse(req.body ?? {});

    const updated = await permissionService.setModulesForRole(role, modules);

    res.json({ role, modules: updated });
  })
);

router.get(
  "/",
  authMiddleware,
  requireModule(ModuleKey.PERMISSIONS),
  asyncHandler(async (_req: Request, res: Response) => {
    const permissions = await permissionService.getAllRoleModules();
    res.json(permissions);
  })
);

export default router;



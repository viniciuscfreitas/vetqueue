import { Router, Request, Response } from "express";
import { ServiceService } from "../../services/serviceService";
import { ServiceRepository } from "../../repositories/serviceRepository";
import { authMiddleware, requireModule } from "../../middleware/authMiddleware";
import { ModuleKey } from "../../core/types";
import { z } from "zod";
import { asyncHandler } from "../../middleware/asyncHandler";

const router = Router();
const repository = new ServiceRepository();
const serviceService = new ServiceService(repository);

const createServiceSchema = z.object({
  name: z.string().min(1, "Nome do serviço é obrigatório"),
});

const updateServiceSchema = z.object({
  name: z.string().optional(),
  isActive: z.boolean().optional(),
});

router.get("/", authMiddleware, asyncHandler(async (req: Request, res: Response) => {
  const services = await serviceService.listServices();
  res.json(services);
}));

router.get("/all", authMiddleware, requireModule(ModuleKey.ADMIN_SERVICES), asyncHandler(async (req: Request, res: Response) => {
  const services = await serviceService.getAllServices();
  res.json(services);
}));

router.post("/", authMiddleware, requireModule(ModuleKey.ADMIN_SERVICES), async (req: Request, res: Response) => {
  try {
    const data = createServiceSchema.parse(req.body);
    const service = await serviceService.createService(data);
    res.status(201).json(service);
  } catch (error) {
    if (error instanceof z.ZodError) {
      res.status(400).json({ error: error.errors });
      return;
    }
    res.status(400).json({ error: (error as Error).message });
  }
});

router.patch("/:id", authMiddleware, requireModule(ModuleKey.ADMIN_SERVICES), async (req: Request, res: Response) => {
  try {
    const data = updateServiceSchema.parse(req.body);
    const service = await serviceService.updateService(req.params.id, data);
    res.json(service);
  } catch (error) {
    if (error instanceof z.ZodError) {
      res.status(400).json({ error: error.errors });
      return;
    }
    res.status(400).json({ error: (error as Error).message });
  }
});

router.delete("/:id", authMiddleware, requireModule(ModuleKey.ADMIN_SERVICES), asyncHandler(async (req: Request, res: Response) => {
  await serviceService.deleteService(req.params.id);
  res.json({ message: "Serviço desativado com sucesso" });
}));

export default router;


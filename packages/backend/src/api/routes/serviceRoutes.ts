import { Router, Request, Response } from "express";
import { ServiceService } from "../../services/serviceService";
import { ServiceRepository } from "../../repositories/serviceRepository";
import { authMiddleware, requireRole } from "../../middleware/authMiddleware";
import { z } from "zod";

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

router.get("/", authMiddleware, async (req: Request, res: Response) => {
  try {
    const services = await serviceService.listServices();
    res.json(services);
  } catch (error) {
    res.status(500).json({ error: (error as Error).message });
  }
});

router.get("/all", authMiddleware, requireRole(["RECEPCAO"]), async (req: Request, res: Response) => {
  try {
    const services = await serviceService.getAllServices();
    res.json(services);
  } catch (error) {
    res.status(500).json({ error: (error as Error).message });
  }
});

router.post("/", authMiddleware, requireRole(["RECEPCAO"]), async (req: Request, res: Response) => {
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

router.patch("/:id", authMiddleware, requireRole(["RECEPCAO"]), async (req: Request, res: Response) => {
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

router.delete("/:id", authMiddleware, requireRole(["RECEPCAO"]), async (req: Request, res: Response) => {
  try {
    await serviceService.deleteService(req.params.id);
    res.json({ message: "Serviço desativado com sucesso" });
  } catch (error) {
    res.status(400).json({ error: (error as Error).message });
  }
});

export default router;


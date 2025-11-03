import { Router, Request, Response } from "express";
import { ConsultationService } from "../../services/consultationService";
import { ConsultationRepository } from "../../repositories/consultationRepository";
import { authMiddleware } from "../../middleware/authMiddleware";
import { z } from "zod";
import { asyncHandler } from "../../middleware/asyncHandler";

const router = Router();
const repository = new ConsultationRepository();
const consultationService = new ConsultationService(repository);

const createConsultationSchema = z.object({
  patientId: z.string().min(1, "ID do paciente é obrigatório"),
  queueEntryId: z.string().optional(),
  vetId: z.string().optional(),
  diagnosis: z.string().optional(),
  treatment: z.string().optional(),
  prescription: z.string().optional(),
  weightInKg: z.number().positive().optional(),
  notes: z.string().optional(),
  date: z.string().datetime().optional(),
});

const updateConsultationSchema = z.object({
  diagnosis: z.string().optional(),
  treatment: z.string().optional(),
  prescription: z.string().optional(),
  weightInKg: z.number().positive().optional(),
  notes: z.string().optional(),
  date: z.string().datetime().optional(),
});

router.get("/", authMiddleware, asyncHandler(async (req: Request, res: Response) => {
  const filters: { patientId?: string; queueEntryId?: string; vetId?: string } = {};
  if (req.query.patientId) {
    filters.patientId = req.query.patientId as string;
  }
  if (req.query.queueEntryId) {
    filters.queueEntryId = req.query.queueEntryId as string;
  }
  if (req.query.vetId) {
    filters.vetId = req.query.vetId as string;
  }
  const consultations = await consultationService.listConsultations(filters);
  res.json(consultations);
}));

router.get("/:id", authMiddleware, asyncHandler(async (req: Request, res: Response) => {
  const consultation = await consultationService.getConsultationById(req.params.id);
  res.json(consultation);
}));

router.post("/", authMiddleware, asyncHandler(async (req: Request, res: Response) => {
  const data = createConsultationSchema.parse(req.body);
  const consultation = await consultationService.createConsultation({
    ...data,
    date: data.date ? new Date(data.date) : undefined,
  });
  res.status(201).json(consultation);
}));

router.patch("/:id", authMiddleware, asyncHandler(async (req: Request, res: Response) => {
  const data = updateConsultationSchema.parse(req.body);
  const consultation = await consultationService.updateConsultation(req.params.id, {
    ...data,
    date: data.date ? new Date(data.date) : undefined,
  });
  res.json(consultation);
}));

router.delete("/:id", authMiddleware, asyncHandler(async (req: Request, res: Response) => {
  await consultationService.deleteConsultation(req.params.id);
  res.json({ message: "Consulta deletada com sucesso" });
}));

export default router;


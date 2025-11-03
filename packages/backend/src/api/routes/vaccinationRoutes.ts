import { Router, Request, Response } from "express";
import { VaccinationService } from "../../services/vaccinationService";
import { VaccinationRepository } from "../../repositories/vaccinationRepository";
import { authMiddleware } from "../../middleware/authMiddleware";
import { z } from "zod";
import { asyncHandler } from "../../middleware/asyncHandler";

const router = Router();
const repository = new VaccinationRepository();
const vaccinationService = new VaccinationService(repository);

const createVaccinationSchema = z.object({
  patientId: z.string().min(1, "ID do paciente é obrigatório"),
  vaccineName: z.string().min(1, "Nome da vacina é obrigatório"),
  appliedDate: z.string().datetime().optional(),
  batchNumber: z.string().optional(),
  vetId: z.string().optional(),
  nextDoseDate: z.string().datetime().optional(),
  notes: z.string().optional(),
});

const updateVaccinationSchema = z.object({
  vaccineName: z.string().min(1, "Nome da vacina é obrigatório").optional(),
  appliedDate: z.string().datetime().optional(),
  batchNumber: z.string().optional(),
  nextDoseDate: z.string().datetime().optional(),
  notes: z.string().optional(),
});

router.get("/", authMiddleware, asyncHandler(async (req: Request, res: Response) => {
  const filters: { patientId?: string; vetId?: string; upcomingDoses?: boolean } = {};
  if (req.query.patientId) {
    filters.patientId = req.query.patientId as string;
  }
  if (req.query.vetId) {
    filters.vetId = req.query.vetId as string;
  }
  if (req.query.upcomingDoses === "true") {
    filters.upcomingDoses = true;
  }
  const vaccinations = await vaccinationService.listVaccinations(filters);
  res.json(vaccinations);
}));

router.get("/suggestions", authMiddleware, asyncHandler(async (req: Request, res: Response) => {
  const suggestions = await vaccinationService.getVaccineNameSuggestions();
  res.json(suggestions);
}));

router.get("/:id", authMiddleware, asyncHandler(async (req: Request, res: Response) => {
  const vaccination = await vaccinationService.getVaccinationById(req.params.id);
  res.json(vaccination);
}));

router.post("/", authMiddleware, asyncHandler(async (req: Request, res: Response) => {
  const data = createVaccinationSchema.parse(req.body);
  const vaccination = await vaccinationService.createVaccination({
    ...data,
    appliedDate: data.appliedDate ? new Date(data.appliedDate) : undefined,
    nextDoseDate: data.nextDoseDate ? new Date(data.nextDoseDate) : undefined,
  });
  res.status(201).json(vaccination);
}));

router.patch("/:id", authMiddleware, asyncHandler(async (req: Request, res: Response) => {
  const data = updateVaccinationSchema.parse(req.body);
  const vaccination = await vaccinationService.updateVaccination(req.params.id, {
    ...data,
    appliedDate: data.appliedDate ? new Date(data.appliedDate) : undefined,
    nextDoseDate: data.nextDoseDate ? new Date(data.nextDoseDate) : undefined,
  });
  res.json(vaccination);
}));

router.delete("/:id", authMiddleware, asyncHandler(async (req: Request, res: Response) => {
  await vaccinationService.deleteVaccination(req.params.id);
  res.json({ message: "Vacina deletada com sucesso" });
}));

export default router;


import { Router, Request, Response } from "express";
import { PatientService } from "../../services/patientService";
import { PatientRepository } from "../../repositories/patientRepository";
import { QueueRepository } from "../../repositories/queueRepository";
import { authMiddleware, requireModule } from "../../middleware/authMiddleware";
import { ModuleKey } from "../../core/types";
import { z } from "zod";
import { asyncHandler } from "../../middleware/asyncHandler";

const router = Router();
const repository = new PatientRepository();
const patientService = new PatientService(repository);
const queueRepository = new QueueRepository();

const createPatientSchema = z.object({
  name: z.string().min(1, "Nome do paciente é obrigatório"),
  species: z.string().optional(),
  breed: z.string().optional(),
  birthDate: z.string().datetime().optional(),
  gender: z.string().optional(),
  microchip: z.string().optional(),
  color: z.string().optional(),
  currentWeight: z.number().optional(),
  allergies: z.string().optional(),
  ongoingMedications: z.string().optional(),
  temperament: z.string().optional(),
  neutered: z.boolean().optional(),
  photoUrl: z.string().url().optional(),
  tutorName: z.string().min(1, "Nome do tutor é obrigatório"),
  tutorPhone: z.string().optional(),
  tutorEmail: z.string().email().optional(),
  tutorCpfCnpj: z.string().optional(),
  tutorAddress: z.string().optional(),
  notes: z.string().optional(),
});

const updatePatientSchema = z.object({
  name: z.string().min(1, "Nome do paciente é obrigatório").optional(),
  species: z.string().optional(),
  breed: z.string().optional(),
  birthDate: z.string().datetime().optional(),
  gender: z.string().optional(),
  microchip: z.string().optional(),
  color: z.string().optional(),
  currentWeight: z.number().optional(),
  allergies: z.string().optional(),
  ongoingMedications: z.string().optional(),
  temperament: z.string().optional(),
  neutered: z.boolean().optional(),
  photoUrl: z.string().url().optional(),
  tutorName: z.string().min(1, "Nome do tutor é obrigatório").optional(),
  tutorPhone: z.string().optional(),
  tutorEmail: z.string().email().optional(),
  tutorCpfCnpj: z.string().optional(),
  tutorAddress: z.string().optional(),
  notes: z.string().optional(),
});

router.get("/", authMiddleware, asyncHandler(async (req: Request, res: Response) => {
  const filters: { name?: string; tutorName?: string; tutorId?: string; limit?: number } = {};
  if (req.query.name) {
    filters.name = req.query.name as string;
  }
  if (req.query.tutorName) {
    filters.tutorName = req.query.tutorName as string;
  }
  if (req.query.tutorId) {
    filters.tutorId = req.query.tutorId as string;
  }
  if (req.query.limit) {
    const parsedLimit = parseInt(req.query.limit as string, 10);
    if (!Number.isNaN(parsedLimit) && parsedLimit > 0) {
      filters.limit = Math.min(parsedLimit, 25);
    }
  }
  const patients = await patientService.listPatients(filters);
  res.json(patients);
}));

router.get("/:id/queue-entries", authMiddleware, asyncHandler(async (req: Request, res: Response) => {
  const entries = await queueRepository.findByPatientId(req.params.id);
  res.json(entries);
}));

router.get("/:id", authMiddleware, asyncHandler(async (req: Request, res: Response) => {
  const patient = await patientService.getPatientById(req.params.id);
  res.json(patient);
}));

router.post("/", authMiddleware, asyncHandler(async (req: Request, res: Response) => {
  const data = createPatientSchema.parse(req.body);
  const patient = await patientService.createPatient({
    ...data,
    birthDate: data.birthDate ? new Date(data.birthDate) : undefined,
  });
  res.status(201).json(patient);
}));

router.patch("/:id", authMiddleware, asyncHandler(async (req: Request, res: Response) => {
  const data = updatePatientSchema.parse(req.body);
  const patient = await patientService.updatePatient(req.params.id, {
    ...data,
    birthDate: data.birthDate ? new Date(data.birthDate) : undefined,
  });
  res.json(patient);
}));

router.delete("/:id", authMiddleware, requireModule(ModuleKey.PATIENTS), asyncHandler(async (req: Request, res: Response) => {
  await patientService.deletePatient(req.params.id);
  res.json({ message: "Paciente deletado com sucesso" });
}));

export default router;


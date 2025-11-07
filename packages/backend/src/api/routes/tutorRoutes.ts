import { Router, Request, Response } from "express";
import { TutorService } from "../../services/tutorService";
import { TutorRepository } from "../../repositories/tutorRepository";
import { PatientRepository } from "../../repositories/patientRepository";
import { authMiddleware, requireModule } from "../../middleware/authMiddleware";
import { ModuleKey } from "../../core/types";
import { z } from "zod";
import { asyncHandler } from "../../middleware/asyncHandler";

const router = Router();
const repository = new TutorRepository();
const tutorService = new TutorService(repository);
const patientRepository = new PatientRepository();

const createTutorSchema = z.object({
  name: z.string().min(1, "Nome do tutor é obrigatório"),
  phone: z.string().optional(),
  email: z.string().email().optional(),
  cpfCnpj: z.string().optional(),
  address: z.string().optional(),
});

const updateTutorSchema = z.object({
  name: z.string().min(1, "Nome do tutor é obrigatório").optional(),
  phone: z.string().optional(),
  email: z.string().email().optional(),
  cpfCnpj: z.string().optional(),
  address: z.string().optional(),
});

router.get("/", authMiddleware, asyncHandler(async (req: Request, res: Response) => {
  const filters: { name?: string; phone?: string; cpfCnpj?: string } = {};
  if (req.query.name) {
    filters.name = req.query.name as string;
  }
  if (req.query.phone) {
    filters.phone = req.query.phone as string;
  }
  if (req.query.cpfCnpj) {
    filters.cpfCnpj = req.query.cpfCnpj as string;
  }
  const tutors = await tutorService.listTutors(filters);
  res.json(tutors);
}));

router.get("/:id", authMiddleware, asyncHandler(async (req: Request, res: Response) => {
  const tutor = await tutorService.getTutorById(req.params.id);
  res.json(tutor);
}));

router.get("/:id/patients", authMiddleware, asyncHandler(async (req: Request, res: Response) => {
  const patients = await patientRepository.findAll({ tutorId: req.params.id });
  res.json(patients);
}));

router.post("/", authMiddleware, asyncHandler(async (req: Request, res: Response) => {
  const data = createTutorSchema.parse(req.body);
  const tutor = await tutorService.createTutor(data);
  res.status(201).json(tutor);
}));

router.patch("/:id", authMiddleware, asyncHandler(async (req: Request, res: Response) => {
  const data = updateTutorSchema.parse(req.body);
  const tutor = await tutorService.updateTutor(req.params.id, data);
  res.json(tutor);
}));

router.delete("/:id", authMiddleware, requireModule(ModuleKey.TUTORS), asyncHandler(async (req: Request, res: Response) => {
  await tutorService.deleteTutor(req.params.id);
  res.json({ message: "Tutor deletado com sucesso" });
}));

export default router;


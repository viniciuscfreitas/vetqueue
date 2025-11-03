import { Router, Request, Response } from "express";
import { PatientService } from "../../services/patientService";
import { PatientRepository } from "../../repositories/patientRepository";
import { authMiddleware, requireRole } from "../../middleware/authMiddleware";
import { z } from "zod";
import { asyncHandler } from "../../middleware/asyncHandler";

const router = Router();
const repository = new PatientRepository();
const patientService = new PatientService(repository);

const createPatientSchema = z.object({
  name: z.string().min(1, "Nome do paciente é obrigatório"),
  species: z.string().optional(),
  breed: z.string().optional(),
  birthDate: z.string().datetime().optional(),
  gender: z.string().optional(),
  tutorName: z.string().min(1, "Nome do tutor é obrigatório"),
  tutorPhone: z.string().optional(),
  tutorEmail: z.string().email().optional(),
  notes: z.string().optional(),
});

const updatePatientSchema = z.object({
  name: z.string().min(1, "Nome do paciente é obrigatório").optional(),
  species: z.string().optional(),
  breed: z.string().optional(),
  birthDate: z.string().datetime().optional(),
  gender: z.string().optional(),
  tutorName: z.string().min(1, "Nome do tutor é obrigatório").optional(),
  tutorPhone: z.string().optional(),
  tutorEmail: z.string().email().optional(),
  notes: z.string().optional(),
});

router.get("/", authMiddleware, asyncHandler(async (req: Request, res: Response) => {
  const filters: { name?: string; tutorName?: string } = {};
  if (req.query.name) {
    filters.name = req.query.name as string;
  }
  if (req.query.tutorName) {
    filters.tutorName = req.query.tutorName as string;
  }
  const patients = await patientService.listPatients(filters);
  res.json(patients);
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

router.delete("/:id", authMiddleware, requireRole(["RECEPCAO"]), asyncHandler(async (req: Request, res: Response) => {
  await patientService.deletePatient(req.params.id);
  res.json({ message: "Paciente deletado com sucesso" });
}));

export default router;


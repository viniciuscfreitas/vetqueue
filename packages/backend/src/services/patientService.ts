import { PatientRepository } from "../repositories/patientRepository";
import { TutorRepository } from "../repositories/tutorRepository";
import { Patient } from "../core/types";
import { logger } from "../lib/logger";

interface ListPatientFilters {
  name?: string;
  tutorName?: string;
  tutorId?: string;
  limit?: number;
}

export class PatientService {
  private tutorRepository: TutorRepository;

  constructor(private repository: PatientRepository) {
    this.tutorRepository = new TutorRepository();
  }

  async listPatients(filters?: ListPatientFilters): Promise<Patient[]> {
    return this.repository.findAll(filters);
  }

  async getPatientById(id: string): Promise<Patient> {
    const patient = await this.repository.findById(id);
    if (!patient) {
      logger.warn("Patient not found", { patientId: id });
      throw new Error("Paciente não encontrado");
    }
    return patient;
  }

  async createPatient(data: {
    name: string;
    species?: string | null;
    breed?: string | null;
    birthDate?: Date | null;
    gender?: string | null;
    microchip?: string | null;
    color?: string | null;
    currentWeight?: number | null;
    allergies?: string | null;
    ongoingMedications?: string | null;
    temperament?: string | null;
    neutered?: boolean | null;
    photoUrl?: string | null;
    tutorId?: string | null;
    tutorName?: string;
    tutorPhone?: string | null;
    tutorEmail?: string | null;
    tutorCpfCnpj?: string | null;
    tutorAddress?: string | null;
    notes?: string | null;
  }): Promise<Patient> {
    let tutorId: string | null = data.tutorId || null;
    let tutorName = data.tutorName || "";
    let tutorPhone = data.tutorPhone || null;
    let tutorEmail = data.tutorEmail || null;
    let tutorCpfCnpj = data.tutorCpfCnpj || null;
    let tutorAddress = data.tutorAddress || null;

    if (tutorId) {
      const tutor = await this.tutorRepository.findById(tutorId);
      if (!tutor) {
        throw new Error("Tutor não encontrado");
      }
      tutorName = tutor.name;
      tutorPhone = tutor.phone || null;
      tutorEmail = tutor.email || null;
      tutorCpfCnpj = tutor.cpfCnpj || null;
      tutorAddress = tutor.address || null;
    } else if (data.tutorName) {
      if (!data.tutorName.trim()) {
        throw new Error("Nome do tutor é obrigatório");
      }

      let existingTutor = null;
      if (data.tutorPhone) {
        existingTutor = await this.tutorRepository.findByPhone(data.tutorPhone);
      }

      if (!existingTutor && data.tutorCpfCnpj) {
        existingTutor = await this.tutorRepository.findByCpfCnpj(data.tutorCpfCnpj);
      }

      if (existingTutor) {
        tutorId = existingTutor.id;
        tutorName = existingTutor.name;
        tutorPhone = existingTutor.phone || null;
        tutorEmail = existingTutor.email || null;
        tutorCpfCnpj = existingTutor.cpfCnpj || null;
        tutorAddress = existingTutor.address || null;
      } else {
        const newTutor = await this.tutorRepository.create({
          name: data.tutorName,
          phone: data.tutorPhone || null,
          email: data.tutorEmail || null,
          cpfCnpj: data.tutorCpfCnpj || null,
          address: data.tutorAddress || null,
        });
        tutorId = newTutor.id;
      }
    } else {
      throw new Error("É necessário informar tutorId ou dados do tutor");
    }

    return this.repository.create({
      ...data,
      tutorId,
      tutorName,
      tutorPhone,
      tutorEmail,
      tutorCpfCnpj,
      tutorAddress,
    });
  }

  async updatePatient(id: string, data: {
    name?: string;
    species?: string | null;
    breed?: string | null;
    birthDate?: Date | null;
    gender?: string | null;
    microchip?: string | null;
    color?: string | null;
    currentWeight?: number | null;
    allergies?: string | null;
    ongoingMedications?: string | null;
    temperament?: string | null;
    neutered?: boolean | null;
    photoUrl?: string | null;
    tutorId?: string | null;
    tutorName?: string;
    tutorPhone?: string | null;
    tutorEmail?: string | null;
    tutorCpfCnpj?: string | null;
    tutorAddress?: string | null;
    notes?: string | null;
  }): Promise<Patient> {
    const patient = await this.repository.findById(id);
    if (!patient) {
      logger.warn("Patient not found for update", { patientId: id });
      throw new Error("Paciente não encontrado");
    }

    let tutorId: string | null | undefined = data.tutorId;
    let tutorName = data.tutorName;
    let tutorPhone = data.tutorPhone;
    let tutorEmail = data.tutorEmail;
    let tutorCpfCnpj = data.tutorCpfCnpj;
    let tutorAddress = data.tutorAddress;

    if (data.tutorId !== undefined) {
      if (data.tutorId) {
        const tutor = await this.tutorRepository.findById(data.tutorId);
        if (!tutor) {
          throw new Error("Tutor não encontrado");
        }
        tutorName = tutor.name;
        tutorPhone = tutor.phone || null;
        tutorEmail = tutor.email || null;
        tutorCpfCnpj = tutor.cpfCnpj || null;
        tutorAddress = tutor.address || null;
      } else {
        tutorId = null;
        tutorName = undefined;
        tutorPhone = null;
        tutorEmail = null;
        tutorCpfCnpj = null;
        tutorAddress = null;
      }
    } else if (data.tutorName !== undefined) {
      if (!data.tutorName.trim()) {
        throw new Error("Nome do tutor não pode ser vazio");
      }

      let existingTutor = null;
      if (data.tutorPhone) {
        existingTutor = await this.tutorRepository.findByPhone(data.tutorPhone);
      }

      if (!existingTutor && data.tutorCpfCnpj) {
        existingTutor = await this.tutorRepository.findByCpfCnpj(data.tutorCpfCnpj);
      }

      if (existingTutor) {
        tutorId = existingTutor.id;
        tutorName = existingTutor.name;
        tutorPhone = existingTutor.phone || null;
        tutorEmail = existingTutor.email || null;
        tutorCpfCnpj = existingTutor.cpfCnpj || null;
        tutorAddress = existingTutor.address || null;
      } else {
        const newTutor = await this.tutorRepository.create({
          name: data.tutorName,
          phone: data.tutorPhone || null,
          email: data.tutorEmail || null,
          cpfCnpj: data.tutorCpfCnpj || null,
          address: data.tutorAddress || null,
        });
        tutorId = newTutor.id;
      }
    }

    return this.repository.update(id, {
      ...data,
      tutorId,
      tutorName,
      tutorPhone,
      tutorEmail,
      tutorCpfCnpj,
      tutorAddress,
    });
  }

  async deletePatient(id: string): Promise<void> {
    const patient = await this.repository.findById(id);
    if (!patient) {
      logger.warn("Patient not found for delete", { patientId: id });
      throw new Error("Paciente não encontrado");
    }

    const hasEntries = await this.repository.hasQueueEntries(id);
    if (hasEntries) {
      logger.warn("Cannot delete patient with queue entries", { patientId: id });
      throw new Error("Não é possível deletar paciente com histórico de atendimentos. Use exclusão lógica ou remova os registros de atendimento primeiro.");
    }

    await this.repository.delete(id);
  }
}


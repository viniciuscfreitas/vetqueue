import { PatientRepository } from "../repositories/patientRepository";
import { Patient } from "../core/types";
import { logger } from "../lib/logger";

export class PatientService {
  constructor(private repository: PatientRepository) {}

  async listPatients(filters?: { name?: string; tutorName?: string }): Promise<Patient[]> {
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
    tutorName: string;
    tutorPhone?: string | null;
    tutorEmail?: string | null;
    tutorCpfCnpj?: string | null;
    tutorAddress?: string | null;
    notes?: string | null;
  }): Promise<Patient> {
    return this.repository.create(data);
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

    return this.repository.update(id, data);
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


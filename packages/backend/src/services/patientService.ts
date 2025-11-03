import { PatientRepository } from "../repositories/patientRepository";
import { Patient } from "../core/types";

export class PatientService {
  constructor(private repository: PatientRepository) {}

  async listPatients(filters?: { name?: string; tutorName?: string }): Promise<Patient[]> {
    return this.repository.findAll(filters);
  }

  async getPatientById(id: string): Promise<Patient> {
    const patient = await this.repository.findById(id);
    if (!patient) {
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
    tutorName: string;
    tutorPhone?: string | null;
    tutorEmail?: string | null;
    notes?: string | null;
  }): Promise<Patient> {
    if (!data.name.trim()) {
      throw new Error("Nome do paciente é obrigatório");
    }

    if (!data.tutorName.trim()) {
      throw new Error("Nome do tutor é obrigatório");
    }

    console.log(`[PATIENT] ✓ Criando paciente - Nome: ${data.name}, Tutor: ${data.tutorName}`);
    return this.repository.create(data);
  }

  async updatePatient(id: string, data: {
    name?: string;
    species?: string | null;
    breed?: string | null;
    birthDate?: Date | null;
    gender?: string | null;
    tutorName?: string;
    tutorPhone?: string | null;
    tutorEmail?: string | null;
    notes?: string | null;
  }): Promise<Patient> {
    const patient = await this.repository.findById(id);
    if (!patient) {
      throw new Error("Paciente não encontrado");
    }

    if (data.name && !data.name.trim()) {
      throw new Error("Nome do paciente é obrigatório");
    }

    if (data.tutorName && !data.tutorName.trim()) {
      throw new Error("Nome do tutor é obrigatório");
    }

    console.log(`[PATIENT] ✓ Atualizando paciente - ID: ${id}, Nome: ${data.name || patient.name}`);
    return this.repository.update(id, data);
  }

  async deletePatient(id: string): Promise<void> {
    const patient = await this.repository.findById(id);
    if (!patient) {
      throw new Error("Paciente não encontrado");
    }

    console.log(`[PATIENT] ✓ Deletando paciente - ID: ${id}, Nome: ${patient.name}`);
    await this.repository.delete(id);
  }
}


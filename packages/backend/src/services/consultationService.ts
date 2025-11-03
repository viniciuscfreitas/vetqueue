import { ConsultationRepository } from "../repositories/consultationRepository";
import { Consultation } from "../core/types";

export class ConsultationService {
  constructor(private repository: ConsultationRepository) {}

  async listConsultations(filters?: { patientId?: string; queueEntryId?: string; vetId?: string }): Promise<Consultation[]> {
    return this.repository.findAll(filters);
  }

  async getConsultationById(id: string): Promise<Consultation> {
    const consultation = await this.repository.findById(id);
    if (!consultation) {
      throw new Error("Consulta não encontrada");
    }
    return consultation;
  }

  async createConsultation(data: {
    patientId: string;
    queueEntryId?: string | null;
    vetId?: string | null;
    diagnosis?: string | null;
    treatment?: string | null;
    prescription?: string | null;
    weightInKg?: number | null;
    notes?: string | null;
    date?: Date;
  }): Promise<Consultation> {
    if (!data.patientId.trim()) {
      throw new Error("ID do paciente é obrigatório");
    }

    console.log(`[CONSULTATION] ✓ Criando consulta - PatientId: ${data.patientId}, VetId: ${data.vetId || 'N/A'}`);
    return this.repository.create(data);
  }

  async updateConsultation(id: string, data: {
    diagnosis?: string | null;
    treatment?: string | null;
    prescription?: string | null;
    weightInKg?: number | null;
    notes?: string | null;
    date?: Date;
  }): Promise<Consultation> {
    const consultation = await this.repository.findById(id);
    if (!consultation) {
      throw new Error("Consulta não encontrada");
    }

    return this.repository.update(id, data);
  }

  async deleteConsultation(id: string): Promise<void> {
    const consultation = await this.repository.findById(id);
    if (!consultation) {
      throw new Error("Consulta não encontrada");
    }

    await this.repository.delete(id);
  }
}


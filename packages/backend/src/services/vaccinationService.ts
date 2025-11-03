import { VaccinationRepository } from "../repositories/vaccinationRepository";
import { Vaccination } from "../core/types";

export class VaccinationService {
  constructor(private repository: VaccinationRepository) {}

  async listVaccinations(filters?: { patientId?: string; vetId?: string; upcomingDoses?: boolean }): Promise<Vaccination[]> {
    return this.repository.findAll(filters);
  }

  async getVaccinationById(id: string): Promise<Vaccination> {
    const vaccination = await this.repository.findById(id);
    if (!vaccination) {
      throw new Error("Vacina não encontrada");
    }
    return vaccination;
  }

  async createVaccination(data: {
    patientId: string;
    vaccineName: string;
    appliedDate?: Date;
    batchNumber?: string | null;
    vetId?: string | null;
    nextDoseDate?: Date | null;
    notes?: string | null;
  }): Promise<Vaccination> {
    if (!data.patientId.trim()) {
      throw new Error("ID do paciente é obrigatório");
    }

    if (!data.vaccineName.trim()) {
      throw new Error("Nome da vacina é obrigatório");
    }

    console.log(`[VACCINATION] ✓ Criando vacina - PatientId: ${data.patientId}, Vacina: ${data.vaccineName}`);
    return this.repository.create(data);
  }

  async updateVaccination(id: string, data: {
    vaccineName?: string;
    appliedDate?: Date;
    batchNumber?: string | null;
    nextDoseDate?: Date | null;
    notes?: string | null;
  }): Promise<Vaccination> {
    const vaccination = await this.repository.findById(id);
    if (!vaccination) {
      throw new Error("Vacina não encontrada");
    }

    if (data.vaccineName && !data.vaccineName.trim()) {
      throw new Error("Nome da vacina não pode ser vazio");
    }

    return this.repository.update(id, data);
  }

  async deleteVaccination(id: string): Promise<void> {
    const vaccination = await this.repository.findById(id);
    if (!vaccination) {
      throw new Error("Vacina não encontrada");
    }

    await this.repository.delete(id);
  }

  async getVaccineNameSuggestions(): Promise<string[]> {
    return this.repository.getVaccineNameSuggestions();
  }
}


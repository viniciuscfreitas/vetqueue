import { VaccinationRepository } from "../repositories/vaccinationRepository";
import { Vaccination } from "../core/types";
import { logger } from "../lib/logger";

export class VaccinationService {
  constructor(private repository: VaccinationRepository) {}

  async listVaccinations(filters?: { patientId?: string; vetId?: string; upcomingDoses?: boolean }): Promise<Vaccination[]> {
    return this.repository.findAll(filters);
  }

  async getVaccinationById(id: string): Promise<Vaccination> {
    const vaccination = await this.repository.findById(id);
    if (!vaccination) {
      logger.warn("Vaccination not found", { vaccinationId: id });
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
      logger.warn("Patient ID is empty for vaccination", { patientId: data.patientId });
      throw new Error("ID do paciente é obrigatório");
    }

    if (!data.vaccineName.trim()) {
      logger.warn("Vaccine name is empty");
      throw new Error("Nome da vacina é obrigatório");
    }

    logger.debug("Creating vaccination", { patientId: data.patientId, vaccineName: data.vaccineName });
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
      logger.warn("Vaccination not found for update", { vaccinationId: id });
      throw new Error("Vacina não encontrada");
    }

    if (data.vaccineName && !data.vaccineName.trim()) {
      logger.warn("Vaccine name is empty on update", { vaccinationId: id });
      throw new Error("Nome da vacina não pode ser vazio");
    }

    return this.repository.update(id, data);
  }

  async deleteVaccination(id: string): Promise<void> {
    const vaccination = await this.repository.findById(id);
    if (!vaccination) {
      logger.warn("Vaccination not found for delete", { vaccinationId: id });
      throw new Error("Vacina não encontrada");
    }

    await this.repository.delete(id);
  }

  async getVaccineNameSuggestions(): Promise<string[]> {
    return this.repository.getVaccineNameSuggestions();
  }
}


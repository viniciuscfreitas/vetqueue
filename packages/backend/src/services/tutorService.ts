import { TutorRepository } from "../repositories/tutorRepository";
import { Tutor } from "../core/types";
import { logger } from "../lib/logger";

export class TutorService {
  constructor(private repository: TutorRepository) {}

  async listTutors(filters?: { name?: string; phone?: string; cpfCnpj?: string }): Promise<Tutor[]> {
    return this.repository.findAll(filters);
  }

  async getTutorById(id: string): Promise<Tutor> {
    const tutor = await this.repository.findById(id);
    if (!tutor) {
      logger.warn("Tutor not found", { tutorId: id });
      throw new Error("Tutor não encontrado");
    }
    return tutor;
  }

  async createTutor(data: {
    name: string;
    phone?: string | null;
    email?: string | null;
    cpfCnpj?: string | null;
    address?: string | null;
  }): Promise<Tutor> {
    if (!data.name.trim()) {
      logger.warn("Missing required tutor name", { hasName: !!data.name.trim() });
      throw new Error("Nome do tutor é obrigatório");
    }

    return this.repository.create(data);
  }

  async updateTutor(id: string, data: {
    name?: string;
    phone?: string | null;
    email?: string | null;
    cpfCnpj?: string | null;
    address?: string | null;
  }): Promise<Tutor> {
    const tutor = await this.repository.findById(id);
    if (!tutor) {
      logger.warn("Tutor not found for update", { tutorId: id });
      throw new Error("Tutor não encontrado");
    }

    if (data.name !== undefined && !data.name.trim()) {
      throw new Error("Nome não pode ser vazio");
    }

    return this.repository.update(id, data);
  }

  async deleteTutor(id: string): Promise<void> {
    const tutor = await this.repository.findById(id);
    if (!tutor) {
      logger.warn("Tutor not found for delete", { tutorId: id });
      throw new Error("Tutor não encontrado");
    }

    const hasPatients = await this.repository.hasPatients(id);
    if (hasPatients) {
      logger.warn("Cannot delete tutor with patients", { tutorId: id });
      throw new Error("Não é possível deletar tutor com pets cadastrados. Remova os pets primeiro.");
    }

    await this.repository.delete(id);
  }
}


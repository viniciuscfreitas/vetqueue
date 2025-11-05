import { ServiceRepository } from "../repositories/serviceRepository";
import { Service } from "../core/types";
import { logger } from "../lib/logger";

export class ServiceService {
  constructor(private repository: ServiceRepository) {}

  async listServices(): Promise<Service[]> {
    return this.repository.findActive();
  }

  async getAllServices(): Promise<Service[]> {
    return this.repository.findAll();
  }

  async getServiceById(id: string): Promise<Service> {
    const service = await this.repository.findById(id);
    if (!service) {
      logger.warn("Service not found", { serviceId: id });
      throw new Error("Serviço não encontrado");
    }
    return service;
  }

  async createService(data: { name: string }): Promise<Service> {
    if (!data.name.trim()) {
      logger.warn("Service name is empty");
      throw new Error("Nome do serviço é obrigatório");
    }

    const existingService = await this.repository.findAll();
    const serviceExists = existingService.some(
      (service) => service.name.toLowerCase() === data.name.toLowerCase()
    );

    if (serviceExists) {
      logger.warn("Service name already exists", { name: data.name });
      throw new Error("Já existe um serviço com este nome");
    }

    return this.repository.create(data);
  }

  async updateService(id: string, data: { name?: string; isActive?: boolean }): Promise<Service> {
    const service = await this.repository.findById(id);
    if (!service) {
      logger.warn("Service not found for update", { serviceId: id });
      throw new Error("Serviço não encontrado");
    }

    if (data.name && !data.name.trim()) {
      logger.warn("Service name is empty on update", { serviceId: id });
      throw new Error("Nome do serviço é obrigatório");
    }

    return this.repository.update(id, data);
  }

  async deleteService(id: string): Promise<void> {
    const service = await this.repository.findById(id);
    if (!service) {
      logger.warn("Service not found for delete", { serviceId: id });
      throw new Error("Serviço não encontrado");
    }

    await this.repository.delete(id);
  }
}


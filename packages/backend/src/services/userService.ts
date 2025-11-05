import bcrypt from "bcrypt";
import { UserRepository } from "../repositories/userRepository";
import { QueueRepository } from "../repositories/queueRepository";
import { User, Role } from "../core/types";
import { logger } from "../lib/logger";

export class UserService {
  private queueRepository: QueueRepository;
  
  constructor(private repository: UserRepository) {
    this.queueRepository = new QueueRepository();
  }

  async listUsers(): Promise<User[]> {
    return this.repository.findAll();
  }

  async getUserById(id: string): Promise<User> {
    const user = await this.repository.findById(id);
    if (!user) {
      throw new Error("Usuário não encontrado");
    }
    return user;
  }

  async createUser(data: {
    username: string;
    password: string;
    name: string;
    role: Role;
  }): Promise<User> {
    if (!data.username.trim() || !data.password.trim() || !data.name.trim()) {
      logger.warn("Missing required user fields", { hasUsername: !!data.username.trim(), hasPassword: !!data.password.trim(), hasName: !!data.name.trim() });
      throw new Error("Username, senha e nome são obrigatórios");
    }

    if (data.password.length < 6) {
      logger.warn("Password too short", { passwordLength: data.password.length });
      throw new Error("Senha deve ter no mínimo 6 caracteres");
    }

    const existingUser = await this.repository.findByUsername(data.username);
    if (existingUser) {
      logger.warn("Username already exists", { username: data.username });
      throw new Error("Já existe um usuário com este username");
    }

    const hashedPassword = await bcrypt.hash(data.password, 10);

    return this.repository.create({
      username: data.username,
      password: hashedPassword,
      name: data.name,
      role: data.role,
    });
  }

  async updateUser(
    id: string,
    data: { name?: string; role?: Role; password?: string }
  ): Promise<User> {
    const user = await this.repository.findById(id);
    if (!user) {
      throw new Error("Usuário não encontrado");
    }

    const updateData: any = {};
    
    if (data.name !== undefined) {
      if (!data.name.trim()) {
        throw new Error("Nome não pode ser vazio");
      }
      updateData.name = data.name;
    }

    if (data.role !== undefined) {
      updateData.role = data.role;
    }

    if (data.password !== undefined) {
      if (data.password && data.password.length < 6) {
        throw new Error("Senha deve ter no mínimo 6 caracteres");
      }
      if (data.password) {
        updateData.password = await bcrypt.hash(data.password, 10);
      }
    }

    if (Object.keys(updateData).length === 0) {
      throw new Error("Nenhum campo para atualizar");
    }

    return this.repository.update(id, updateData);
  }

  async checkInRoom(vetId: string, roomId: string): Promise<User> {
    logger.debug("Room check-in", { vetId, roomId });
    
    try {
      const user = await this.repository.findById(vetId);
      if (!user) {
        logger.error("User not found for room check-in", { vetId });
        throw new Error("Usuário não encontrado");
      }
      
      if (user.currentRoomId) {
        logger.warn("User already in room, auto-checkout", { vetId, currentRoomId: user.currentRoomId, newRoomId: roomId });
      }
      
      const result = await this.repository.checkInRoom(vetId, roomId);
      logger.info("Room check-in successful", { vetId, userName: result.name, roomId });
      return result;
    } catch (error) {
      logger.error("Failed to check-in room", { 
        vetId, 
        roomId, 
        error: error instanceof Error ? error.message : String(error) 
      });
      throw error;
    }
  }

  async checkOutRoom(vetId: string): Promise<User> {
    logger.debug("Room check-out", { vetId });
    
    try {
      const user = await this.repository.findById(vetId);
      if (!user || !user.currentRoomId) {
        logger.warn("User tried checkout without being in room", { vetId });
        throw new Error("Usuário não está em nenhuma sala");
      }
      
      const hasActivePatients = await this.queueRepository.hasVetActivePatients(vetId);
      if (hasActivePatients) {
        logger.warn("Vet tried checkout with active patients", { vetId });
        throw new Error("Não é possível sair da sala com pacientes em atendimento");
      }
      
      const result = await this.repository.checkOutRoom(vetId);
      logger.info("Room check-out successful", { vetId, userName: result.name });
      return result;
    } catch (error) {
      logger.error("Failed to check-out room", { 
        vetId, 
        error: error instanceof Error ? error.message : String(error) 
      });
      throw error;
    }
  }

  async changeRoom(vetId: string, roomId: string): Promise<User> {
    logger.debug("Changing room", { vetId, roomId });
    
    try {
      const user = await this.repository.findById(vetId);
      if (!user) {
        logger.error("User not found for room change", { vetId });
        throw new Error("Usuário não encontrado");
      }
      
      const hasActivePatients = await this.queueRepository.hasVetActivePatients(vetId);
      if (hasActivePatients) {
        logger.warn("Vet tried to change room with active patients", { vetId, roomId });
        throw new Error("Não é possível trocar de sala com pacientes em atendimento");
      }
      
      const result = await this.repository.changeRoom(vetId, roomId);
      logger.info("Room changed successfully", { vetId, userName: result.name, roomId });
      return result;
    } catch (error) {
      logger.error("Failed to change room", { 
        vetId, 
        roomId, 
        error: error instanceof Error ? error.message : String(error) 
      });
      throw error;
    }
  }

  async cleanupInactiveRoomCheckins(maxAgeMinutes: number = 60): Promise<User[]> {
    const inactiveUsers = await this.repository.findInactiveRoomCheckins(maxAgeMinutes);
    
    const results = await Promise.allSettled(
      inactiveUsers.map(user => this.repository.clearRoomCheckin(user.id))
    );

    return results
      .filter((result): result is PromiseFulfilledResult<User> => result.status === 'fulfilled')
      .map(result => result.value);
  }
}


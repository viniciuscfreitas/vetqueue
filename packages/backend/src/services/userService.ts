import bcrypt from "bcrypt";
import { UserRepository } from "../repositories/userRepository";
import { User, Role } from "../core/types";

export class UserService {
  constructor(private repository: UserRepository) {}

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
      throw new Error("Username, senha e nome são obrigatórios");
    }

    if (data.password.length < 6) {
      throw new Error("Senha deve ter no mínimo 6 caracteres");
    }

    const existingUser = await this.repository.findByUsername(data.username);
    if (existingUser) {
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
    return this.repository.checkInRoom(vetId, roomId);
  }

  async checkOutRoom(vetId: string): Promise<User> {
    return this.repository.checkOutRoom(vetId);
  }
}


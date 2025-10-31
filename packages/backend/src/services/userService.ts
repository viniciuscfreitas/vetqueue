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
}


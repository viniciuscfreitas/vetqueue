import { UserService } from "../services/userService";
import { UserRepository } from "../repositories/userRepository";

const userRepository = new UserRepository();
const userService = new UserService(userRepository);

export async function checkInactiveUsers() {
  try {
    await userService.checkInactiveVets();
  } catch (error) {
    console.error("Erro ao verificar usuários inativos:", error);
  }
}


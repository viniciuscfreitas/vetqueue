import { UserService } from "../services/userService";
import { UserRepository } from "../repositories/userRepository";

const userRepository = new UserRepository();
const userService = new UserService(userRepository);

export async function checkAndCleanupInactiveRooms() {
  try {
    const cleanedUsers = await userService.cleanupInactiveRoomCheckins(60);
    if (cleanedUsers.length > 0) {
      console.log(`[JOB] ${cleanedUsers.length} check-ins removidos`);
    }
  } catch (error) {
    console.error(`[JOB] Erro ao limpar check-ins inativos:`, error);
  }
}


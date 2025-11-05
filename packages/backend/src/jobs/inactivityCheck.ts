import { UserService } from "../services/userService";
import { UserRepository } from "../repositories/userRepository";
import { logger } from "../lib/logger";

const userRepository = new UserRepository();
const userService = new UserService(userRepository);

export async function checkAndCleanupInactiveRooms() {
  try {
    const cleanedUsers = await userService.cleanupInactiveRoomCheckins(60);
    if (cleanedUsers.length > 0) {
      logger.info("Inactive room check-ins cleaned", { count: cleanedUsers.length });
    }
  } catch (error) {
    logger.error("Failed to cleanup inactive room check-ins", { 
      error: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined
    });
  }
}


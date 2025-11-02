import { UserService } from "../services/userService";
import { UserRepository } from "../repositories/userRepository";

const userRepository = new UserRepository();
const userService = new UserService(userRepository);

export async function checkAndCleanupInactiveRooms() {
  const startTime = Date.now();
  console.log(`[JOB] Verificando check-ins inativos de salas...`);
  
  try {
    const cleanedUsers = await userService.cleanupInactiveRoomCheckins(60);
    
    if (cleanedUsers.length > 0) {
      console.log(`[JOB] ✓ ${cleanedUsers.length} check-ins removidos automaticamente`);
      cleanedUsers.forEach(user => {
        console.log(`  → ${user.name} (sala desocupada após 1h de inatividade)`);
      });
    } else {
      console.log(`[JOB] Nenhum check-in inativo encontrado`);
    }
    
    const duration = Date.now() - startTime;
    console.log(`[JOB] Concluído em ${duration}ms`);
  } catch (error) {
    console.error(`[JOB] ✗ Erro ao verificar check-ins inativos:`, error);
  }
}


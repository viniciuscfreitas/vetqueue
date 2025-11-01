import { QueueService } from "../services/queueService";
import { QueueRepository } from "../repositories/queueRepository";

const queueRepository = new QueueRepository();
const queueService = new QueueService(queueRepository);

export async function checkAndUpgradePriorities() {
  const startTime = Date.now();
  console.log(`[JOB] Verificando prioridades de agendamentos...`);
  
  try {
    const upgradedEntries = await queueService.upgradeScheduledPriorities();
    
    if (upgradedEntries.length > 0) {
      console.log(`[JOB] ✓ ${upgradedEntries.length} entradas atualizadas para ALTA prioridade`);
      upgradedEntries.forEach(entry => {
        console.log(`  → ${entry.patientName} (agendado: ${entry.scheduledAt})`);
      });
    } else {
      console.log(`[JOB] Nenhuma entrada para atualizar`);
    }
    
    const duration = Date.now() - startTime;
    console.log(`[JOB] Concluído em ${duration}ms`);
  } catch (error) {
    console.error(`[JOB] ✗ Erro ao verificar prioridades:`, error);
  }
}

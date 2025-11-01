import { QueueService } from "../services/queueService";
import { QueueRepository } from "../repositories/queueRepository";

const queueRepository = new QueueRepository();
const queueService = new QueueService(queueRepository);

export async function checkAndUpgradePriorities() {
  try {
    const upgradedEntries = await queueService.upgradeScheduledPriorities();
    if (upgradedEntries.length > 0) {
      console.log(`Upgraded ${upgradedEntries.length} entries to HIGH priority due to scheduled appointment delay`);
    }
  } catch (error) {
    console.error("Erro ao verificar e atualizar prioridades:", error);
  }
}

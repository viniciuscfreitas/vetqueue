import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function resolveFailedMigrations() {
  try {
    const failedMigrations = await prisma.$queryRaw<Array<{
      migration_name: string;
      finished_at: Date | null;
      rolled_back_at: Date | null;
    }>>`
      SELECT migration_name, finished_at, rolled_back_at
      FROM _prisma_migrations
      WHERE finished_at IS NULL AND rolled_back_at IS NULL
      ORDER BY started_at ASC
    `;

    if (failedMigrations.length === 0) {
      console.log('[MIGRATE] ✓ Nenhuma migration falha encontrada');
      return;
    }

    console.log(`[MIGRATE] ✗ Encontradas ${failedMigrations.length} migrations marcadas como falhas`);
    
    for (const migration of failedMigrations) {
      console.log(`[MIGRATE] Resolvendo migration: ${migration.migration_name}`);
      
      await prisma.$executeRaw`
        UPDATE _prisma_migrations 
        SET finished_at = NOW(), 
            rolled_back_at = NULL,
            logs = NULL
        WHERE migration_name = ${migration.migration_name} 
          AND finished_at IS NULL
      `;
      
      console.log(`[MIGRATE] ✓ Migration ${migration.migration_name} marcada como resolvida`);
    }
    
    console.log('[MIGRATE] ✓ Todas as migrations falhas foram resolvidas');
  } catch (error) {
    console.error('[MIGRATE] ✗ Erro ao resolver migrations:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

resolveFailedMigrations();


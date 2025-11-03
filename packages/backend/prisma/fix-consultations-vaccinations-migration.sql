-- Script para resolver migration que foi aplicada manualmente
-- Use quando migration foi aplicada mas Prisma não reconhece

-- 1. Limpar registros falhos da migration
DELETE FROM _prisma_migrations 
WHERE migration_name = '20251103000000_add_consultations_vaccinations' 
AND (finished_at IS NULL OR rolled_back_at IS NOT NULL);

-- 2. Marcar migration como aplicada com sucesso
INSERT INTO _prisma_migrations (id, migration_name, checksum, finished_at, applied_steps_count, started_at)
SELECT
  gen_random_uuid(),
  '20251103000000_add_consultations_vaccinations',
  '',
  NOW(),
  1,
  NOW() - INTERVAL '1 minute'
WHERE NOT EXISTS (
  SELECT 1 FROM _prisma_migrations 
  WHERE migration_name = '20251103000000_add_consultations_vaccinations' 
  AND finished_at IS NOT NULL
);

-- 3. Verificar se foi aplicada corretamente
SELECT migration_name, finished_at, started_at, rolled_back_at 
FROM _prisma_migrations 
WHERE migration_name = '20251103000000_add_consultations_vaccinations';


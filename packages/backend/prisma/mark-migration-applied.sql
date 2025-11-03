-- Script para marcar migration como aplicada após execução manual
-- Execute este script após aplicar manualmente a migration

INSERT INTO _prisma_migrations (id, migration_name, checksum, finished_at, applied_steps_count, started_at)
SELECT
  gen_random_uuid(),
  '20251103000000_add_consultations_vaccinations',
  '',
  NOW(),
  1,
  NOW()
WHERE NOT EXISTS (
  SELECT 1 FROM _prisma_migrations 
  WHERE migration_name = '20251103000000_add_consultations_vaccinations' 
  AND finished_at IS NOT NULL
);


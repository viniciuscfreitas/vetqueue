-- Script para marcar migrations antigas como aplicadas
-- Use quando migrations foram aplicadas mas registro foi apagado

-- Limpar registros duplicados ou falhos primeiro
DELETE FROM _prisma_migrations WHERE migration_name = '20241031000000_init' AND finished_at IS NULL;

-- Migration 20241031000000_init
INSERT INTO _prisma_migrations (id, migration_name, checksum, finished_at, applied_steps_count, started_at)
SELECT 
  gen_random_uuid(),
  '20241031000000_init',
  '',
  NOW(),
  1,
  NOW()
WHERE NOT EXISTS (
  SELECT 1 FROM _prisma_migrations WHERE migration_name = '20241031000000_init' AND finished_at IS NOT NULL
);

-- Migration 20250101000000_add_users_rooms_relations
DELETE FROM _prisma_migrations WHERE migration_name = '20250101000000_add_users_rooms_relations' AND finished_at IS NULL;

INSERT INTO _prisma_migrations (id, migration_name, checksum, finished_at, applied_steps_count, started_at)
SELECT 
  gen_random_uuid(),
  '20250101000000_add_users_rooms_relations',
  '',
  NOW(),
  1,
  NOW()
WHERE NOT EXISTS (
  SELECT 1 FROM _prisma_migrations WHERE migration_name = '20250101000000_add_users_rooms_relations' AND finished_at IS NOT NULL
);

-- Migration 20250101000001_add_services
DELETE FROM _prisma_migrations WHERE migration_name = '20250101000001_add_services' AND finished_at IS NULL;

INSERT INTO _prisma_migrations (id, migration_name, checksum, finished_at, applied_steps_count, started_at)
SELECT 
  gen_random_uuid(),
  '20250101000001_add_services',
  '',
  NOW(),
  1,
  NOW()
WHERE NOT EXISTS (
  SELECT 1 FROM _prisma_migrations WHERE migration_name = '20250101000001_add_services' AND finished_at IS NOT NULL
);

-- Migration 20250101000002_add_audit
DELETE FROM _prisma_migrations WHERE migration_name = '20250101000002_add_audit' AND finished_at IS NULL;

INSERT INTO _prisma_migrations (id, migration_name, checksum, finished_at, applied_steps_count, started_at)
SELECT 
  gen_random_uuid(),
  '20250101000002_add_audit',
  '',
  NOW(),
  1,
  NOW()
WHERE NOT EXISTS (
  SELECT 1 FROM _prisma_migrations WHERE migration_name = '20250101000002_add_audit' AND finished_at IS NOT NULL
);

-- Migration 20250101000003_add_scheduled_appointment_fields
DELETE FROM _prisma_migrations WHERE migration_name = '20250101000003_add_scheduled_appointment_fields' AND finished_at IS NULL;

INSERT INTO _prisma_migrations (id, migration_name, checksum, finished_at, applied_steps_count, started_at)
SELECT 
  gen_random_uuid(),
  '20250101000003_add_scheduled_appointment_fields',
  '',
  NOW(),
  1,
  NOW()
WHERE NOT EXISTS (
  SELECT 1 FROM _prisma_migrations WHERE migration_name = '20250101000003_add_scheduled_appointment_fields' AND finished_at IS NOT NULL
);

-- Migration 20250102000000_add_user_room_checkin_fields
DELETE FROM _prisma_migrations WHERE migration_name = '20250102000000_add_user_room_checkin_fields' AND finished_at IS NULL;

INSERT INTO _prisma_migrations (id, migration_name, checksum, finished_at, applied_steps_count, started_at)
SELECT 
  gen_random_uuid(),
  '20250102000000_add_user_room_checkin_fields',
  '',
  NOW(),
  1,
  NOW()
WHERE NOT EXISTS (
  SELECT 1 FROM _prisma_migrations WHERE migration_name = '20250102000000_add_user_room_checkin_fields' AND finished_at IS NOT NULL
);


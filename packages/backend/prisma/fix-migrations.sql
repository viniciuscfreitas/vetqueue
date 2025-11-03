-- Script para marcar migrations antigas como aplicadas
-- Use quando migrations foram aplicadas mas registro foi apagado

-- Migration 20241031000000_init
INSERT INTO _prisma_migrations (migration_name, checksum, finished_at, applied_steps_count, started_at)
VALUES (
  '20241031000000_init',
  '',
  NOW(),
  1,
  NOW()
)
ON CONFLICT (migration_name) DO UPDATE
SET finished_at = NOW(),
    rolled_back_at = NULL,
    logs = NULL;

-- Migration 20250101000000_add_users_rooms_relations
INSERT INTO _prisma_migrations (migration_name, checksum, finished_at, applied_steps_count, started_at)
VALUES (
  '20250101000000_add_users_rooms_relations',
  '',
  NOW(),
  1,
  NOW()
)
ON CONFLICT (migration_name) DO UPDATE
SET finished_at = NOW(),
    rolled_back_at = NULL,
    logs = NULL;

-- Migration 20250101000001_add_services
INSERT INTO _prisma_migrations (migration_name, checksum, finished_at, applied_steps_count, started_at)
VALUES (
  '20250101000001_add_services',
  '',
  NOW(),
  1,
  NOW()
)
ON CONFLICT (migration_name) DO UPDATE
SET finished_at = NOW(),
    rolled_back_at = NULL,
    logs = NULL;

-- Migration 20250101000002_add_audit
INSERT INTO _prisma_migrations (migration_name, checksum, finished_at, applied_steps_count, started_at)
VALUES (
  '20250101000002_add_audit',
  '',
  NOW(),
  1,
  NOW()
)
ON CONFLICT (migration_name) DO UPDATE
SET finished_at = NOW(),
    rolled_back_at = NULL,
    logs = NULL;

-- Migration 20250101000003_add_scheduled_appointment_fields
INSERT INTO _prisma_migrations (migration_name, checksum, finished_at, applied_steps_count, started_at)
VALUES (
  '20250101000003_add_scheduled_appointment_fields',
  '',
  NOW(),
  1,
  NOW()
)
ON CONFLICT (migration_name) DO UPDATE
SET finished_at = NOW(),
    rolled_back_at = NULL,
    logs = NULL;

-- Migration 20250102000000_add_user_room_checkin_fields
INSERT INTO _prisma_migrations (migration_name, checksum, finished_at, applied_steps_count, started_at)
VALUES (
  '20250102000000_add_user_room_checkin_fields',
  '',
  NOW(),
  1,
  NOW()
)
ON CONFLICT (migration_name) DO UPDATE
SET finished_at = NOW(),
    rolled_back_at = NULL,
    logs = NULL;


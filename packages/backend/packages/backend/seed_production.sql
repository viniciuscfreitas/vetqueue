BEGIN;

-- Garante que o enum PaymentStatus exista
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'paymentstatus') THEN
    CREATE TYPE "PaymentStatus" AS ENUM ('PENDING', 'PARTIAL', 'PAID', 'CANCELLED');
  END IF;
END
$$ LANGUAGE plpgsql;

-- Cria as tabelas necessárias, caso ainda não existam
CREATE TABLE IF NOT EXISTS "users" (
  "id" TEXT PRIMARY KEY,
  "username" TEXT NOT NULL UNIQUE,
  "password" TEXT NOT NULL,
  "name" TEXT NOT NULL,
  "role" TEXT NOT NULL,
  "createdAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  "currentRoomId" TEXT,
  "roomCheckedInAt" TIMESTAMP,
  "lastActivityAt" TIMESTAMP
);

CREATE TABLE IF NOT EXISTS "rooms" (
  "id" TEXT PRIMARY KEY,
  "name" TEXT NOT NULL UNIQUE,
  "isActive" BOOLEAN NOT NULL DEFAULT TRUE,
  "createdAt" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS "services" (
  "id" TEXT PRIMARY KEY,
  "name" TEXT NOT NULL UNIQUE,
  "isActive" BOOLEAN NOT NULL DEFAULT TRUE,
  "createdAt" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS "tutors" (
  "id" TEXT PRIMARY KEY,
  "name" TEXT NOT NULL,
  "phone" TEXT,
  "email" TEXT,
  "cpfCnpj" TEXT,
  "address" TEXT,
  "createdAt" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS "patients" (
  "id" TEXT PRIMARY KEY,
  "name" TEXT NOT NULL,
  "species" TEXT,
  "breed" TEXT,
  "birthDate" TIMESTAMP,
  "gender" TEXT,
  "microchip" TEXT,
  "color" TEXT,
  "currentWeight" DOUBLE PRECISION,
  "allergies" TEXT,
  "ongoingMedications" TEXT,
  "temperament" TEXT,
  "neutered" BOOLEAN DEFAULT FALSE,
  "photoUrl" TEXT,
  "tutorId" TEXT,
  "tutorName" TEXT NOT NULL,
  "tutorPhone" TEXT,
  "tutorEmail" TEXT,
  "tutorCpfCnpj" TEXT,
  "tutorAddress" TEXT,
  "notes" TEXT,
  "createdAt" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "patients_tutor_fkey" FOREIGN KEY ("tutorId") REFERENCES "tutors"("id") ON DELETE SET NULL ON UPDATE CASCADE
);

CREATE TABLE IF NOT EXISTS "queue_entries" (
  "id" TEXT PRIMARY KEY,
  "patientName" TEXT NOT NULL,
  "tutorName" TEXT NOT NULL,
  "serviceType" TEXT NOT NULL,
  "priority" INTEGER NOT NULL,
  "status" TEXT NOT NULL,
  "createdAt" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "calledAt" TIMESTAMP,
  "completedAt" TIMESTAMP,
  "assignedVetId" TEXT,
  "roomId" TEXT,
  "hasScheduledAppointment" BOOLEAN NOT NULL DEFAULT FALSE,
  "scheduledAt" TIMESTAMP,
  "patientId" TEXT,
  "simplesVetId" TEXT,
  "paymentMethod" TEXT,
  "paymentStatus" "PaymentStatus" NOT NULL DEFAULT 'PENDING',
  "paymentAmount" NUMERIC(10, 2),
  "paymentReceivedById" TEXT,
  "paymentReceivedAt" TIMESTAMP,
  "paymentNotes" TEXT,
  CONSTRAINT "queue_entries_assignedVetId_fkey" FOREIGN KEY ("assignedVetId") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE,
  CONSTRAINT "queue_entries_roomId_fkey" FOREIGN KEY ("roomId") REFERENCES "rooms"("id") ON DELETE SET NULL ON UPDATE CASCADE,
  CONSTRAINT "queue_entries_patientId_fkey" FOREIGN KEY ("patientId") REFERENCES "patients"("id") ON DELETE SET NULL ON UPDATE CASCADE,
  CONSTRAINT "queue_entries_paymentReceivedById_fkey" FOREIGN KEY ("paymentReceivedById") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE
);

CREATE TABLE IF NOT EXISTS "consultations" (
  "id" TEXT PRIMARY KEY,
  "patientId" TEXT NOT NULL,
  "queueEntryId" TEXT,
  "vetId" TEXT,
  "diagnosis" TEXT,
  "treatment" TEXT,
  "prescription" TEXT,
  "weightInKg" DOUBLE PRECISION,
  "notes" TEXT,
  "date" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "createdAt" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "consultations_patientId_fkey" FOREIGN KEY ("patientId") REFERENCES "patients"("id") ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT "consultations_queueEntryId_fkey" FOREIGN KEY ("queueEntryId") REFERENCES "queue_entries"("id") ON DELETE SET NULL ON UPDATE CASCADE,
  CONSTRAINT "consultations_vetId_fkey" FOREIGN KEY ("vetId") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE
);

CREATE TABLE IF NOT EXISTS "vaccinations" (
  "id" TEXT PRIMARY KEY,
  "patientId" TEXT NOT NULL,
  "vaccineName" TEXT NOT NULL,
  "appliedDate" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "batchNumber" TEXT,
  "vetId" TEXT,
  "nextDoseDate" TIMESTAMP,
  "notes" TEXT,
  "createdAt" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "vaccinations_patientId_fkey" FOREIGN KEY ("patientId") REFERENCES "patients"("id") ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT "vaccinations_vetId_fkey" FOREIGN KEY ("vetId") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE
);

CREATE TABLE IF NOT EXISTS "role_module_permissions" (
  "id" TEXT PRIMARY KEY,
  "role" TEXT NOT NULL,
  "module" TEXT NOT NULL,
  "createdAt" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "role_module_permissions_role_module_unique" UNIQUE ("role", "module")
);

CREATE TABLE IF NOT EXISTS "queue_form_preferences" (
  "userId" TEXT PRIMARY KEY,
  "lastTutorId" TEXT,
  "lastTutorName" TEXT,
  "lastPatientId" TEXT,
  "lastPatientName" TEXT,
  "lastServiceType" TEXT,
  "lastPriority" INTEGER,
  "lastAssignedVetId" TEXT,
  "lastHasAppointment" BOOLEAN DEFAULT FALSE,
  "lastSimplesVetId" TEXT,
  "updatedAt" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "createdAt" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "queue_form_preferences_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE TABLE IF NOT EXISTS "audit_logs" (
  "id" TEXT PRIMARY KEY,
  "userId" TEXT NOT NULL,
  "action" TEXT NOT NULL,
  "entityType" TEXT NOT NULL,
  "entityId" TEXT,
  "metadata" JSONB,
  "timestamp" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "audit_logs_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- Índices principais (criados apenas se ainda não existirem)
CREATE INDEX IF NOT EXISTS "queue_entries_status_idx" ON "queue_entries" ("status");
CREATE INDEX IF NOT EXISTS "queue_entries_priority_createdAt_idx" ON "queue_entries" ("priority", "createdAt");
CREATE INDEX IF NOT EXISTS "queue_entries_serviceType_idx" ON "queue_entries" ("serviceType");
CREATE INDEX IF NOT EXISTS "queue_entries_assignedVetId_idx" ON "queue_entries" ("assignedVetId");
CREATE INDEX IF NOT EXISTS "queue_entries_roomId_idx" ON "queue_entries" ("roomId");
CREATE INDEX IF NOT EXISTS "queue_entries_patientId_idx" ON "queue_entries" ("patientId");
CREATE INDEX IF NOT EXISTS "queue_entries_paymentStatus_idx" ON "queue_entries" ("paymentStatus");
CREATE INDEX IF NOT EXISTS "queue_entries_paymentReceivedById_idx" ON "queue_entries" ("paymentReceivedById");
CREATE INDEX IF NOT EXISTS "patients_name_idx" ON "patients" ("name");
CREATE INDEX IF NOT EXISTS "patients_tutorId_idx" ON "patients" ("tutorId");
CREATE INDEX IF NOT EXISTS "patients_tutorName_idx" ON "patients" ("tutorName");
CREATE INDEX IF NOT EXISTS "patients_tutorPhone_idx" ON "patients" ("tutorPhone");
CREATE INDEX IF NOT EXISTS "patients_microchip_idx" ON "patients" ("microchip");
CREATE INDEX IF NOT EXISTS "consultations_patientId_idx" ON "consultations" ("patientId");
CREATE INDEX IF NOT EXISTS "consultations_queueEntryId_idx" ON "consultations" ("queueEntryId");
CREATE INDEX IF NOT EXISTS "consultations_vetId_idx" ON "consultations" ("vetId");
CREATE INDEX IF NOT EXISTS "consultations_date_idx" ON "consultations" ("date");
CREATE INDEX IF NOT EXISTS "vaccinations_patientId_idx" ON "vaccinations" ("patientId");
CREATE INDEX IF NOT EXISTS "vaccinations_vetId_idx" ON "vaccinations" ("vetId");
CREATE INDEX IF NOT EXISTS "vaccinations_appliedDate_idx" ON "vaccinations" ("appliedDate");
CREATE INDEX IF NOT EXISTS "vaccinations_nextDoseDate_idx" ON "vaccinations" ("nextDoseDate");
CREATE INDEX IF NOT EXISTS "role_module_permissions_role_idx" ON "role_module_permissions" ("role");
CREATE INDEX IF NOT EXISTS "users_currentRoomId_idx" ON "users" ("currentRoomId");
CREATE INDEX IF NOT EXISTS "audit_logs_userId_idx" ON "audit_logs" ("userId");
CREATE INDEX IF NOT EXISTS "audit_logs_entity_idx" ON "audit_logs" ("entityType", "entityId");
CREATE INDEX IF NOT EXISTS "audit_logs_timestamp_idx" ON "audit_logs" ("timestamp");

-- Limpa cada tabela, ignorando as que ainda não existem
TRUNCATE TABLE IF EXISTS "audit_logs" CASCADE;
TRUNCATE TABLE IF EXISTS "consultations" CASCADE;
TRUNCATE TABLE IF EXISTS "vaccinations" CASCADE;
TRUNCATE TABLE IF EXISTS "queue_form_preferences" CASCADE;
TRUNCATE TABLE IF EXISTS "queue_entries" CASCADE;
TRUNCATE TABLE IF EXISTS "patients" CASCADE;
TRUNCATE TABLE IF EXISTS "tutors" CASCADE;
TRUNCATE TABLE IF EXISTS "role_module_permissions" CASCADE;
TRUNCATE TABLE IF EXISTS "services" CASCADE;
TRUNCATE TABLE IF EXISTS "rooms" CASCADE;
TRUNCATE TABLE IF EXISTS "users" CASCADE;

-- Salas de atendimento
INSERT INTO "rooms" ("id", "name", "isActive", "createdAt") VALUES
  ('2f9ab27b-1000-4000-9000-000000000001', 'Consultório 1', TRUE, '2024-12-01T08:00:00Z'),
  ('2f9ab27b-1000-4000-9000-000000000002', 'Consultório 2', TRUE, '2024-12-01T08:00:00Z'),
  ('2f9ab27b-1000-4000-9000-000000000003', 'Cirurgia', TRUE, '2024-12-01T08:00:00Z'),
  ('2f9ab27b-1000-4000-9000-000000000004', 'Exames', TRUE, '2024-12-01T08:00:00Z');

-- Usuários do sistema
INSERT INTO "users" (
  "id",
  "username",
  "password",
  "name",
  "role",
  "createdAt",
  "currentRoomId",
  "roomCheckedInAt",
  "lastActivityAt"
) VALUES
  ('0b04d2f8-1a1a-4f20-8c8f-000000000001', 'admin', '$2b$10$JOWKio71Xd2C/tSaHCb1HuL9CwcdJ9oHV8gk.FCIPm49caQYh0lgS', 'Administrador Geral', 'ADMIN', '2024-12-02T12:00:00Z', NULL, NULL, '2025-02-01T08:00:00Z'),
  ('0b04d2f8-1a1a-4f20-8c8f-000000000002', 'recepcao1', '$2b$10$JOWKio71Xd2C/tSaHCb1HuL9CwcdJ9oHV8gk.FCIPm49caQYh0lgS', 'Paula Menezes', 'RECEPCAO', '2024-12-05T09:30:00Z', NULL, NULL, '2025-02-01T11:15:00Z'),
  ('0b04d2f8-1a1a-4f20-8c8f-000000000003', 'recepcao2', '$2b$10$JOWKio71Xd2C/tSaHCb1HuL9CwcdJ9oHV8gk.FCIPm49caQYh0lgS', 'Clara Nunes', 'RECEPCAO', '2024-12-05T09:35:00Z', NULL, NULL, '2025-02-01T11:20:00Z'),
  ('0b04d2f8-1a1a-4f20-8c8f-000000000004', 'vet.lima', '$2b$10$JOWKio71Xd2C/tSaHCb1HuL9CwcdJ9oHV8gk.FCIPm49caQYh0lgS', 'Dr. Renato Lima', 'VET', '2024-12-02T12:10:00Z', '2f9ab27b-1000-4000-9000-000000000001', '2025-02-01T11:05:00Z', '2025-02-01T11:32:00Z'),
  ('0b04d2f8-1a1a-4f20-8c8f-000000000005', 'vet.mendes', '$2b$10$JOWKio71Xd2C/tSaHCb1HuL9CwcdJ9oHV8gk.FCIPm49caQYh0lgS', 'Dra. Sofia Mendes', 'VET', '2024-12-02T12:12:00Z', '2f9ab27b-1000-4000-9000-000000000002', '2025-02-01T10:45:00Z', '2025-02-01T11:20:00Z'),
  ('0b04d2f8-1a1a-4f20-8c8f-000000000006', 'vet.alves', '$2b$10$JOWKio71Xd2C/tSaHCb1HuL9CwcdJ9oHV8gk.FCIPm49caQYh0lgS', 'Dr. Bruno Alves', 'VET', '2024-12-02T12:15:00Z', NULL, NULL, '2025-02-01T10:50:00Z');

-- Serviços ofertados
INSERT INTO "services" ("id", "name", "isActive", "createdAt") VALUES
  ('3e5d2d14-2000-4000-a000-000000000001', 'Consulta', TRUE, '2024-12-01T08:05:00Z'),
  ('3e5d2d14-2000-4000-a000-000000000002', 'Vacinação', TRUE, '2024-12-01T08:05:00Z'),
  ('3e5d2d14-2000-4000-a000-000000000003', 'Cirurgia', TRUE, '2024-12-01T08:05:00Z'),
  ('3e5d2d14-2000-4000-a000-000000000004', 'Exame', TRUE, '2024-12-01T08:05:00Z'),
  ('3e5d2d14-2000-4000-a000-000000000005', 'Banho e Tosa', TRUE, '2024-12-01T08:05:00Z');

-- Tutores cadastrados
INSERT INTO "tutors" ("id", "name", "phone", "email", "cpfCnpj", "address", "createdAt", "updatedAt") VALUES
  ('4a1ef98c-3000-4000-b000-000000000001', 'Mariana Souza', '(11) 91234-5678', 'mariana.souza@example.com', '123.456.789-00', 'Rua das Flores, 123 - São Paulo/SP', '2024-11-10T13:45:00Z', '2025-02-01T09:00:00Z'),
  ('4a1ef98c-3000-4000-b000-000000000002', 'Carlos Pereira', '(11) 99876-5432', 'carlos.pereira@example.com', '321.654.987-00', 'Avenida Paulista, 900 - São Paulo/SP', '2024-10-05T10:20:00Z', '2025-01-28T15:30:00Z'),
  ('4a1ef98c-3000-4000-b000-000000000003', 'Fernanda Costa', '(12) 98765-4321', 'fernanda.costa@example.com', '456.789.123-00', 'Rua da Lagoa, 45 - Campinas/SP', '2024-09-12T09:15:00Z', '2025-01-18T11:10:00Z'),
  ('4a1ef98c-3000-4000-b000-000000000004', 'Ricardo Alves', '(13) 97654-3210', 'ricardo.alves@example.com', '654.321.987-00', 'Rua das Palmeiras, 765 - Santos/SP', '2024-12-22T14:05:00Z', '2025-02-01T08:40:00Z'),
  ('4a1ef98c-3000-4000-b000-000000000005', 'Patrícia Lima', '(11) 95555-2244', 'patricia.lima@example.com', '987.654.321-00', 'Rua Itapeva, 55 - São Paulo/SP', '2025-01-05T16:00:00Z', '2025-02-02T10:15:00Z');

-- Pacientes registrados
INSERT INTO "patients" (
  "id",
  "name",
  "species",
  "breed",
  "birthDate",
  "gender",
  "microchip",
  "color",
  "currentWeight",
  "allergies",
  "temperament",
  "neutered",
  "tutorId",
  "tutorName",
  "tutorPhone",
  "tutorEmail",
  "tutorCpfCnpj",
  "tutorAddress",
  "notes",
  "createdAt",
  "updatedAt"
) VALUES
  (
    '5b3af98c-4000-4000-c000-000000000001',
    'Thor',
    'Cachorro',
    'Labrador',
    '2018-05-10T00:00:00Z',
    'M',
    'BR123456789012345',
    'Dourado',
    32.5,
    'Ração com frango',
    'Sociável',
    TRUE,
    '4a1ef98c-3000-4000-b000-000000000001',
    'Mariana Souza',
    '(11) 91234-5678',
    'mariana.souza@example.com',
    '123.456.789-00',
    'Rua das Flores, 123 - São Paulo/SP',
    'Paciente com leve displasia.',
    '2024-11-12T10:00:00Z',
    '2025-01-30T09:30:00Z'
  ),
  (
    '5b3af98c-4000-4000-c000-000000000002',
    'Luna',
    'Gato',
    'Siamês',
    '2021-09-18T00:00:00Z',
    'F',
    'BR987654321098765',
    'Cinza',
    4.2,
    NULL,
    'Calma',
    TRUE,
    '4a1ef98c-3000-4000-b000-000000000002',
    'Carlos Pereira',
    '(11) 99876-5432',
    'carlos.pereira@example.com',
    '321.654.987-00',
    'Avenida Paulista, 900 - São Paulo/SP',
    'Observação: tutor relata episódios de vômito esporádico.',
    '2024-10-07T11:45:00Z',
    '2025-01-20T14:22:00Z'
  ),
  (
    '5b3af98c-4000-4000-c000-000000000003',
    'Bidu',
    'Cachorro',
    'Beagle',
    '2019-03-22T00:00:00Z',
    'M',
    NULL,
    'Tricolor',
    12.8,
    'Nenhuma conhecida',
    'Curioso',
    FALSE,
    '4a1ef98c-3000-4000-b000-000000000003',
    'Fernanda Costa',
    '(12) 98765-4321',
    'fernanda.costa@example.com',
    '456.789.123-00',
    'Rua da Lagoa, 45 - Campinas/SP',
    'Chegada por emergência após ingestão de objeto.',
    '2024-09-15T09:45:00Z',
    '2025-01-25T17:10:00Z'
  ),
  (
    '5b3af98c-4000-4000-c000-000000000004',
    'Mika',
    'Gato',
    'SRD',
    '2020-02-02T00:00:00Z',
    'F',
    NULL,
    'Rajado',
    3.9,
    NULL,
    'Reservada',
    TRUE,
    '4a1ef98c-3000-4000-b000-000000000004',
    'Ricardo Alves',
    '(13) 97654-3210',
    'ricardo.alves@example.com',
    '654.321.987-00',
    'Rua das Palmeiras, 765 - Santos/SP',
    'Paciente em acompanhamento por doença renal.',
    '2024-12-27T10:30:00Z',
    '2025-01-31T11:45:00Z'
  ),
  (
    '5b3af98c-4000-4000-c000-000000000005',
    'Zeus',
    'Cachorro',
    'Pastor Alemão',
    '2017-07-14T00:00:00Z',
    'M',
    'BR555555555555555',
    'Preto',
    38.4,
    NULL,
    'Protetor',
    TRUE,
    '4a1ef98c-3000-4000-b000-000000000004',
    'Ricardo Alves',
    '(13) 97654-3210',
    'ricardo.alves@example.com',
    '654.321.987-00',
    'Rua das Palmeiras, 765 - Santos/SP',
    'Histórico de cirurgia ortopédica recente.',
    '2024-12-28T09:00:00Z',
    '2025-01-30T08:20:00Z'
  ),
  (
    '5b3af98c-4000-4000-c000-000000000006',
    'Mel',
    'Cachorro',
    'Poodle',
    '2022-04-04T00:00:00Z',
    'F',
    NULL,
    'Branco',
    6.5,
    'Sensibilidade a produtos de limpeza',
    'Afetuosa',
    TRUE,
    '4a1ef98c-3000-4000-b000-000000000005',
    'Patrícia Lima',
    '(11) 95555-2244',
    'patricia.lima@example.com',
    '987.654.321-00',
    'Rua Itapeva, 55 - São Paulo/SP',
    'Paciente frequente para banho e tosa.',
    '2025-01-06T09:10:00Z',
    '2025-02-01T18:05:00Z'
  );

-- Permissões de módulos por papel
INSERT INTO "role_module_permissions" ("id", "role", "module", "createdAt") VALUES
  ('a0b1c2d3-9000-4000-a111-000000000001', 'ADMIN', 'queue', '2024-12-02T12:20:00Z'),
  ('a0b1c2d3-9000-4000-a111-000000000002', 'ADMIN', 'patients', '2024-12-02T12:20:01Z'),
  ('a0b1c2d3-9000-4000-a111-000000000003', 'ADMIN', 'tutors', '2024-12-02T12:20:02Z'),
  ('a0b1c2d3-9000-4000-a111-000000000004', 'ADMIN', 'financial', '2024-12-02T12:20:03Z'),
  ('a0b1c2d3-9000-4000-a111-000000000005', 'ADMIN', 'admin_users', '2024-12-02T12:20:04Z'),
  ('a0b1c2d3-9000-4000-a111-000000000006', 'ADMIN', 'admin_rooms', '2024-12-02T12:20:05Z'),
  ('a0b1c2d3-9000-4000-a111-000000000007', 'ADMIN', 'admin_services', '2024-12-02T12:20:06Z'),
  ('a0b1c2d3-9000-4000-a111-000000000008', 'ADMIN', 'reports', '2024-12-02T12:20:07Z'),
  ('a0b1c2d3-9000-4000-a111-000000000009', 'ADMIN', 'audit', '2024-12-02T12:20:08Z'),
  ('a0b1c2d3-9000-4000-a111-000000000010', 'ADMIN', 'permissions', '2024-12-02T12:20:09Z'),
  ('a0b1c2d3-9000-4000-a111-000000000011', 'RECEPCAO', 'queue', '2024-12-05T09:40:00Z'),
  ('a0b1c2d3-9000-4000-a111-000000000012', 'RECEPCAO', 'patients', '2024-12-05T09:40:01Z'),
  ('a0b1c2d3-9000-4000-a111-000000000013', 'RECEPCAO', 'tutors', '2024-12-05T09:40:02Z'),
  ('a0b1c2d3-9000-4000-a111-000000000014', 'RECEPCAO', 'financial', '2024-12-05T09:40:03Z'),
  ('a0b1c2d3-9000-4000-a111-000000000015', 'RECEPCAO', 'admin_rooms', '2024-12-05T09:40:04Z'),
  ('a0b1c2d3-9000-4000-a111-000000000016', 'RECEPCAO', 'admin_services', '2024-12-05T09:40:05Z'),
  ('a0b1c2d3-9000-4000-a111-000000000017', 'RECEPCAO', 'reports', '2024-12-05T09:40:06Z'),
  ('a0b1c2d3-9000-4000-a111-000000000018', 'RECEPCAO', 'audit', '2024-12-05T09:40:07Z'),
  ('a0b1c2d3-9000-4000-a111-000000000019', 'RECEPCAO', 'permissions', '2024-12-05T09:40:08Z'),
  ('a0b1c2d3-9000-4000-a111-000000000020', 'VET', 'queue', '2024-12-02T12:25:00Z'),
  ('a0b1c2d3-9000-4000-a111-000000000021', 'VET', 'patients', '2024-12-02T12:25:01Z'),
  ('a0b1c2d3-9000-4000-a111-000000000022', 'VET', 'reports', '2024-12-02T12:25:02Z');

-- Preferências do formulário de fila salvas
INSERT INTO "queue_form_preferences" (
  "userId",
  "lastTutorId",
  "lastTutorName",
  "lastPatientId",
  "lastPatientName",
  "lastServiceType",
  "lastPriority",
  "lastAssignedVetId",
  "lastHasAppointment",
  "lastSimplesVetId",
  "updatedAt",
  "createdAt"
) VALUES
  (
    '0b04d2f8-1a1a-4f20-8c8f-000000000002',
    '4a1ef98c-3000-4000-b000-000000000001',
    'Mariana Souza',
    '5b3af98c-4000-4000-c000-000000000001',
    'Thor',
    'Consulta',
    2,
    '0b04d2f8-1a1a-4f20-8c8f-000000000004',
    TRUE,
    'SV-2025-0099',
    '2025-02-01T11:10:00Z',
    '2025-01-05T08:00:00Z'
  ),
  (
    '0b04d2f8-1a1a-4f20-8c8f-000000000004',
    '4a1ef98c-3000-4000-b000-000000000005',
    'Patrícia Lima',
    '5b3af98c-4000-4000-c000-000000000006',
    'Mel',
    'Consulta',
    2,
    '0b04d2f8-1a1a-4f20-8c8f-000000000004',
    FALSE,
    'SV-2025-0066',
    '2025-01-22T10:00:00Z',
    '2024-12-15T09:00:00Z'
  );

-- Entradas de fila com diferentes cenários
INSERT INTO "queue_entries" (
  "id",
  "patientName",
  "tutorName",
  "serviceType",
  "priority",
  "status",
  "createdAt",
  "calledAt",
  "completedAt",
  "assignedVetId",
  "roomId",
  "hasScheduledAppointment",
  "scheduledAt",
  "patientId",
  "simplesVetId",
  "paymentMethod",
  "paymentStatus",
  "paymentAmount",
  "paymentReceivedById",
  "paymentReceivedAt",
  "paymentNotes"
) VALUES
  (
    '6c4b1a00-5000-4000-d000-000000000001',
    'Thor',
    'Mariana Souza',
    'Consulta',
    2,
    'COMPLETED',
    '2025-01-15T09:15:00Z',
    '2025-01-15T09:25:00Z',
    '2025-01-15T10:05:00Z',
    '0b04d2f8-1a1a-4f20-8c8f-000000000004',
    '2f9ab27b-1000-4000-9000-000000000001',
    TRUE,
    '2025-01-10T12:00:00Z',
    '5b3af98c-4000-4000-c000-000000000001',
    'SV-2025-0001',
    'PIX',
    'PAID',
    220.00,
    '0b04d2f8-1a1a-4f20-8c8f-000000000002',
    '2025-01-15T10:10:00Z',
    'Pagamento integral via PIX'
  ),
  (
    '6c4b1a00-5000-4000-d000-000000000002',
    'Luna',
    'Carlos Pereira',
    'Vacinação',
    3,
    'COMPLETED',
    '2025-01-14T14:00:00Z',
    '2025-01-14T14:10:00Z',
    '2025-01-14T14:25:00Z',
    '0b04d2f8-1a1a-4f20-8c8f-000000000005',
    '2f9ab27b-1000-4000-9000-000000000002',
    FALSE,
    NULL,
    '5b3af98c-4000-4000-c000-000000000002',
    'SV-2025-0008',
    'Cartão de Crédito',
    'PARTIAL',
    180.00,
    '0b04d2f8-1a1a-4f20-8c8f-000000000003',
    '2025-01-14T14:30:00Z',
    'Cliente parcelou em 2x.'
  ),
  (
    '6c4b1a00-5000-4000-d000-000000000003',
    'Bidu',
    'Fernanda Costa',
    'Consulta',
    1,
    'COMPLETED',
    '2025-01-12T08:40:00Z',
    '2025-01-12T08:45:00Z',
    '2025-01-12T09:30:00Z',
    '0b04d2f8-1a1a-4f20-8c8f-000000000004',
    '2f9ab27b-1000-4000-9000-000000000001',
    TRUE,
    '2025-01-11T09:00:00Z',
    '5b3af98c-4000-4000-c000-000000000003',
    'SV-2025-0015',
    NULL,
    'PENDING',
    NULL,
    NULL,
    NULL,
    'Aguardando retorno do tutor com aprovação do orçamento.'
  ),
  (
    '6c4b1a00-5000-4000-d000-000000000004',
    'Mika',
    'Ricardo Alves',
    'Exame',
    3,
    'IN_PROGRESS',
    '2025-02-01T11:00:00Z',
    '2025-02-01T11:05:00Z',
    NULL,
    '0b04d2f8-1a1a-4f20-8c8f-000000000005',
    '2f9ab27b-1000-4000-9000-000000000002',
    FALSE,
    NULL,
    '5b3af98c-4000-4000-c000-000000000004',
    'SV-2025-0022',
    'Cartão de Débito',
    'PENDING',
    NULL,
    NULL,
    NULL,
    NULL
  ),
  (
    '6c4b1a00-5000-4000-d000-000000000005',
    'Zeus',
    'Ricardo Alves',
    'Cirurgia',
    1,
    'WAITING',
    '2025-02-01T07:45:00Z',
    NULL,
    NULL,
    NULL,
    NULL,
    TRUE,
    '2025-02-01T12:00:00Z',
    '5b3af98c-4000-4000-c000-000000000005',
    'SV-2025-0031',
    NULL,
    'PENDING',
    NULL,
    NULL,
    NULL,
    NULL
  ),
  (
    '6c4b1a00-5000-4000-d000-000000000006',
    'Mel',
    'Patrícia Lima',
    'Banho e Tosa',
    3,
    'CALLED',
    '2025-02-01T10:20:00Z',
    '2025-02-01T10:50:00Z',
    NULL,
    '0b04d2f8-1a1a-4f20-8c8f-000000000006',
    '2f9ab27b-1000-4000-9000-000000000004',
    FALSE,
    NULL,
    '5b3af98c-4000-4000-c000-000000000006',
    'SV-2025-0045',
    'Dinheiro',
    'PENDING',
    NULL,
    NULL,
    NULL,
    NULL
  ),
  (
    '6c4b1a00-5000-4000-d000-000000000007',
    'Thor',
    'Mariana Souza',
    'Vacinação',
    3,
    'COMPLETED',
    '2024-12-05T13:15:00Z',
    '2024-12-05T13:25:00Z',
    '2024-12-05T13:40:00Z',
    '0b04d2f8-1a1a-4f20-8c8f-000000000005',
    '2f9ab27b-1000-4000-9000-000000000002',
    FALSE,
    NULL,
    '5b3af98c-4000-4000-c000-000000000001',
    'SV-2024-0911',
    'PIX',
    'PAID',
    150.00,
    '0b04d2f8-1a1a-4f20-8c8f-000000000002',
    '2024-12-05T13:45:00Z',
    NULL
  ),
  (
    '6c4b1a00-5000-4000-d000-000000000008',
    'Luna',
    'Carlos Pereira',
    'Consulta',
    2,
    'CANCELLED',
    '2025-01-20T16:30:00Z',
    '2025-01-20T16:40:00Z',
    NULL,
    '0b04d2f8-1a1a-4f20-8c8f-000000000006',
    '2f9ab27b-1000-4000-9000-000000000001',
    TRUE,
    '2025-01-19T10:00:00Z',
    '5b3af98c-4000-4000-c000-000000000002',
    'SV-2025-0055',
    NULL,
    'CANCELLED',
    NULL,
    NULL,
    NULL,
    'Tutor cancelou ao chegar ao balcão.'
  ),
  (
    '6c4b1a00-5000-4000-d000-000000000009',
    'Zeus',
    'Ricardo Alves',
    'Cirurgia',
    1,
    'COMPLETED',
    '2024-12-18T07:00:00Z',
    '2024-12-18T07:05:00Z',
    '2024-12-18T11:30:00Z',
    '0b04d2f8-1a1a-4f20-8c8f-000000000005',
    '2f9ab27b-1000-4000-9000-000000000003',
    TRUE,
    '2024-12-10T09:00:00Z',
    '5b3af98c-4000-4000-c000-000000000005',
    'SV-2024-0820',
    'Transferência',
    'PAID',
    3500.00,
    '0b04d2f8-1a1a-4f20-8c8f-000000000003',
    '2024-12-18T12:00:00Z',
    'Cirurgia ortopédica quitada.'
  ),
  (
    '6c4b1a00-5000-4000-d000-000000000010',
    'Mel',
    'Patrícia Lima',
    'Consulta',
    2,
    'COMPLETED',
    '2025-01-22T09:10:00Z',
    '2025-01-22T09:20:00Z',
    '2025-01-22T09:55:00Z',
    '0b04d2f8-1a1a-4f20-8c8f-000000000004',
    '2f9ab27b-1000-4000-9000-000000000001',
    FALSE,
    NULL,
    '5b3af98c-4000-4000-c000-000000000006',
    'SV-2025-0066',
    'PIX',
    'PARTIAL',
    260.00,
    '0b04d2f8-1a1a-4f20-8c8f-000000000002',
    '2025-01-22T10:10:00Z',
    'Cliente pagou sinal, restante na retirada de exames.'
  );

-- Consultas concluídas
INSERT INTO "consultations" (
  "id",
  "patientId",
  "queueEntryId",
  "vetId",
  "diagnosis",
  "treatment",
  "prescription",
  "weightInKg",
  "notes",
  "date",
  "createdAt",
  "updatedAt"
) VALUES
  (
    '7d5c2b00-6000-4000-e000-000000000001',
    '5b3af98c-4000-4000-c000-000000000001',
    '6c4b1a00-5000-4000-d000-000000000001',
    '0b04d2f8-1a1a-4f20-8c8f-000000000004',
    'Gastrite leve',
    'Reposição hídrica e omeprazol por 5 dias',
    'Omeprazol 10mg - 1x/dia por 5 dias',
    32.5,
    'Paciente respondeu bem à medicação.',
    '2025-01-15T10:00:00Z',
    '2025-01-15T10:06:00Z',
    '2025-01-15T10:06:00Z'
  ),
  (
    '7d5c2b00-6000-4000-e000-000000000002',
    '5b3af98c-4000-4000-c000-000000000003',
    '6c4b1a00-5000-4000-d000-000000000003',
    '0b04d2f8-1a1a-4f20-8c8f-000000000004',
    'Corpo estranho ingerido',
    'Internação para observação e analgesia',
    'Dipirona 20mg/kg se necessário',
    12.8,
    'Tutor optou por aguardar orçamento da cirurgia.',
    '2025-01-12T09:20:00Z',
    '2025-01-12T09:35:00Z',
    '2025-01-12T09:35:00Z'
  ),
  (
    '7d5c2b00-6000-4000-e000-000000000003',
    '5b3af98c-4000-4000-c000-000000000006',
    '6c4b1a00-5000-4000-d000-000000000010',
    '0b04d2f8-1a1a-4f20-8c8f-000000000004',
    'Otite externa bilateral',
    'Limpeza auricular e antibiótico tópico',
    'Otomax - aplicar 2 gotas em cada orelha 2x/dia por 10 dias',
    6.5,
    'Recomendada reavaliação em 10 dias.',
    '2025-01-22T09:50:00Z',
    '2025-01-22T09:58:00Z',
    '2025-01-22T09:58:00Z'
  );

-- Vacinações registradas
INSERT INTO "vaccinations" (
  "id",
  "patientId",
  "vaccineName",
  "appliedDate",
  "batchNumber",
  "vetId",
  "nextDoseDate",
  "notes",
  "createdAt"
) VALUES
  (
    '8e6d3c00-7000-4000-f000-000000000001',
    '5b3af98c-4000-4000-c000-000000000001',
    'V8/V10',
    '2024-12-05T13:35:00Z',
    'LOT12345',
    '0b04d2f8-1a1a-4f20-8c8f-000000000005',
    '2025-12-05T13:35:00Z',
    'Dose anual aplicada sem intercorrências.',
    '2024-12-05T13:40:00Z'
  ),
  (
    '8e6d3c00-7000-4000-f000-000000000002',
    '5b3af98c-4000-4000-c000-000000000002',
    'V4/V5 (Felina)',
    '2025-01-14T14:20:00Z',
    'LOT67890',
    '0b04d2f8-1a1a-4f20-8c8f-000000000005',
    '2025-07-14T14:20:00Z',
    'Agendado reforço semestral.',
    '2025-01-14T14:25:00Z'
  ),
  (
    '8e6d3c00-7000-4000-f000-000000000003',
    '5b3af98c-4000-4000-c000-000000000006',
    'Antirrábica',
    '2024-11-10T15:10:00Z',
    'LOT99887',
    '0b04d2f8-1a1a-4f20-8c8f-000000000004',
    '2025-11-10T15:10:00Z',
    'Paciente tranquila durante a aplicação.',
    '2024-11-10T15:15:00Z'
  );

-- Logs de auditoria para rastreabilidade
INSERT INTO "audit_logs" (
  "id",
  "userId",
  "action",
  "entityType",
  "entityId",
  "metadata",
  "timestamp"
) VALUES
  (
    '9f7e4d00-8000-4000-ffff-000000000001',
    '0b04d2f8-1a1a-4f20-8c8f-000000000002',
    'CREATE_ENTRY',
    'QueueEntry',
    '6c4b1a00-5000-4000-d000-000000000001',
    '{"priority":2,"serviceType":"Consulta"}'::jsonb,
    '2025-01-15T09:10:00Z'
  ),
  (
    '9f7e4d00-8000-4000-ffff-000000000002',
    '0b04d2f8-1a1a-4f20-8c8f-000000000004',
    'CALL_PATIENT',
    'QueueEntry',
    '6c4b1a00-5000-4000-d000-000000000001',
    '{"previousStatus":"WAITING","newStatus":"CALLED"}'::jsonb,
    '2025-01-15T09:24:00Z'
  ),
  (
    '9f7e4d00-8000-4000-ffff-000000000003',
    '0b04d2f8-1a1a-4f20-8c8f-000000000004',
    'COMPLETE_ENTRY',
    'QueueEntry',
    '6c4b1a00-5000-4000-d000-000000000001',
    '{"previousStatus":"IN_PROGRESS","newStatus":"COMPLETED"}'::jsonb,
    '2025-01-15T10:06:00Z'
  ),
  (
    '9f7e4d00-8000-4000-ffff-000000000004',
    '0b04d2f8-1a1a-4f20-8c8f-000000000003',
    'PAYMENT_RECEIVED',
    'QueueEntry',
    '6c4b1a00-5000-4000-d000-000000000002',
    '{"amount":180.0,"method":"Cartão de Crédito"}'::jsonb,
    '2025-01-14T14:32:00Z'
  ),
  (
    '9f7e4d00-8000-4000-ffff-000000000005',
    '0b04d2f8-1a1a-4f20-8c8f-000000000002',
    'UPDATE_STATUS',
    'QueueEntry',
    '6c4b1a00-5000-4000-d000-000000000003',
    '{"previousStatus":"CALLED","newStatus":"COMPLETED"}'::jsonb,
    '2025-01-12T09:35:00Z'
  ),
  (
    '9f7e4d00-8000-4000-ffff-000000000006',
    '0b04d2f8-1a1a-4f20-8c8f-000000000003',
    'CANCEL_ENTRY',
    'QueueEntry',
    '6c4b1a00-5000-4000-d000-000000000008',
    '{"reason":"Tutor não confirmou exames"}'::jsonb,
    '2025-01-20T16:50:00Z'
  );

COMMIT;



# Solução Detalhada para Migration Falha

## Problema
A migration `20241031000000_init` está marcada como falha no banco, bloqueando novas migrations.

## Solução Rápida (Se apagou registros por engano)

Se você já apagou os registros, execute este SQL para recriar:

```bash
# No container do backend
docker exec -it vetqueue-backend-1 sh

# Aplicar script SQL
psql postgresql://vetqueue:vetqueue@db:5432/vetqueue < prisma/fix-migrations.sql

# OU copiar e colar o conteúdo de fix-migrations.sql no psql
```

Depois execute: `npx prisma migrate deploy`

---

## Solução Simples (RECOMENDADA - GrugBrain)

### Passo 1: Conectar ao banco de dados

```bash
# SSH no servidor
ssh seu-usuario@seu-servidor

# Entre no container do backend
docker exec -it vetqueue-backend-1 sh

# Conecte ao PostgreSQL
psql postgresql://vetqueue:vetqueue@db:5432/vetqueue
```

### Passo 2: Verificar se tabelas existem (confirma que migration foi aplicada)

```sql
\dt
```

Se as tabelas `queue_entries`, `users`, `rooms` etc. existem, a migration foi aplicada com sucesso.

### Passo 3: Marcar migrations como aplicadas (CORRETO!)

**IMPORTANTE:** Não apagar! Apenas marcar como aplicada, senão Prisma tenta aplicar novamente.

```sql
-- Marcar a migration como aplicada (com timestamp de agora)
INSERT INTO _prisma_migrations (migration_name, checksum, finished_at, applied_steps_count)
VALUES (
  '20241031000000_init',
  '',  -- checksum vazio é ok para migrations antigas
  NOW(),
  1
)
ON CONFLICT (migration_name) DO UPDATE
SET finished_at = NOW(),
    rolled_back_at = NULL,
    logs = NULL
WHERE _prisma_migrations.finished_at IS NULL;
```

**OU mais simples - usar comando Prisma:**

```bash
# No container
npx prisma migrate resolve --applied 20241031000000_init
```

### Passo 4: Verificar migrations restantes

```sql
SELECT migration_name, finished_at, rolled_back_at 
FROM _prisma_migrations 
ORDER BY started_at;
```

### Passo 5: Sair e testar

```sql
\q
```

```bash
# Testar se migrate:deploy funciona agora
npx prisma migrate deploy
```

## Alternativa: Marcar como aplicada (se preferir manter histórico)

```sql
-- Se quiser manter o registro mas marcar como aplicada
UPDATE _prisma_migrations 
SET finished_at = NOW(), 
    rolled_back_at = NULL,
    logs = NULL
WHERE migration_name = '20241031000000_init' 
  AND finished_at IS NULL;
```

### Passo 4: Sair do PostgreSQL e aplicar nova migration

```sql
\q
```

```bash
# No container, aplicar migrations
npx prisma migrate deploy

# Ou se estiver em dev
npx prisma migrate dev
```

### Passo 5: Verificar se tabela patients foi criada

```sql
psql postgresql://vetqueue:vetqueue@db:5432/vetqueue

\dt patients
\d patients

\q
```

## Alternativa Mais Simples (se todas as migrations já foram aplicadas)

Se todas as migrations já estão aplicadas no banco, apenas marque todas como resolvidas:

```bash
docker exec -it vetqueue-backend-1 sh

# Marcar todas as migrations existentes como aplicadas
npx prisma migrate resolve --applied 20241031000000_init
npx prisma migrate resolve --applied 20250101000000_add_users_rooms_relations
npx prisma migrate resolve --applied 20250101000001_add_services
npx prisma migrate resolve --applied 20250101000002_add_audit
npx prisma migrate resolve --applied 20250101000003_add_scheduled_appointment_fields
npx prisma migrate resolve --applied 20250102000000_add_user_room_checkin_fields

# Agora aplicar a nova
npx prisma migrate deploy
```


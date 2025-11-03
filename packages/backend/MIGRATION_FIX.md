# Resolver Migration Falha

O erro indica que a migration `20241031000000_init` falhou no banco.

## Solução 1: Marcar migration como resolvida (se tabelas já existem)

Se as tabelas já existem no banco, apenas marque a migration como resolvida:

```bash
cd packages/backend
npx prisma migrate resolve --applied 20241031000000_init
```

## Solução 2: Reset completo (CUIDADO - apaga dados!)

Se estiver em desenvolvimento e puder perder dados:

```bash
cd packages/backend
npx prisma migrate reset
```

## Solução 3: Aplicar migration manualmente

Se a tabela `patients` já existe no banco de forma manual, apenas marque como aplicada:

```bash
cd packages/backend
npx prisma migrate resolve --applied 20250103000000_add_patients
```

## Depois de resolver:

Aplicar a nova migration de patients:

```bash
cd packages/backend
npx prisma migrate deploy
```

OU se em dev:

```bash
cd packages/backend
npx prisma migrate dev
```


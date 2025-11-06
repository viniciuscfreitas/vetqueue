# Testes

## Setup

Os testes precisam de um banco de dados PostgreSQL rodando.

1. Configure `DATABASE_URL` no `.env` ou como variável de ambiente
2. Execute as migrations: `npm run migrate`
3. Rode os testes: `npm run test` ou `npm run test:run`

## Executar testes

```bash
# Modo watch (desenvolvimento)
npm run test

# Executar uma vez
npm run test:run
```

## Nota

Se `DATABASE_URL` não estiver configurada, os testes serão pulados automaticamente.


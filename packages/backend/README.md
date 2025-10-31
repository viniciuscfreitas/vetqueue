# Backend - VetQueue

## Setup

1. Configure o arquivo `.env`:
```
DATABASE_URL="postgresql://user:password@localhost:5432/vetqueue?schema=public"
PORT=3001
```

2. Instale dependências:
```bash
npm install
```

3. Execute migrations:
```bash
npm run migrate
```

4. Inicie o servidor:
```bash
npm run dev
```

## Usando Docker Compose (PostgreSQL)

```bash
docker-compose up -d
```

Isso iniciará um PostgreSQL local na porta 5432.


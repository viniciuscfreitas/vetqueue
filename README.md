# Fisiopet - Sistema de Fila de Atendimento

Sistema de fila de atendimento desenvolvido com Node.js/TypeScript no backend e Next.js no frontend.

## Stack

- **Backend**: Node.js + TypeScript + Express + PostgreSQL + Prisma
- **Frontend**: Next.js + TypeScript + Shadcn/ui + TanStack Query

## Estrutura

```
vetqueue/
├── packages/
│   ├── backend/     # API REST
│   └── frontend/    # Next.js App
```

## Configuração

### Backend

1. Copie `.env.example` para `.env` e configure a conexão do PostgreSQL
2. Instale dependências: `npm install`
3. Execute migrations: `npm run db:migrate`
4. Inicie o servidor: `npm run dev:backend`

### Frontend

1. Configure a variável `NEXT_PUBLIC_API_URL` (opcional, padrão: http://localhost:3001)
2. Instale dependências: `npm install`
3. Inicie o servidor: `npm run dev:frontend`

## Funcionalidades

### Fase 1 (MVP)
- ✅ Adicionar entrada à fila
- ✅ Chamar próximo da fila
- ✅ Listar fila atual
- ✅ Iniciar/Finalizar atendimento

### Fase 2
- ✅ Histórico de atendimentos
- ✅ Cancelar entrada

### Fase 3
- ✅ Relatórios básicos

## Decisões Arquiteturais

Arquitetura em camadas simples (pragmática):
- `api/` - Controllers e Rotas
- `services/` - Lógica de negócio
- `repositories/` - Acesso a dados (Prisma)

Seguindo princípios Grug Brain: simplicidade primeiro, evitar over-engineering.


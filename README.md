# VetQueue

Queue management system for veterinary clinics. Simple REST API with Next.js frontend and public display page.

Built for Fisiopet Veterinary Hospital, Santos, São Paulo, Brazil.

## What it does

Recepcionists add patients to queue, veterinarians call next patient and manage appointments. Public display page shows current queue status on TV screens.

## Stack

- Backend: Node.js, TypeScript, Express, PostgreSQL, Prisma
- Frontend: Next.js, TypeScript, TanStack Query, Tailwind CSS
- Database: PostgreSQL 16

## Structure

```
vetqueue/
├── packages/
│   ├── backend/     # REST API
│   └── frontend/    # Next.js app
```

## Setup

### Prerequisites

- Node.js 20+
- PostgreSQL 16+
- npm

### Backend

```bash
cd packages/backend
cp .env.example .env
# Set DATABASE_URL in .env
npm install
npm run generate
npm run migrate
npm run db:seed
npm run dev
```

Runs on port 3001 by default.

### Frontend

```bash
cd packages/frontend
npm install
# Set NEXT_PUBLIC_API_URL if needed (default: http://localhost:3001)
npm run dev
```

Runs on port 3000 by default.

### Docker

```bash
docker-compose up
```

Starts database, backend, frontend and Dozzle (logs viewer on port 8888).

## Architecture

Simple layered architecture:

- `api/` - Controllers and routes
- `services/` - Business logic
- `repositories/` - Data access (Prisma)

No over-engineering. Keep it simple.

## API

REST API with JWT authentication. Main endpoints:

- `POST /api/auth/login` - Authentication
- `GET /api/queue` - List queue entries
- `POST /api/queue` - Add to queue
- `POST /api/queue/:id/call` - Call patient
- `POST /api/queue/:id/start` - Start appointment
- `POST /api/queue/:id/complete` - Complete appointment
- `GET /api/queue/history` - Appointment history
- `GET /api/reports/*` - Reports endpoints

## Database

Prisma ORM with PostgreSQL. Run migrations:

```bash
cd packages/backend
npm run migrate
```

Seed database:

```bash
npm run db:seed
```

## Display Page

Public display at `/display` shows current queue status. Auto-refreshes every 3 seconds. Designed for TV screens in waiting room.

## Development

Monorepo using npm workspaces. Run from root:

```bash
npm run dev:backend
npm run dev:frontend
```

Build everything:

```bash
npm run build
```

## Testing

CI runs on push to main/master. Tests backend build and frontend build.

## Observability (Simples)

### O que você precisa mesmo:

1. **Dozzle** (Logs) - http://localhost:8888
   - Ver erros em tempo real
   - Filtro por container
   - Procure por: ERROR, 500, crash

2. **Health Check** - http://localhost:3002/health
   - Verifica se app está no ar
   - Configure no Uptime Kuma para alertas

3. **Logs estruturados** com Request ID
   - Todos os logs em JSON
   - Fácil de rastrear problemas

### Opcional (avançado):

- **Grafana/Prometheus/Loki**: Se quiser dashboards (não obrigatório)
- **Sentry**: Se quiser captura de erros (opcional, set `SENTRY_DSN`)
- **Alertmanager**: Se quiser alertas avançados (opcional)

### Versão Simples:

Se não quiser usar Grafana/Prometheus, use `docker-compose.simple.yml`:

```bash
docker-compose -f docker-compose.simple.yml up -d
```

Isso inicia apenas: app, db, dozzle (sem complexidade).

## Notes

- No unit test coverage yet. Focus on integration tests when needed.
- Consultation/vaccination registration exists in codebase but disabled in UI temporarily.
- Priority queue: older entries get higher priority automatically.
- Room check-in: veterinarians must check in to a room before calling patients.

## License

Private project.

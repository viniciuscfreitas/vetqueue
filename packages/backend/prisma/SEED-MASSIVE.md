# Seed Massivo - Simulação de Produção

Script para popular o banco de dados com dados massivos e realistas para simular um ambiente de produção.

## Configuração

O script está configurado para criar:
- **10 veterinários** e **3 recepcionistas**
- **150 tutores** com **1-3 pacientes** cada (total ~300 pacientes)
- **500 entradas de fila** distribuídas nos últimos **90 dias**
- **Consultas** para 70% das entradas completadas do tipo "Consulta"
- **Vacinações** para 30% dos pacientes
- **1000 logs de auditoria**

Você pode ajustar essas configurações editando o objeto `CONFIG` no arquivo `seed-massive.ts`.

## Como Usar

### 1. Certifique-se de que o banco está rodando

```bash
# Se estiver usando Docker Compose
docker-compose up -d db

# Ou configure a variável DATABASE_URL no .env
```

### 2. Execute as migrations (se necessário)

```bash
npm run migrate
```

### 3. Execute o seed massivo

```bash
npm run db:seed:massive
```

⚠️ **Atenção**: Este script vai popular o banco com muitos dados. Se você já tem dados no banco, eles podem ser mesclados (usuários e serviços são criados via `upsert`, mas tutores, pacientes e entradas são criados novos).

## Tempo de Execução

Dependendo da configuração e do hardware, o seed pode levar:
- **2-5 minutos** para a configuração padrão (500 entradas)
- Mais tempo para configurações maiores

O script mostra o progresso durante a execução.

## Estrutura dos Dados Criados

### Usuários
- Veterinários: `vet1`, `vet2`, ..., `vet10` (senha: `senha123`)
- Recepção: `recepcao1`, `recepcao2`, `recepcao3` (senha: `senha123`)

### Dados Financeiros
- 85% das entradas completadas têm dados de pagamento
- Pagamentos distribuídos entre os status: PAID, PARTIAL, PENDING
- Métodos de pagamento variados: Dinheiro, PIX, Cartões, etc.
- Valores entre R$ 50 e R$ 600

### Entradas de Fila
- Distribuídas nos últimos 90 dias
- Status variados: WAITING, CALLED, IN_PROGRESS, COMPLETED, CANCELLED
- Prioridades variadas: EMERGENCY (1), HIGH (2), NORMAL (3)
- Algumas com agendamento prévio (hasScheduledAppointment)

### Consultas e Vacinações
- Consultas ligadas às entradas completadas
- Vacinações históricas dos últimos 2 anos
- Dados realistas de diagnósticos, tratamentos e vacinas

## Personalização

Edite o arquivo `seed-massive.ts` e ajuste o objeto `CONFIG`:

```typescript
const CONFIG = {
  USERS: {
    VETS: 10,        // Número de veterinários
    RECEPCAO: 3,     // Número de recepcionistas
  },
  TUTORS: 150,       // Número de tutores
  PATIENTS_PER_TUTOR: { min: 1, max: 3 },
  QUEUE_ENTRIES: {
    TOTAL: 500,      // Total de entradas
    DAYS_BACK: 90,   // Últimos N dias
  },
  CONSULTATIONS_RATIO: 0.7,  // % de consultas
  VACCINATIONS_RATIO: 0.3,   // % de pacientes com vacina
  AUDIT_LOGS: 1000,  // Número de logs
};
```

## Limpeza (Opcional)

Se quiser limpar o banco antes de popular:

```bash
# Usando Prisma Studio para deletar manualmente
npm run db:studio

# Ou resetar o banco completamente
npx prisma migrate reset
```



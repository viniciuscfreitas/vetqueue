# Como Debugar Incidentes Comuns

Referência rápida para resolver problemas que já apareceram no VetQueue.

## Erro 500 ao chamar próximo paciente

- **Sintoma:** API `/api/queue/next` retorna 500.
- **Log chave:** procurar por `"eventType":"StatusTransition"` ou `"Room"` no logger.
- **Passos:**
  1. Verificar se `assignedVetId` existe nos logs.
  2. Conferir ocupação da sala em `queueService.callNext` (possível sala ocupada).
  3. Se sala inexistente, instruir usuário a refazer check-in.

## Agendamento vira walk-in sem motivo

- **Sintoma:** atendimento marcado desaparece da agenda.
- **Log chave:** `"eventType":"AppointmentConversion"`.
- **Passos:**
  1. Validar `scheduledAt` no payload (UTC vs local).
  2. Checar se diferença para `now` > 15 minutos.
  3. Ajustar tolerância ou orientar recepção a reagendar.

## Pagamento marcado como pendente após finalização

- **Sintoma:** tela mostra `PENDING` mesmo após marcar pago.
- **Log chave:** `"eventType":"QueueEntryUpdateFailed"` com metadados de pagamento.
- **Passos:**
  1. Confirmar se ID do usuário logado foi enviado.
  2. Revisar payload de `updatePayment` (valor string vs number).
  3. Se erro de validação, rodar teste `pnpm --filter backend test queueService.test.ts` para reproduzir.

## Erros no Frontend

- **Sintoma:** tela branca ou mensagem sem stack no Dozzle.
- **Log chave:** buscar `"module":"Frontend"` em `backend` com `message` iniciando por `Client error received`.
- **Passos:**
  1. Conferir payload recebido em `/api/client-logs` (requestId + sessionId ajudam a cruzar com usuário).
  2. Ver stack no campo `stack` e argumentos no `extra.arguments`.
  3. Se flood, ajustar env `CLIENT_LOG_RATE_LIMIT_MAX` ou investigar bug recorrente.

## Check-list pós incidentes

- Anotar causa raiz na seção de post-mortems.
- Adicionar novo caso aqui se incidente se repetir ou for crítico.


# Ciclos de Evolução do VetQueue

## Pós-Mortem Leve

- **Quando:** sempre que houver incidente, rollback ou deploy com susto.
- **Formato rápido:**
  - O que aconteceu?
  - Por quê aconteceu?
  - Como prevenir na próxima?
  - Ações (com responsáveis e prazo).
- Armazenar no arquivo `notes/post-mortems.md` ou ferramenta equivalente.

## Blocos de Estudo

- 2h semanais agendadas (quarta 09h-11h sugerido).
- Rotacionar foco:
  - Semana 1: debugger/observabilidade
  - Semana 2: performance e consultas pesadas
  - Semana 3: automação de testes
  - Semana 4: infraestrutura/deploy
- Registrar links e lições em `notes/learning-log.md`.

## Revisão de Capacidade Mensal

- Check-list mensal (última sexta-feira):
  1. Quantos incidentes críticos? quanto tempo consumiram?
  2. Backlog de manutenção vs features está equilibrado?
  3. Existe gargalo que pede automação ou reforço humano?
  4. Ajustar limites de WIP ou janela de deploy conforme necessidade.
- Se duas revisões consecutivas apontarem sobrecarga, abrir issue para contratar/freelancer ou automatizar tarefa repetitiva.

## Alimentando Runbooks

- Após cada incidente/estudo, atualizar `runbooks/debugging.md` ou outros guias.
- Manter histórico curto (máx. 6 entradas) – arquivar o resto para evitar ruído.

Clava final: aprender rápido, documentar curto e ajustar ritmo antes do burnout.


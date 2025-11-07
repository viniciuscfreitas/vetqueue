# Rotina Grug do VetQueue

Objetivo: proteger blocos de foco para features e manter manutenção sob controle.

## Agenda Recomendada

- **Seg a Sex – manhã (09h-12h):** deep work em features prioritárias.
- **Seg a Sex – 12h-13h:** intervalo obrigatório (almoço + reset).
- **Seg, Qua, Sex – 13h-14h:** manutenção/bugs abertos.
- **Ter, Qui – 13h-15h:** janela de deploy + observabilidade.
- **Sexta – 16h-17h:** revisão de métricas/logs + planejamento da próxima semana.

## Stand-up Solo Diário (5 min)

1. O que quebrou ou mudou em prod ontem?
2. Qual martelo principal de hoje?
3. Existe risco/bloqueio visível?

Registre no diário (`notes/standup.md` ou ferramenta preferida) para histórico rápido.

## Quadro Kanban

Crie um board com colunas:
- `Entrada`
- `Fazendo`
- `Bloqueado`
- `Pronto`

Labels sugeridos:
- `prod-urgente` – incidentes ou regressões
- `feature` – novas capacidades
- `divida` – melhorias e refactors

Limite de WIP: máximo 2 cartões em `Fazendo`.

Template de cartões:
- **Título:** verbo + contexto curto (ex.: "Corrigir timeout fila")
- **Descrição:** meta, validação esperada, links
- **Checklist:** passos mínimos, inclusive testes
- **Campo custom:** SLA (ex.: `Hoje`, `Esta semana`)

## Revisões Semanais

- Segunda 09h: revisar backlog `Entrada` e puxar itens para `Fazendo`.
- Quarta 15h: limpar `Bloqueado`, replanejar se algo travado >24h.
- Sexta 16h: mover entregas para `Pronto`, arquivar concluídos e anotar lições.

## Alertas e Escalonamento

- Cartão com label `prod-urgente` ganha prioridade automática frente a features.
- Se dois incidentes críticos ocorrerem na mesma semana, reservar bloco extra de manutenção na semana seguinte.

Clava final: visualize tudo, limite trabalho simultâneo e mantenha intervalo sagrado.


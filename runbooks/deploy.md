# Deploy Domado do VetQueue

Guia rápido para lançar novas versões sem acordar demônio de produção.

## Fluxo de Branch

- `main` protegida: merge só com PR aprovado e checks verdes.
- Features novas: `feature/<resumo-curto>` (ex.: `feature/fila-prioritaria`).
- Correções urgentes: `hotfix/<bug>` (ex.: `hotfix/api-timeout`).
- Nunca trabalhe direto em `main`.

## Janela de Deploy

- Horário padrão: terça e quinta às 15h (BRT).
- Fora da janela só para `hotfix` crítico com aviso no canal de operações.

## Checklist Pré-Deploy

1. Atualizar `main` local: `git checkout main && git pull`.
2. Rebase branch: `git checkout feature/... && git rebase origin/main`.
3. Rodar testes backend: `pnpm --filter backend test` (ajuste conforme disponível).
4. Rodar lint/format: `pnpm lint`.
5. Conferir diff: `git diff origin/main...HEAD` (foco em migrations, dependências e env).
6. Atualizar changelog/resumo no PR.
7. Confirmar backup recente do banco/config (script ou snapshot manual).
8. Checar variáveis de ambiente novas e aplicar em staging antes.

## Procedimento de Deploy

1. Merge aprovado → `main` atualizado pela CI.
2. Criar tag semântica (ex.: `v1.2.3`): `git tag vX.Y.Z && git push origin vX.Y.Z`.
3. Acessar pipeline de deploy (GitHub Actions/Jenkins) e disparar `deploy-prod` com a tag.
4. Monitorar logs via `pnpm --filter backend log:tail` ou stack escolhida por 15 minutos.
5. Confirmar saúde dos endpoints principais e fila ativa.

## Rollback Manual

1. Identificar tag/commit anterior estável (ex.: `v1.2.2`).
2. Disparar pipeline com variáveis `TARGET_TAG=v1.2.2`.
3. Restaurar backup de banco apenas se houver migração quebrando dados.
4. Anunciar rollback no canal e abrir issue com causa raiz + follow-up.

## Pós-Deploy

- Abrir post-mortem leve se algo incomum ocorreu (mesmo sem downtime).
- Atualizar runbook conforme lições novas.
- Registrar métricas de erro/latência na revisão semanal.

Clava do Grug: deploy pequeno, reversível e sempre observado. Feito isso, dormir melhor.


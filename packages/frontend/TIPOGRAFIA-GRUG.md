# Tipografia - Solução Grug Brain

## Filosofia

Como o [Grug Brain Developer](https://grugbrain.dev/) resolveria isso:

> "complexity _very_, _very_ bad"

**Não fazer**:
- ❌ Não criar componentes tipográficos (over-engineering)
- ❌ Não criar escala tipográfica complexa
- ❌ Não abstrair tudo em "design system"

**Fazer**:
- ✅ Configurar fonte no Tailwind (já feito)
- ✅ Padronizar apenas o que já existe
- ✅ Usar classes Tailwind diretamente
- ✅ Manter Display grande (é display, precisa ser grande)

## Padrão Simples (Verificado em Todos os Componentes)

### Hierarquia de Títulos
- **H1 (Páginas principais)**: `text-2xl font-semibold`
  - ✅ Header logo
  - ✅ Login title
  - ✅ Admin/Users page
  - ✅ Admin/Rooms page

- **H2 (Títulos de seção)**: `text-xl font-semibold`
  - ✅ "Adicionar à Fila"
  - ✅ "Fila Atual"
  - ✅ "Histórico de Atendimentos"
  - ✅ "Relatórios"
  - ✅ RoomSelectModal title

- **H3 (Títulos de card/diálogo)**: `text-lg font-semibold`
  - ✅ QueueCard titles (OK, são cards menores)
  - ✅ AlertDialog titles (OK, contexto diferente)

### Textos
- **Body padrão**: `text-base` (sem weight específico)
- **Body destacado**: `font-medium` ou `font-semibold` conforme contexto
- **Labels**: `text-sm font-medium` ✅ (100% consistente)
- **Estatísticas/Números**: `text-3xl font-bold` (OK para destacar números)

### Display (Contexto Especial)
- ✅ Permite tamanhos grandes (`text-5xl+ font-bold`)
- ✅ É display, precisa ser grande e visível
- ✅ Mantido como está

## Verificação Completa

### ✅ Consistente
- Todos H1 usam `text-2xl font-semibold`
- Todos H2 usam `text-xl font-semibold`
- Todos labels usam `text-sm font-medium`
- Componentes UI já padronizados (button, input, label, etc.)

### ✅ OK (Contexto Diferenciado)
- Display page: tamanhos grandes são necessários
- Estatísticas: `font-bold` para destacar números
- AlertDialog: `text-lg` é apropriado para diálogos
- QueueCard: `text-lg` é apropriado para títulos de cards

### ⚠️ Não Precisou Ajustar
- Componentes UI base (shadcn/ui) - já estão consistentes
- Display page - grande é intencional
- Font-mono no relógio - OK, é relógio

## O que foi feito

1. ✅ Configurado `fontFamily` no Tailwind usando variável CSS
2. ✅ Padronizado Header logo para `font-semibold` (igual CardTitle)
3. ✅ Removido `font-bold` redundante no Login (CardTitle já tem)
4. ✅ Verificado todos os componentes e páginas
5. ✅ Documentado padrão simples

## Resultado

Tipografia consistente com **mínimo de código** e **máxima simplicidade**.

**Status**: ✅ **Tudo verificado e consistente**

Grug happy. Complexity demon trapped.

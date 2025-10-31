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

## Padrão Simples

### Tamanhos (Tailwind padrão - já funciona)
- `text-xs` - Badges, captions
- `text-sm` - Labels, inputs, buttons
- `text-base` - Texto padrão
- `text-lg` - Texto destacado
- `text-xl` - Títulos de seção (H2)
- `text-2xl` - Títulos principais (H1)
- `text-3xl` - Estatísticas
- `text-4xl+` - Display apenas (needs to be big)

### Font Weights (simples)
- `font-normal` (400) - Texto padrão
- `font-medium` (500) - Labels, texto destacado
- `font-semibold` (600) - Títulos principais e seções
- `font-bold` (700) - Display apenas

### Regras Práticas
1. **Títulos principais**: `text-2xl font-semibold`
2. **Títulos de seção**: `text-xl font-semibold`
3. **Labels**: `text-sm font-medium`
4. **Display**: pode ser grande (`text-5xl+ font-bold`), é display mesmo
5. **Resto**: usar `text-base` ou `text-sm` conforme contexto

## O que foi feito

1. ✅ Configurado `fontFamily` no Tailwind usando variável CSS
2. ✅ Padronizado Header logo para `font-semibold` (igual CardTitle)
3. ✅ Mantido Display grande (correto para display)

## O que NÃO fazer (complexity demon)

- Não criar `<Heading1>`, `<Heading2>` - usar classes diretamente
- Não criar escala customizada no Tailwind - usar padrão que já funciona
- Não abstrair em componentes - classes Tailwind são suficientes
- Não criar "design system" completo - 80/20 solution

## Resultado

Tipografia consistente com **mínimo de código** e **máxima simplicidade**.

Grug happy. Complexity demon trapped.


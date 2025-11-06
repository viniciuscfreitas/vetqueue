# Análise de Feedback do Stakeholder

**Data:** 2025-01-XX  
**Fonte:** Stakeholder (Clínica Veterinária)  
**Contexto:** Feedback após uso do sistema por equipe (auxiliares, veterinários, secretárias)

---

## 📋 RESUMO DO FEEDBACK

O stakeholder identificou **5 pontos principais** de melhoria:

1. **Formulário muito completo** - Quer simplificar para preencher rápido
2. **Integração com Excel** - Exportar dados para planilha de controle
3. **Status de localização** - Rastrear onde paciente está (cirurgia, internação)
4. **Tempo de espera** - Mostrar em minutos, não segundos
5. **Conexão TV Smart** - Como fazer funcionar na TV

---

## 🔍 ANÁLISE DETALHADA

### 1. FORMULÁRIO SIMPLIFICADO ⚠️ **PRIORIDADE ALTA**

**Problema Identificado:**
- Formulário atual tem muitos campos (nome completo, idade, ficha completa)
- Preencher duas vezes (sistema + SimplesVet) é trabalhoso
- Quer preencher rápido para adicionar à fila

**Soluções Propostas pelo Stakeholder:**

**Opção A:** Apenas campos essenciais
- Nome do paciente
- Nome e sobrenome do tutor
- (Remover: idade, ficha completa, outros campos)

**Opção B:** Campos mínimos + número da ficha
- Nome do paciente (ao lado do número da ficha)
- Nome e sobrenome do tutor
- Número da ficha (para não ter erro)

**Análise Técnica:**
- ✅ Campos atuais: `patientName`, `tutorName`, `serviceType`, `priority`
- ⚠️ **Pergunta:** O que é "número da ficha"? É o `patientId` ou um campo novo?
- ⚠️ **Pergunta:** Campos opcionais devem ser removidos ou apenas ocultos?

**Recomendação:**
- Criar **modo rápido** no formulário
- Campos obrigatórios: Nome paciente, Nome tutor, Serviço
- Campos opcionais: Prioridade, Veterinário, Hora marcada
- Permitir preencher completo depois (editar entrada)

---

### 2. INTEGRAÇÃO COM EXCEL ⚠️ **PRIORIDADE MÉDIA-ALTA**

**Requisitos:**
- Exportar dados automaticamente para planilha Excel
- Planilha serve como controle de chegada E controle financeiro
- Campos necessários:
  - Horário de entrada (automático)
  - Horário de saída (automático)
  - Nome do tutor
  - Nome do paciente
  - Status: "Novo", "Sala X", etc.
  - Forma de pagamento: Crédito, Débito, Dinheiro, PIX (preencher manualmente)

**Análise Técnica:**
- ⚠️ **Pergunta:** Integração automática ou exportação manual?
- ⚠️ **Pergunta:** Formato do Excel (estrutura exata)?
- ⚠️ **Pergunta:** Onde fica a planilha? (OneDrive, Google Sheets, local?)
- ⚠️ **Pergunta:** Frequência de atualização? (tempo real, diário, manual?)

**Opções de Implementação:**

**Opção 1: Exportação Manual (Simples)**
- Botão "Exportar para Excel"
- Gera arquivo .xlsx com dados do dia/período
- Usuário baixa e abre no Excel
- ✅ Simples, sem dependências externas
- ❌ Não é automático

**Opção 2: Integração Google Sheets (Médio)**
- API do Google Sheets
- Atualização automática
- ✅ Automático, acessível de qualquer lugar
- ⚠️ Requer autenticação Google

**Opção 3: Integração OneDrive/SharePoint (Médio-Alto)**
- API Microsoft Graph
- Atualização automática
- ✅ Automático, integra com Office
- ⚠️ Requer autenticação Microsoft

**Opção 4: Webhook/API (Alto)**
- Endpoint para receber dados
- Integração com sistema externo
- ✅ Flexível
- ⚠️ Requer desenvolvimento externo

**Recomendação Inicial:**
- Começar com **Opção 1** (exportação manual)
- Adicionar botão "Exportar para Excel" na aba Relatórios
- Formato: CSV ou XLSX com colunas padronizadas
- Depois avaliar necessidade de automação

---

### 3. STATUS DE LOCALIZAÇÃO ⚠️ **PRIORIDADE MÉDIA**

**Requisitos:**
- Rastrear onde paciente está fisicamente
- Exemplo: Sala 11 (cirurgia/internação)
- Mostrar na tela:
  - Número da ficha
  - Nome do paciente
  - Status atual: "Em cirurgia", "Em internação", "Sala X"
- Atualizar quando paciente muda de local

**Análise Técnica:**
- ✅ Sistema já tem `roomId` e `room` na QueueEntry
- ⚠️ **Pergunta:** Status é diferente de "sala"? (cirurgia ≠ sala normal?)
- ⚠️ **Pergunta:** Quem atualiza o status? (veterinário, auxiliar?)
- ⚠️ **Pergunta:** Status é por entrada da fila ou por paciente?

**Campos Atuais:**
- `roomId` - Sala onde paciente está
- `status` - Status da fila (WAITING, CALLED, IN_PROGRESS, etc.)

**O que falta:**
- Status de localização física (cirurgia, internação, sala normal)
- Histórico de mudanças de local

**Recomendação:**
- Adicionar campo `locationStatus` na QueueEntry
- Valores: "Sala", "Cirurgia", "Internação", "Exame", etc.
- Permitir atualizar status na tela de fila
- Mostrar na tela de display

---

### 4. TEMPO DE ESPERA EM MINUTOS ⚠️ **PRIORIDADE BAIXA (Quick Fix)**

**Problema:**
- Atualmente mostra em segundos (60s, 59s, 58s...)
- Confuso para usuários
- Na TV deve mostrar "2 minutos", "3 minutos", etc.

**Análise Técnica:**
- ✅ Função `getWaitMinutes()` já existe e retorna minutos
- ✅ Função `formatDuration()` já formata corretamente
- ⚠️ **Problema:** `formatDuration()` mostra "Xm Ys" quando < 1 hora
- Na tela de display, linha 482 já mostra `{waitMinutes} min`

**Código Atual:**
```typescript
// display/page.tsx linha 482
Aguardando: {waitMinutes} min  // ✅ Já está correto!

// utils.ts - formatDuration
if (minutes > 0) {
  return `${minutes}m ${seconds}s  // Mostra segundos também
}
```

**Solução:**
- Na tela de display, já está correto (mostra minutos)
- Em outros lugares (QueueCard), pode estar mostrando segundos
- Ajustar `formatDuration()` para não mostrar segundos quando > 1 minuto
- Ou criar função específica `formatWaitTime()` que só mostra minutos

**Recomendação:**
- Quick fix: Ajustar formatação para mostrar apenas minutos quando > 1 minuto
- Exemplo: "2 min" ao invés de "2m 30s"

---

### 5. CONEXÃO TV SMART ⚠️ **PRIORIDADE BAIXA (Suporte)**

**Pergunta do Stakeholder:**
- Como conectar na TV Smart?
- Precisa usar celular?
- Como acessar o app na TV?

**Análise:**
- TV Smart = Smart TV com navegador
- Página de display já existe: `/display`
- Acesso: Abrir navegador na TV e acessar URL

**Soluções:**

**Opção 1: Navegador da TV (Mais Simples)**
- Abrir navegador na TV Smart
- Digitar URL do sistema (ex: `http://ip-do-servidor:3000/display`)
- ✅ Funciona em qualquer Smart TV
- ❌ Precisa digitar URL (pode ser complicado)

**Opção 2: QR Code (Recomendado)**
- Gerar QR Code com URL da página de display
- Escanear com celular
- Abrir no navegador da TV
- ✅ Mais fácil que digitar
- ⚠️ Requer celular

**Opção 3: App Dedicado (Futuro)**
- App Android TV / Fire TV
- ✅ Experiência melhor
- ❌ Desenvolvimento adicional

**Recomendação:**
- Criar página de instruções simples
- Gerar QR Code na página de display
- Instruções: "Escaneie QR Code com celular e abra no navegador da TV"

---

## ❓ PERGUNTAS PARA STAKEHOLDER

### Sobre Formulário Simplificado:

1. **Número da ficha:**
   - O que é exatamente o "número da ficha"?
   - É o ID do paciente no SimplesVet?
   - É um número sequencial gerado pelo sistema?
   - Onde deve aparecer? (ao lado do nome do paciente?)

2. **Campos opcionais:**
   - Devem ser removidos completamente ou apenas ocultos?
   - Deve ter opção de "modo completo" para casos especiais?
   - Prioridade e veterinário devem ficar opcionais?

3. **Nome do tutor:**
   - Apenas "Nome Sobrenome" ou pode ter mais campos?
   - Como garantir que é o mesmo tutor do SimplesVet?

### Sobre Integração Excel:

4. **Formato da planilha:**
   - Pode compartilhar exemplo da planilha atual?
   - Quais são as colunas exatas?
   - Há formatação especial (cores, fórmulas)?

5. **Frequência:**
   - Exportação manual é suficiente?
   - Ou precisa ser automática (tempo real)?
   - Com que frequência atualiza? (a cada entrada, diário?)

6. **Localização:**
   - Onde fica a planilha? (computador local, OneDrive, Google Drive?)
   - Quem acessa? (apenas você ou equipe toda?)

7. **Forma de pagamento:**
   - Deve ser preenchida no sistema ou só no Excel?
   - Se for no sistema, onde aparece? (ao finalizar atendimento?)

### Sobre Status de Localização:

8. **Status vs Sala:**
   - "Cirurgia" e "Internação" são diferentes de "Sala 11"?
   - Ou "Sala 11" pode ter status "Cirurgia" ou "Internação"?

9. **Quem atualiza:**
   - Quem muda o status? (veterinário, auxiliar, recepcionista?)
   - Quando atualiza? (ao chamar, ao iniciar atendimento, manualmente?)

10. **Onde aparece:**
    - Deve aparecer na tela de display?
    - Na tela de fila também?
    - No Excel exportado?

### Sobre Tempo de Espera:

11. **Formato:**
    - "2 minutos" está OK?
    - Ou prefere "2 min"?
    - Para tempos < 1 minuto, mostrar segundos ou "menos de 1 min"?

---

## 🎯 PLANO DE AÇÃO SUGERIDO

### Fase 1 - Quick Wins (1-2 dias)
1. ✅ Ajustar formatação de tempo de espera (minutos apenas)
2. ✅ Criar modo rápido no formulário (campos mínimos)
3. ✅ Adicionar instruções para TV Smart (QR Code)

### Fase 2 - Melhorias Médias (3-5 dias)
4. ✅ Exportação manual para Excel (botão + formato CSV/XLSX)
5. ✅ Adicionar campo "Número da ficha" (se necessário)
6. ✅ Adicionar status de localização (cirurgia, internação, etc.)

### Fase 3 - Melhorias Avançadas (1-2 semanas)
7. ⚠️ Integração automática com Excel (se necessário)
8. ⚠️ Histórico de mudanças de localização
9. ⚠️ Sincronização com SimplesVet (se viável)

---

## 📊 IMPACTO ESTIMADO

**Redução de Fricção:**
- Formulário simplificado: **-50% tempo de preenchimento**
- Exportação Excel: **-80% trabalho manual**
- Status localização: **+100% visibilidade** (novo recurso)
- Tempo em minutos: **+50% clareza** (quick fix)

**Priorização:**
1. ⭐⭐⭐⭐⭐ Formulário simplificado
2. ⭐⭐⭐⭐ Exportação Excel
3. ⭐⭐⭐ Status localização
4. ⭐⭐ Tempo em minutos
5. ⭐ Instruções TV

---

## 🔧 PRÓXIMOS PASSOS

1. **Responder perguntas do stakeholder** (este documento)
2. **Aguardar clarificações** sobre:
   - Número da ficha
   - Formato Excel
   - Status de localização
3. **Implementar Fase 1** (quick wins)
4. **Validar com stakeholder** antes de Fase 2

---

**Status:** ⏳ Aguardando clarificações do stakeholder


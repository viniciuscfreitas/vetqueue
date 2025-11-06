# Perguntas para Stakeholder - Clarificações Necessárias

**Contexto:** Análise do feedback sobre melhorias no sistema VetQueue

---

## 🔴 PERGUNTAS PRIORITÁRIAS

### 1. Formulário Simplificado

**Pergunta 1.1:** O que é o "número da ficha"?
- É o ID do paciente no SimplesVet?
- É um número sequencial gerado pelo sistema?
- Onde deve aparecer? (ao lado do nome do paciente?)

**Pergunta 1.2:** Campos opcionais devem ser:
- [ ] Removidos completamente
- [ ] Ocultos por padrão (com opção "modo completo")
- [ ] Mantidos como estão

**Pergunta 1.3:** Para o modo rápido, quais campos são OBRIGATÓRIOS?
- [ ] Nome do paciente
- [ ] Nome e sobrenome do tutor
- [ ] Serviço
- [ ] Prioridade
- [ ] Outro: _______________

---

### 2. Integração com Excel

**Pergunta 2.1:** Pode compartilhar um exemplo da planilha atual?
- (Foto ou arquivo Excel)
- Quais são as colunas exatas?

**Pergunta 2.2:** A exportação pode ser manual (botão "Exportar") ou precisa ser automática?
- [ ] Manual (botão para baixar Excel)
- [ ] Automática (atualiza sozinho)

**Pergunta 2.3:** Onde fica a planilha?
- [ ] Computador local
- [ ] OneDrive
- [ ] Google Drive
- [ ] Outro: _______________

**Pergunta 2.4:** Forma de pagamento deve ser preenchida:
- [ ] No sistema VetQueue (ao finalizar atendimento)
- [ ] Apenas no Excel (manual)
- [ ] Ambos

---

### 3. Status de Localização

**Pergunta 3.1:** "Cirurgia" e "Internação" são:
- [ ] Status diferentes de "Sala 11" (ex: Sala 11 pode ter status "Cirurgia")
- [ ] Locais diferentes (ex: Sala Cirurgia ≠ Sala 11)

**Pergunta 3.2:** Quem atualiza o status de localização?
- [ ] Veterinário
- [ ] Auxiliar
- [ ] Recepcionista
- [ ] Todos podem

**Pergunta 3.3:** Quando o status é atualizado?
- [ ] Ao chamar paciente
- [ ] Ao iniciar atendimento
- [ ] Manualmente (botão)
- [ ] Automaticamente (baseado em sala)

---

### 4. Tempo de Espera

**Pergunta 4.1:** Formato preferido:
- [ ] "2 minutos"
- [ ] "2 min"
- [ ] "2m"

**Pergunta 4.2:** Para tempos < 1 minuto:
- [ ] Mostrar segundos (ex: "45s")
- [ ] Mostrar "menos de 1 min"
- [ ] Mostrar "0 min"

---

## 🟡 PERGUNTAS SECUNDÁRIAS

### 5. TV Smart

**Pergunta 5.1:** A TV tem navegador (Chrome, Safari, etc.)?
- [ ] Sim
- [ ] Não sei
- [ ] Não

**Pergunta 5.2:** Prefere:
- [ ] Instruções simples (abrir navegador e digitar URL)
- [ ] QR Code para escanear
- [ ] App dedicado (desenvolvimento futuro)

---

## 📋 CHECKLIST DE RESPOSTAS

- [ ] Pergunta 1.1 - Número da ficha
- [ ] Pergunta 1.2 - Campos opcionais
- [ ] Pergunta 1.3 - Campos obrigatórios
- [ ] Pergunta 2.1 - Exemplo planilha
- [ ] Pergunta 2.2 - Manual vs Automático
- [ ] Pergunta 2.3 - Localização planilha
- [ ] Pergunta 2.4 - Forma de pagamento
- [ ] Pergunta 3.1 - Status vs Local
- [ ] Pergunta 3.2 - Quem atualiza
- [ ] Pergunta 3.3 - Quando atualiza
- [ ] Pergunta 4.1 - Formato tempo
- [ ] Pergunta 4.2 - Tempo < 1 min
- [ ] Pergunta 5.1 - Navegador TV
- [ ] Pergunta 5.2 - Preferência acesso

---

**Próximo passo:** Após respostas, implementar melhorias priorizadas.


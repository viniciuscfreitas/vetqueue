# ✅ Checklist de Testes E2E - VetQueue

## 🎯 Objetivo
Validar a integração completa entre frontend e backend através de testes end-to-end manuais.

---

## 🚀 Pré-Teste: Setup do Ambiente

### [ ] 1. Iniciar os Servidores

**Opção A - Script Automatizado:**
```bash
.\start-vetqueue.bat
```

**Opção B - Manual:**

Terminal 1 - Backend:
```bash
cd backend
python run.py
```

Terminal 2 - Frontend:
```bash
cd frontend
npm run dev
```

### [ ] 2. Verificar Saúde dos Servidores

- [ ] Backend respondendo em `http://localhost:8000`
- [ ] Frontend respondendo em `http://localhost:5173`
- [ ] Documentação da API acessível em `http://localhost:8000/docs`

**Como verificar:**
- Abrir `http://localhost:8000/docs` → Deve mostrar Swagger UI
- Abrir `http://localhost:5173` → Deve carregar a tela de login

---

## 🧪 Testes Funcionais

### Teste 1: Autenticação

#### [ ] 1.1 - Login Bem-Sucedido
1. Acesse `http://localhost:5173`
2. Preencha:
   - **Usuário:** `admin`
   - **Senha:** `1234`
3. Clique em "Entrar"

**✅ Resultado Esperado:**
- Redirecionamento para `/painel-controle`
- Exibição do Painel de Controle
- Nome "Dr. Ricardo" visível no header (se aplicável)

#### [ ] 1.2 - Login com Credenciais Inválidas
1. Na tela de login, preencha:
   - **Usuário:** `admin`
   - **Senha:** `senhaerrada`
2. Clique em "Entrar"

**✅ Resultado Esperado:**
- Permanece na tela de login
- Toast de erro: "Usuário ou senha inválidos"
- Campos não são limpos

---

### Teste 2: Adicionar Paciente à Fila

#### [ ] 2.1 - Adicionar Paciente com Sucesso
1. No Painel de Controle, clique em "Adicionar Paciente"
2. Preencha o formulário:
   - **Nome do Pet:** `Bolinha`
   - **Nome do Tutor:** `Maria Silva`
3. Clique em "Adicionar"

**✅ Resultado Esperado:**
- Toast de sucesso: "Paciente adicionado"
- Paciente aparece na lista "Aguardando Atendimento"
- Card mostra:
  - Nome: Bolinha
  - Tutor: Maria Silva
  - Badge: "Aguardando" (laranja)
- Formulário é limpo
- Modal fecha automaticamente

#### [ ] 2.2 - Validação de Campos Obrigatórios
1. Clique em "Adicionar Paciente"
2. Deixe ambos os campos vazios
3. Tente clicar em "Adicionar"

**✅ Resultado Esperado:**
- Formulário não é enviado
- Validação HTML5 destaca campos vazios

#### [ ] 2.3 - Adicionar Múltiplos Pacientes
1. Adicione mais 3 pacientes:
   - `Rex` / `João Silva`
   - `Mimi` / `Ana Pereira`
   - `Thor` / `Carlos Lima`

**✅ Resultado Esperado:**
- 4 pacientes na lista "Aguardando Atendimento"
- Ordem cronológica (último adicionado por último)

---

### Teste 3: Chamar Paciente para Atendimento

#### [ ] 3.1 - Chamar Paciente com Sucesso
1. Na lista "Aguardando Atendimento", clique no botão "Chamar" do paciente "Bolinha"
2. No modal, digite a sala: `Consultório 1`
3. Confirme

**✅ Resultado Esperado:**
- Toast de sucesso: "Paciente chamado para atendimento"
- Bolinha **desaparece** da lista "Aguardando"
- Bolinha **aparece** na lista "Em Atendimento"
- Card mostra:
  - Badge: "Em Atendimento" (verde)
  - Sala: "Consultório 1"

#### [ ] 3.2 - Chamar Outro Paciente (Sala Diferente)
1. Chame "Rex" para o `Consultório 2`

**✅ Resultado Esperado:**
- 2 pacientes em atendimento
- Cada um com sua sala correspondente
- 2 pacientes ainda aguardando

#### [ ] 3.3 - Validação de Sala Vazia
1. Tente chamar "Mimi"
2. Deixe o campo "Sala" vazio
3. Tente confirmar

**✅ Resultado Esperado:**
- Formulário não é enviado
- Validação destaca campo vazio

---

### Teste 4: Finalizar Atendimento

#### [ ] 4.1 - Finalizar com Sucesso
1. Na lista "Em Atendimento", clique em "Finalizar Atendimento" para Bolinha
2. Confirme a ação

**✅ Resultado Esperado:**
- Toast de sucesso: "Atendimento finalizado"
- Bolinha **desaparece** completamente da fila
- Não aparece em "Aguardando" nem em "Em Atendimento"

#### [ ] 4.2 - Finalizar Outro Paciente
1. Finalize o atendimento de "Rex"

**✅ Resultado Esperado:**
- Rex também removido
- Apenas Mimi e Thor permanecem na fila (aguardando)

---

### Teste 5: Painel de Exibição (TV)

#### [ ] 5.1 - Visualização Pública
1. Abra uma **nova aba** do navegador (sem estar logado)
2. Acesse `http://localhost:5173`
3. Na tela de login, observe se há link para "Painel de Exibição"
4. Acesse o Painel de Exibição

**✅ Resultado Esperado:**
- Painel de Exibição é exibido sem necessidade de login
- Mostra listas de "Aguardando" e "Em Atendimento"

#### [ ] 5.2 - Sincronização em Tempo Real
1. Mantenha o Painel de Exibição aberto em uma aba
2. Em outra aba (logado no Painel de Controle):
   - Chame "Mimi" para "Consultório 3"
3. Aguarde até 5 segundos

**✅ Resultado Esperado:**
- Painel de Exibição atualiza automaticamente
- Mimi aparece em "Em Atendimento"
- Seção "Últimas Chamadas" mostra:
  - Mimi
  - Sala: Consultório 3
  - Timestamp recente

#### [ ] 5.3 - Última Chamada Destacada
1. No Painel de Controle, chame "Thor" para "Consultório 4"
2. Observe o Painel de Exibição

**✅ Resultado Esperado:**
- Thor aparece no topo de "Últimas Chamadas"
- Card destacado visualmente (animação ou cor diferente)

---

### Teste 6: Fluxo Completo (Jornada do Paciente)

#### [ ] 6.1 - Ciclo de Vida Completo
1. Adicione um novo paciente: `Luna` / `Pedro Costa`
2. Verifique que Luna está "Aguardando"
3. Chame Luna para "Consultório 5"
4. Verifique que Luna está "Em Atendimento" com sala correta
5. Finalize o atendimento de Luna
6. Verifique que Luna foi removida completamente

**✅ Resultado Esperado:**
- Ciclo completo executado sem erros
- Todas as transições ocorreram corretamente
- UI sempre consistente

---

### Teste 7: Tratamento de Erros

#### [ ] 7.1 - Backend Offline
1. **Pare o servidor backend** (Ctrl+C no terminal)
2. No frontend, tente adicionar um paciente

**✅ Resultado Esperado:**
- Toast de erro: "Erro ao comunicar com o servidor" ou similar
- Aplicação não trava
- Após alguns segundos, pode tentar novamente

#### [ ] 7.2 - Backend Volta Online
1. **Reinicie o servidor backend**
2. Aguarde alguns segundos
3. Tente adicionar um paciente novamente

**✅ Resultado Esperado:**
- Operação funciona normalmente
- Sistema se recupera automaticamente

---

### Teste 8: Consistência de Dados

#### [ ] 8.1 - Atualização Manual da Página
1. Com pacientes na fila, pressione F5 para atualizar a página
2. Faça login novamente se necessário

**✅ Resultado Esperado:**
- **Fila está vazia** (dados em memória foram resetados)
- Isso é esperado no MVP com repositório in-memory

#### [ ] 8.2 - Múltiplas Abas (Painel de Controle)
1. Abra o Painel de Controle em 2 abas diferentes (logado)
2. Na aba 1, adicione um paciente
3. Na aba 2, observe se o paciente aparece (aguarde até 5s)

**✅ Resultado Esperado:**
- Aba 2 atualiza automaticamente via polling
- Ambas as abas mostram os mesmos dados

---

## 🔍 Testes de Validação (Edge Cases)

### [ ] 9.1 - Nome com Caracteres Especiais
- Adicione paciente: `José` / `María Gutiérrez`
- **✅ Esperado:** Aceita e exibe corretamente

### [ ] 9.2 - Nome Muito Longo
- Adicione paciente com nome de 100 caracteres
- **✅ Esperado:** Aceita ou trunca visualmente

### [ ] 9.3 - Sala com Caracteres Especiais
- Chame paciente para `Sala Nº 1 - Cirurgia`
- **✅ Esperado:** Aceita e exibe corretamente

---

## 📊 Checklist Final

Após completar todos os testes:

- [ ] Todos os testes passaram
- [ ] Nenhum erro no console do browser (F12)
- [ ] Nenhum erro no console do backend
- [ ] UI responsiva e fluida
- [ ] Toasts de feedback apropriados
- [ ] Sincronização entre painéis funcionando

---

## 🐛 Registro de Bugs

Se encontrar algum problema, registre aqui:

| # | Teste | Descrição do Bug | Severidade | Status |
|---|-------|------------------|------------|--------|
| 1 |       |                  |            |        |
| 2 |       |                  |            |        |
| 3 |       |                  |            |        |

**Severidade:**
- 🔴 Crítico: Sistema não funciona
- 🟡 Alto: Feature principal quebrada
- 🟢 Médio: Feature secundária com problema
- 🔵 Baixo: Cosmético ou edge case raro

---

## ✅ Aprovação Final

**Data do Teste:** ___/___/_____  
**Testador:** _________________  
**Status:** [ ] ✅ Aprovado  [ ] ❌ Reprovado  [ ] ⚠️ Com Ressalvas

**Observações:**
```
[Espaço para comentários adicionais]
```

---

**🎯 VetQueue - Checklist de Validação E2E**


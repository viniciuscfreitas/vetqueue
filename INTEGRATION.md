# 🔗 VetQueue - Guia de Integração Frontend-Backend

## Status da Integração: ✅ COMPLETO

O VetQueue agora está com frontend e backend integrados e prontos para execução E2E.

---

## 🏗️ Arquitetura do Sistema

```
┌─────────────────────────────────────────────────────────┐
│                    FRONTEND (React)                      │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐  │
│  │  UI Layer    │  │  State Mgmt  │  │  API Client  │  │
│  │  (Pages)     │→│  (TanStack)  │→│  (axios)     │──┼─┐
│  └──────────────┘  └──────────────┘  └──────────────┘  │ │
└─────────────────────────────────────────────────────────┘ │
                                                             │
                         HTTP/REST (JSON)                    │
                         localhost:8000                      │
                                                             │
┌────────────────────────────────────────────────────────┐  │
│                  BACKEND (FastAPI)                      │ ←┘
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐ │
│  │ API Layer    │→│ Use Cases    │→│  Domain      │ │
│  │ (Routes)     │  │ (Application)│  │  (Entities)  │ │
│  └──────────────┘  └──────────────┘  └──────────────┘ │
│         ↓                                       ↑        │
│  ┌──────────────────────────────────────────────┘       │
│  │         Repository (In-Memory)                       │
│  └──────────────────────────────────────────────────────│
└────────────────────────────────────────────────────────┘
```

---

## 🚀 Como Executar o Sistema Completo

### Pré-requisitos

- **Node.js** 16+ (para o frontend)
- **Python** 3.11+ (para o backend)
- **Dependências instaladas** em ambos os projetos

### Passo 1: Iniciar o Backend (Terminal 1)

```bash
cd backend
python run.py
```

**Saída esperada:**
```
🚀 Iniciando VetQueue Backend...
📚 Documentação: http://localhost:8000/docs
🔄 Auto-reload ativado (modo desenvolvimento)

INFO:     Started server process [xxxxx]
INFO:     Waiting for application startup.
🚀 VetQueue API iniciada com sucesso!
📚 Documentação disponível em: http://localhost:8000/docs
INFO:     Application startup complete.
INFO:     Uvicorn running on http://0.0.0.0:8000
```

### Passo 2: Iniciar o Frontend (Terminal 2)

```bash
cd frontend
npm run dev
```

**Saída esperada:**
```
VITE v5.x.x  ready in xxx ms

➜  Local:   http://localhost:5173/
➜  Network: use --host to expose
```

### Passo 3: Acessar a Aplicação

Abra o navegador em **http://localhost:5173**

---

## 🧪 Roteiro de Teste E2E

### Teste 1: Autenticação
1. Acesse http://localhost:5173
2. Faça login com:
   - **Usuário:** `admin`
   - **Senha:** `1234`
3. ✅ Deve redirecionar para o Painel de Controle

### Teste 2: Adicionar Paciente
1. No Painel de Controle, clique em "Adicionar Paciente"
2. Preencha:
   - **Nome do Pet:** `Bolinha`
   - **Nome do Tutor:** `Maria Silva`
3. Clique em "Adicionar"
4. ✅ O paciente deve aparecer na lista "Aguardando Atendimento"

### Teste 3: Chamar para Atendimento
1. Na lista "Aguardando", clique no botão "Chamar" do paciente Bolinha
2. Digite a sala: `Consultório 1`
3. Confirme
4. ✅ O paciente deve mover-se para "Em Atendimento"
5. ✅ A sala "Consultório 1" deve aparecer no card

### Teste 4: Finalizar Atendimento
1. Na lista "Em Atendimento", clique em "Finalizar Atendimento"
2. Confirme a ação
3. ✅ O paciente deve ser removido da fila completamente

### Teste 5: Painel de Exibição (Sincronização)
1. Abra uma nova aba do navegador
2. Acesse: http://localhost:5173 (sem fazer login)
3. Navegue até o Painel de Exibição (TV)
4. Em outra aba (logado), adicione um paciente e chame para atendimento
5. ✅ O Painel de Exibição deve atualizar automaticamente (polling de 5s)
6. ✅ A última chamada deve aparecer com destaque

### Teste 6: Múltiplos Pacientes
1. Adicione 3 pacientes diferentes:
   - `Rex` / `João Silva`
   - `Mimi` / `Ana Pereira`
   - `Thor` / `Carlos Lima`
2. Chame 2 deles para atendimento em salas diferentes
3. Finalize o atendimento de 1
4. ✅ A fila deve sempre estar consistente
5. ✅ As contagens devem estar corretas

---

## 🔍 Verificação de Integração

### Checklist de Validação

- [ ] **Backend rodando** em http://localhost:8000
- [ ] **Frontend rodando** em http://localhost:5173
- [ ] **Documentação da API** acessível em http://localhost:8000/docs
- [ ] **Login funcional** (admin/1234)
- [ ] **CRUD de pacientes** funcionando
- [ ] **Transições de estado** (Aguardando → Em Atendimento → Finalizado)
- [ ] **Sincronização** entre Painel de Controle e Painel de Exibição
- [ ] **Tratamento de erros** (mensagens de toast apropriadas)
- [ ] **Validações** (campos obrigatórios, sala vazia, etc.)

---

## 🛠️ Debugging

### Backend não responde

```bash
# Verificar se a porta 8000 está ocupada
netstat -ano | findstr :8000

# Testar o health check manualmente
curl http://localhost:8000/
# ou
Invoke-WebRequest http://localhost:8000/ | ConvertFrom-Json
```

### Erro de CORS

Se aparecer erro de CORS no console do browser:
- Verifique se o backend está configurado para aceitar `http://localhost:5173`
- Veja `backend/main.py` na configuração de `CORSMiddleware`

### Frontend não conecta

1. Abra o DevTools (F12) → Network
2. Tente fazer login ou adicionar paciente
3. Verifique se as requisições estão sendo feitas para `http://localhost:8000`
4. Veja os erros específicos no console

### Dados não aparecem

1. Verifique o console do backend para erros
2. Teste os endpoints diretamente no Swagger: http://localhost:8000/docs
3. Verifique a resposta das APIs no Network do DevTools

---

## 📊 Endpoints da API

| Método | Endpoint | Descrição |
|--------|----------|-----------|
| `GET` | `/` | Health check |
| `POST` | `/auth/login` | Login (admin/1234) |
| `GET` | `/fila` | Estado completo da fila |
| `POST` | `/pacientes` | Adicionar paciente |
| `PUT` | `/pacientes/{id}/chamar` | Chamar para atendimento |
| `DELETE` | `/pacientes/{id}` | Finalizar atendimento |

---

## 🎯 Próximos Passos

### Fase 2: Melhorias
- [ ] WebSockets para sync em tempo real
- [ ] PostgreSQL para persistência real
- [ ] JWT authentication com refresh tokens
- [ ] Docker Compose para orquestração
- [ ] CI/CD pipeline

### Fase 3: Features Avançadas
- [ ] Histórico de atendimentos
- [ ] Relatórios e analytics
- [ ] Notificações push
- [ ] Multi-tenancy (múltiplas clínicas)
- [ ] App mobile nativo

---

## 🏆 Status: Sistema Operacional

✅ **Frontend:** Pronto e polido  
✅ **Backend:** Arquitetura hexagonal implementada  
✅ **Integração:** API REST funcional  
✅ **Testes:** 47 testes passando (backend)  

**O VetQueue está vivo e operacional!** 🚀

---

*Documentação gerada durante a Fase 1 de integração*


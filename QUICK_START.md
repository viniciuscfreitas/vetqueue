# ⚡ VetQueue - Quick Start Guide

## 🚀 Executar o Sistema (30 segundos)

### Opção 1: Um Clique (Recomendado)

```bash
# Windows
.\start-vetqueue.bat

# O script abrirá automaticamente:
# - Janela 1: Backend (FastAPI)
# - Janela 2: Frontend (Vite)
# - Navegador: http://localhost:5173
```

### Opção 2: Manual (2 Terminais)

**Terminal 1 - Backend:**
```bash
cd backend
python run.py
```

**Terminal 2 - Frontend:**
```bash
cd frontend
npm run dev
```

**Navegador:**
```
http://localhost:5173
```

---

## 🔑 Credenciais de Acesso

**Login:**
- Usuário: `admin`
- Senha: `1234`

---

## 🌐 URLs Importantes

| Serviço | URL | Descrição |
|---------|-----|-----------|
| **Frontend** | http://localhost:5173 | Aplicação web completa |
| **Backend API** | http://localhost:8000 | API REST |
| **API Docs (Swagger)** | http://localhost:8000/docs | Documentação interativa |
| **API Docs (ReDoc)** | http://localhost:8000/redoc | Documentação alternativa |
| **Health Check** | http://localhost:8000/ | Status da API |

---

## ✅ Teste Rápido (2 minutos)

### 1. Login
- Acesse http://localhost:5173
- Login: `admin` / `1234`

### 2. Adicionar Paciente
- Clique em "Adicionar Paciente"
- Nome Pet: `Bolinha`
- Nome Tutor: `Maria Silva`
- Clique em "Adicionar"

### 3. Chamar para Atendimento
- Na lista "Aguardando", clique "Chamar"
- Sala: `Consultório 1`
- Confirme

### 4. Verificar
- ✅ Paciente deve estar em "Em Atendimento"
- ✅ Sala "Consultório 1" deve aparecer

### 5. Finalizar
- Clique "Finalizar Atendimento"
- Confirme
- ✅ Paciente removido da fila

---

## 🎯 Próximos Passos

Depois do teste rápido:

1. **Teste Completo E2E:** Veja [E2E_TEST_CHECKLIST.md](./E2E_TEST_CHECKLIST.md)
2. **Entenda a Integração:** Leia [INTEGRATION.md](./INTEGRATION.md)
3. **Explore a API:** Acesse http://localhost:8000/docs
4. **Customize:** Edite `frontend/.env` para mudar configurações

---

## 🛠️ Troubleshooting Rápido

### Backend não inicia

```bash
# Instalar dependências
cd backend
pip install -r requirements.txt
```

### Frontend não inicia

```bash
# Instalar dependências
cd frontend
npm install
```

### Porta 8000 ocupada

```bash
# Verificar processo
netstat -ano | findstr :8000

# Matar processo (substitua <PID>)
taskkill /PID <PID> /F
```

### Porta 5173 ocupada

```bash
# Vite usará automaticamente a próxima porta livre
# Será exibido no terminal qual porta foi usada
```

---

## 📚 Documentação Completa

- **[README.md](./README.md)** - Overview completo do projeto
- **[INTEGRATION.md](./INTEGRATION.md)** - Guia de integração detalhado
- **[INTEGRATION_REPORT.md](./INTEGRATION_REPORT.md)** - Relatório técnico da integração
- **[E2E_TEST_CHECKLIST.md](./E2E_TEST_CHECKLIST.md)** - Checklist completo de testes
- **[backend/README.md](./backend/README.md)** - Documentação do backend

---

## 🎓 Arquitetura em 30 Segundos

```
Frontend (React)  →  HTTP REST  →  Backend (FastAPI)
                                         ↓
                                    Domain Logic
                                         ↓
                                 In-Memory Repository
```

**Por que isso é especial:**
- ✅ Clean Architecture (Hexagonal)
- ✅ 100% type-safe (TypeScript + Python)
- ✅ 47 testes passando
- ✅ Zero acoplamento entre camadas

---

## 💡 Dica Pro

**Para desenvolvimento ativo:**

1. Mantenha 3 terminais abertos:
   - Terminal 1: Backend (`cd backend && python run.py`)
   - Terminal 2: Frontend (`cd frontend && npm run dev`)
   - Terminal 3: Comandos git e testes

2. Use a documentação interativa da API:
   - http://localhost:8000/docs (testar endpoints)

3. Monitore o console do navegador (F12):
   - Verificar requisições na aba Network
   - Ver erros na aba Console

---

## 🚀 VetQueue - De Zero a Funcionando em 30 Segundos!

**Pronto? Execute `.\start-vetqueue.bat` e comece! 🎯**


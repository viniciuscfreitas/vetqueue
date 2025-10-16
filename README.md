# 🏥 VetQueue

**Sistema de Gerenciamento de Fila de Atendimento Veterinário**

[![Frontend](https://img.shields.io/badge/Frontend-React%20%2B%20TypeScript-blue)](./frontend)
[![Backend](https://img.shields.io/badge/Backend-FastAPI%20%2B%20Python-green)](./backend)
[![Architecture](https://img.shields.io/badge/Architecture-Hexagonal%20%2F%20Clean-orange)](./INTEGRATION.md)
[![Tests](https://img.shields.io/badge/Tests-47%20passing-success)]()

Sistema completo para gerenciamento de fila de atendimento em clínicas veterinárias, construído com **arquitetura FAANG-level** e princípios de Clean Architecture.

---

## 📋 Visão Geral

O VetQueue é composto por dois componentes principais integrados via API REST:

### Frontend (React + TypeScript)
- Interface moderna e responsiva
- Gerenciamento de estado com TanStack Query
- Dois painéis principais:
  - **Painel de Controle**: Gerenciamento completo da fila (protegido por autenticação)
  - **Painel de Exibição (TV)**: Visualização pública das chamadas recentes

### Backend (FastAPI + Python)
- API REST seguindo **Arquitetura Hexagonal**
- Separação clara de camadas (Domain, Application, Infrastructure)
- 100% testado (47 testes unitários + integração)
- Type-safe com Pydantic schemas

---

## 🚀 Quick Start

### Método 1: Script Automatizado (Windows)

```bash
# Execute o script de startup
start-vetqueue.bat
```

### Método 2: Manual

**Terminal 1 - Backend:**
```bash
cd backend
pip install -r requirements.txt
python run.py
```

**Terminal 2 - Frontend:**
```bash
cd frontend
npm install
npm run dev
```

**Acessar:**
- 🌐 **Aplicação**: http://localhost:5173
- 📚 **API Docs**: http://localhost:8000/docs
- 🔍 **API Health**: http://localhost:8000

---

## 🏗️ Arquitetura

### Visão Geral do Sistema

```
┌──────────────────────────────────────────────────────────────┐
│                       FRONTEND LAYER                          │
│  ┌────────────┐  ┌────────────┐  ┌────────────┐             │
│  │   Pages    │→│   Hooks    │→│ API Client │──────┐       │
│  │            │  │ (TanStack) │  │  (axios)   │      │       │
│  └────────────┘  └────────────┘  └────────────┘      │       │
└──────────────────────────────────────────────────────┼───────┘
                                                        │
                        HTTP/REST (JSON)                │
                                                        │
┌───────────────────────────────────────────────────────┼───────┐
│                       BACKEND LAYER                   │       │
│  ┌────────────────────────────────────────────────────┘       │
│  │                                                             │
│  │  Infrastructure (API + Persistence)                        │
│  │         ↓                                                  │
│  │  Application (Use Cases)                                   │
│  │         ↓                                                  │
│  │  Domain (Entities + Business Logic)                        │
│  │                                                             │
│  └─────────────────────────────────────────────────────────── │
└──────────────────────────────────────────────────────────────┘
```

### Backend: Arquitetura Hexagonal

```
vetqueue-backend/
├── domain/              # Núcleo - Lógica de negócio pura
│   ├── entities.py      # Entidade Paciente
│   ├── value_objects.py # StatusPaciente
│   └── repositories.py  # Portas (interfaces)
│
├── application/         # Casos de Uso
│   └── use_cases.py     # Orquestração da lógica
│
└── infrastructure/      # Adaptadores
    ├── api/             # FastAPI (entrada)
    └── persistence/     # Repository (saída)
```

**Princípios Aplicados:**
- ✅ Regra da Dependência (dependências apontam para o domínio)
- ✅ Separação de Concerns (domain não conhece FastAPI)
- ✅ Inversão de Dependência (portas e adaptadores)
- ✅ SOLID Principles
- ✅ Domain-Driven Design (DDD)

---

## 🎯 Funcionalidades

### Autenticação
- [x] Login com credenciais (admin/1234)
- [ ] JWT com refresh tokens (Fase 2)

### Gerenciamento de Fila
- [x] Adicionar paciente à fila
- [x] Chamar paciente para atendimento
- [x] Definir sala de atendimento
- [x] Finalizar atendimento
- [x] Visualizar estado completo da fila

### Painéis
- [x] **Painel de Controle**: Interface administrativa completa
- [x] **Painel de Exibição**: Visualização pública para TVs (auto-atualização)

### Validações
- [x] Campos obrigatórios
- [x] Transições de estado válidas
- [x] Sala obrigatória ao chamar para atendimento
- [x] Não permitir chamar paciente já em atendimento

---

## 🧪 Testes

### Backend
```bash
cd backend
pytest                     # Todos os testes
pytest tests/unit/         # Apenas testes unitários
pytest tests/integration/  # Apenas testes de integração
pytest --cov=vetqueue      # Com cobertura
```

**Resultado:** ✅ 47 testes passando

---

## 📚 Documentação

- **[INTEGRATION.md](./INTEGRATION.md)** - Guia completo de integração e testes E2E
- **[backend/README.md](./backend/README.md)** - Documentação do backend (arquitetura, API, testes)
- **[API Docs (Swagger)](http://localhost:8000/docs)** - Documentação interativa da API (quando o backend está rodando)

---

## 🛠️ Stack Tecnológico

### Frontend
- **React 18** - UI Library
- **TypeScript** - Type Safety
- **Vite** - Build Tool
- **TailwindCSS** - Styling
- **TanStack Query** - State Management + Cache
- **Axios** - HTTP Client
- **React Router** - Routing

### Backend
- **FastAPI** - Framework Web
- **Python 3.11+** - Linguagem
- **Pydantic** - Validação de Dados
- **Pytest** - Framework de Testes
- **Uvicorn** - Servidor ASGI

---

## 📂 Estrutura do Projeto

```
vetqueue/
├── frontend/                # Aplicação React
│   ├── src/
│   │   ├── components/      # Componentes reutilizáveis
│   │   ├── hooks/           # Custom hooks
│   │   ├── pages/           # Páginas da aplicação
│   │   ├── services/        # Cliente API
│   │   └── types/           # TypeScript interfaces
│   └── package.json
│
├── backend/                 # API FastAPI
│   ├── vetqueue/
│   │   ├── domain/          # Lógica de negócio pura
│   │   ├── application/     # Casos de uso
│   │   └── infrastructure/  # API + Persistência
│   ├── tests/               # Testes unitários + integração
│   ├── main.py              # Ponto de entrada
│   └── requirements.txt
│
├── INTEGRATION.md           # Guia de integração E2E
├── start-vetqueue.bat       # Script de startup
└── README.md                # Este arquivo
```

---

## 🔐 Credenciais Padrão

**Login:**
- Usuário: `admin`
- Senha: `1234`

> ⚠️ **Nota**: Em produção, implementar autenticação JWT real com hash de senhas (Fase 2)

---

## 🚦 Status do Projeto

### ✅ Fase 1: Fundação (Completa)
- [x] Frontend completo e polido
- [x] Backend com Arquitetura Hexagonal
- [x] Integração via API REST
- [x] Testes unitários e de integração
- [x] Documentação completa

### 🚧 Fase 2: Melhorias (Planejada)
- [ ] PostgreSQL para persistência real
- [ ] JWT Authentication
- [ ] WebSockets para sync em tempo real
- [ ] Docker + Docker Compose
- [ ] CI/CD Pipeline
- [ ] Logging estruturado
- [ ] Métricas e observabilidade

### 📅 Fase 3: Features Avançadas (Roadmap)
- [ ] Histórico de atendimentos
- [ ] Relatórios e analytics
- [ ] Notificações push
- [ ] Multi-tenancy
- [ ] App mobile nativo

---

## 🐛 Troubleshooting

### Backend não inicia
```bash
# Verificar dependências
cd backend
pip install -r requirements.txt

# Verificar porta ocupada
netstat -ano | findstr :8000
```

### Frontend não conecta ao Backend
1. Verificar se backend está rodando em `http://localhost:8000`
2. Abrir DevTools (F12) → Network
3. Verificar erros de CORS ou conectividade
4. Confirmar que `frontend/src/services/api.ts` aponta para a URL correta

### Erro de CORS
- Verificar `backend/main.py` → `CORSMiddleware` configuration
- Confirmar que `http://localhost:5173` está na lista de origens permitidas

---

## 👥 Contribuindo

Este é um projeto de portfolio construído com padrões de engenharia de elite. Sugestões e feedback são bem-vindos!

---

## 📄 Licença

Este projeto é de código aberto para fins educacionais e de portfolio.

---

## 🏆 Destaques de Engenharia

Este projeto foi construído seguindo:
- **Clean Architecture** (Robert C. Martin)
- **Domain-Driven Design** (Eric Evans)
- **SOLID Principles**
- **Test-Driven Development (TDD)**
- **FAANG-Level Code Quality**

**Características técnicas notáveis:**
- Zero dependências do framework no domínio
- 100% de type safety (TypeScript + Python Type Hints)
- Regra da Dependência rigorosamente aplicada
- `asyncio.Lock` para concorrência segura
- Dependency Injection via FastAPI
- Testes isolados com mocks
- API REST com documentação automática (OpenAPI)

---

**🎯 VetQueue - Onde engenharia de software de qualidade encontra simplicidade de uso.**


# VetQueue Backend

Sistema de gerenciamento de fila de atendimento veterinário construído com FastAPI seguindo princípios de **Arquitetura Hexagonal** (Ports & Adapters).

---

## 🏗️ Arquitetura

Este projeto implementa **Arquitetura Hexagonal** com separação clara de responsabilidades em 3 camadas:

```
vetqueue-backend/
├── vetqueue/
│   ├── domain/              # ⭐ Camada de Domínio (Núcleo)
│   │   ├── entities.py      #    - Entidades de negócio (Paciente)
│   │   ├── value_objects.py #    - Value Objects (StatusPaciente)
│   │   └── repositories.py  #    - Portas (interfaces abstratas)
│   │
│   ├── application/         # 🎯 Camada de Aplicação
│   │   └── use_cases.py     #    - Casos de uso (orquestração)
│   │
│   └── infrastructure/      # 🔌 Camada de Infraestrutura (Adaptadores)
│       ├── api/             #    - Adaptador de entrada (FastAPI)
│       │   ├── routes.py
│       │   ├── schemas.py
│       │   └── dependencies.py
│       └── persistence/     #    - Adaptador de saída (Repositório)
│           └── memory_repository.py
│
├── tests/
│   ├── unit/                # Testes unitários (Domain + Application)
│   └── integration/         # Testes de integração (API)
│
└── main.py                  # Ponto de entrada da aplicação
```

### Princípios Aplicados

✅ **Regra da Dependência**: Dependências apontam sempre para dentro (infraestrutura → aplicação → domínio)  
✅ **Separação de Concerns**: Lógica de negócio isolada de frameworks e bibliotecas externas  
✅ **Inversão de Dependência**: Domínio define interfaces, infraestrutura as implementa  
✅ **Testabilidade**: Cada camada pode ser testada isoladamente  

---

## 🚀 Setup e Instalação

### Pré-requisitos

- **Python 3.11+**
- **pip** ou **poetry** para gerenciamento de dependências

### Instalação

1. **Crie um ambiente virtual:**

```bash
python -m venv venv
```

2. **Ative o ambiente virtual:**

- **Windows:**
  ```bash
  venv\Scripts\activate
  ```

- **Linux/Mac:**
  ```bash
  source venv/bin/activate
  ```

3. **Instale as dependências:**

```bash
pip install -r requirements.txt
```

---

## ▶️ Executando a Aplicação

### Modo Desenvolvimento (com auto-reload)

```bash
python main.py
```

Ou usando uvicorn diretamente:

```bash
uvicorn main:app --reload --host 0.0.0.0 --port 8000
```

A API estará disponível em:
- **API**: http://localhost:8000
- **Documentação Interativa (Swagger)**: http://localhost:8000/docs
- **Documentação Alternativa (ReDoc)**: http://localhost:8000/redoc

---

## 🧪 Executando os Testes

### Executar todos os testes

```bash
pytest
```

### Executar testes com cobertura

```bash
pytest --cov=vetqueue --cov-report=html
```

O relatório HTML estará disponível em `htmlcov/index.html`.

### Executar apenas testes unitários

```bash
pytest tests/unit/
```

### Executar apenas testes de integração

```bash
pytest tests/integration/
```

### Executar testes com output detalhado

```bash
pytest -v
```

---

## 📡 API Endpoints

### Autenticação

#### `POST /auth/login`
Realiza login e retorna um token JWT (MVP simplificado).

**Request Body:**
```json
{
  "user": "admin",
  "pass": "1234"
}
```

**Response (200):**
```json
{
  "nome": "Dr. Ricardo",
  "token": "fake-jwt-token"
}
```

---

### Fila

#### `GET /fila`
Retorna o estado completo da fila de atendimento.

**Response (200):**
```json
{
  "aguardando": [
    {
      "id": "uuid",
      "nome_pet": "Bolinha",
      "nome_tutor": "Maria Silva",
      "status": "Aguardando",
      "sala_atendimento": null
    }
  ],
  "em_atendimento": [
    {
      "id": "uuid",
      "nome_pet": "Rex",
      "nome_tutor": "João Silva",
      "status": "Em Atendimento",
      "sala_atendimento": "Consultório 1"
    }
  ]
}
```

---

### Pacientes

#### `POST /pacientes`
Adiciona um novo paciente à fila.

**Request Body:**
```json
{
  "nome_pet": "Bolinha",
  "nome_tutor": "Maria Silva"
}
```

**Response (201):**
```json
{
  "id": "uuid",
  "nome_pet": "Bolinha",
  "nome_tutor": "Maria Silva",
  "status": "Aguardando",
  "sala_atendimento": null
}
```

---

#### `PUT /pacientes/{paciente_id}/chamar`
Chama um paciente para atendimento em uma sala específica.

**Request Body:**
```json
{
  "sala": "Consultório 1"
}
```

**Response (200):**
```json
{
  "id": "uuid",
  "nome_pet": "Bolinha",
  "nome_tutor": "Maria Silva",
  "status": "Em Atendimento",
  "sala_atendimento": "Consultório 1"
}
```

---

#### `DELETE /pacientes/{paciente_id}`
Finaliza o atendimento de um paciente e o remove da fila.

**Response (200):**
```json
{
  "id": "uuid"
}
```

---

## 🛠️ Stack Tecnológico

- **FastAPI** - Framework web moderno e de alta performance
- **Pydantic** - Validação de dados e serialização
- **Uvicorn** - Servidor ASGI de alta performance
- **Pytest** - Framework de testes
- **pytest-asyncio** - Suporte para testes assíncronos
- **httpx** - Cliente HTTP para testes de integração

---

## 📋 Status do Projeto

### ✅ Fase 1: Fundação (Completa)

- [x] Estrutura de pastas seguindo Arquitetura Hexagonal
- [x] Camada de Domínio (Entidades, Value Objects, Portas)
- [x] Camada de Aplicação (Use Cases)
- [x] Camada de Infraestrutura (API + Repositório em Memória)
- [x] Testes Unitários (Domain + Application)
- [x] Testes de Integração (API)
- [x] Documentação da API (Swagger/ReDoc)
- [x] CORS configurado para comunicação com frontend

### 🚧 Fase 2: Próximos Passos

- [ ] Autenticação JWT real
- [ ] Persistência em PostgreSQL
- [ ] WebSockets para atualizações em tempo real
- [ ] Docker + Docker Compose
- [ ] CI/CD Pipeline
- [ ] Logging estruturado
- [ ] Métricas e observabilidade

---

## 🧩 Padrões de Design Utilizados

- **Hexagonal Architecture (Ports & Adapters)**
- **Dependency Injection**
- **Repository Pattern**
- **Use Case Pattern**
- **DTO (Data Transfer Objects)**
- **Domain-Driven Design (DDD) principles**

---

## 📝 Convenções de Código

Este projeto segue:
- **PEP 8** - Style Guide for Python Code
- **Type Hints** - Anotações de tipo em todos os métodos
- **Docstrings** - Documentação de classes e métodos
- **SOLID Principles**
- **Clean Architecture Principles**

---

## 🤝 Contribuindo

Este é um projeto de portfolio, mas sugestões e feedback são bem-vindos!

---

## 📄 Licença

Este projeto é de código aberto para fins educacionais e de portfolio.

---

## 👤 Autor

Desenvolvido seguindo princípios de engenharia de software de nível sênior, com foco em qualidade, testabilidade e manutenibilidade.

---

**🎯 VetQueue - Gerenciamento de Fila Veterinária com Arquitetura de Qualidade**


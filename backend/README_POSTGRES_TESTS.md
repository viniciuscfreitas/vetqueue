# Testes de Integração com PostgreSQL

## Pré-requisitos

Para executar os testes de integração com PostgreSQL, você precisa:

1. **Docker Desktop** rodando
2. **PostgreSQL** via Docker Compose

## Configuração

### 1. Iniciar PostgreSQL

```bash
# Na raiz do projeto
docker-compose up -d postgres-test
```

### 2. Verificar se o banco está rodando

```bash
# Verificar containers
docker ps

# Deve mostrar o container vetqueue-postgres-test rodando na porta 5433
```

### 3. Executar Migrations (se necessário)

```bash
cd backend
python -m alembic upgrade head
```

## Executando os Testes

### Testes de Integração com PostgreSQL

```bash
cd backend
python -m pytest tests/integration/test_api_postgres.py -v
```

### Todos os Testes

```bash
cd backend
python -m pytest tests/ -v
```

## Estrutura dos Testes

### Fixtures Implementadas

1. **`test_engine` (session scope)**: 
   - Cria engine de teste
   - Executa migrations UMA VEZ
   - Limpa schema ao final

2. **`db_session` (function scope)**:
   - Sessão isolada por teste
   - Transação com rollback automático
   - Banco sempre limpo entre testes

3. **`test_repository` (function scope)**:
   - Repositório PostgreSQL usando sessão de teste
   - Isolado por teste

### Estratégia de Testes

- **Isolamento**: Cada teste roda em transação separada
- **Performance**: Rollback é mais rápido que DELETE/INSERT
- **Confiabilidade**: Banco sempre limpo entre testes
- **Paralelização**: Suporte a testes paralelos

## Troubleshooting

### Erro: "password authentication failed"

```bash
# Verificar se PostgreSQL está rodando
docker ps | grep postgres

# Se não estiver, iniciar
docker-compose up -d postgres-test

# Aguardar inicialização
sleep 10
```

### Erro: "database does not exist"

```bash
# Aplicar migrations
cd backend
python -m alembic upgrade head
```

### Limpar Dados de Teste

```bash
# Parar e remover containers
docker-compose down

# Remover volumes (CUIDADO: apaga todos os dados)
docker-compose down -v
```

## Arquitetura dos Testes

```
tests/
├── conftest.py              # Fixtures globais
├── integration/
│   ├── test_api.py          # Testes com InMemory (sempre funcionam)
│   └── test_api_postgres.py # Testes com PostgreSQL (requer Docker)
└── unit/                    # Testes unitários
```

## Benefícios da Implementação

1. **Zero Estado Global**: Cada teste é isolado
2. **Performance**: Rollback é mais rápido que cleanup manual
3. **Confiabilidade**: Impossível ter dados "vazando" entre testes
4. **Escalabilidade**: Suporte a testes paralelos
5. **Manutenibilidade**: Fixtures reutilizáveis

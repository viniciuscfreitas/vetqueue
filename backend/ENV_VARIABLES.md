# Variáveis de Ambiente - VetQueue

## Configurações Obrigatórias

### JWT_SECRET_KEY
**OBRIGATÓRIO** - Chave secreta para assinar tokens JWT
```bash
# Gere uma chave segura com:
openssl rand -hex 32
# ou
python -c "import secrets; print(secrets.token_hex(32))"
```

### DATABASE_URL
URL de conexão com o banco PostgreSQL
```bash
DATABASE_URL=postgresql+asyncpg://vetqueue:vetqueue_dev_password@localhost:5432/vetqueue_dev
```

## Configurações Opcionais

### JWT_ALGORITHM
Algoritmo de assinatura JWT (padrão: HS256)
```bash
JWT_ALGORITHM=HS256
```

### ACCESS_TOKEN_EXPIRE_MINUTES
Tempo de expiração do access token em minutos (padrão: 30)
```bash
ACCESS_TOKEN_EXPIRE_MINUTES=30
```

### REFRESH_TOKEN_EXPIRE_DAYS
Tempo de expiração do refresh token em dias (padrão: 7)
```bash
REFRESH_TOKEN_EXPIRE_DAYS=7
```

### TEST_DATABASE_URL
URL do banco de testes
```bash
TEST_DATABASE_URL=postgresql+asyncpg://vetqueue:vetqueue_test_password@localhost:5433/vetqueue_test
```

### DEBUG
Modo debug (padrão: false)
```bash
DEBUG=false
```

### LOG_LEVEL
Nível de log (padrão: INFO)
```bash
LOG_LEVEL=INFO
```

### FRONTEND_URL
URL do frontend para CORS (padrão: http://localhost:5173)
```bash
FRONTEND_URL=http://localhost:5173
```

## Exemplo de .env

```bash
# Configurações Obrigatórias
JWT_SECRET_KEY=your_super_secret_jwt_key_here_generate_with_openssl_rand_hex_32
DATABASE_URL=postgresql+asyncpg://vetqueue:vetqueue_dev_password@localhost:5432/vetqueue_dev

# Configurações Opcionais
JWT_ALGORITHM=HS256
ACCESS_TOKEN_EXPIRE_MINUTES=30
REFRESH_TOKEN_EXPIRE_DAYS=7
TEST_DATABASE_URL=postgresql+asyncpg://vetqueue:vetqueue_test_password@localhost:5433/vetqueue_test
DEBUG=false
LOG_LEVEL=INFO
FRONTEND_URL=http://localhost:5173
```

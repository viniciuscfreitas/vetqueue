# 🦖 Broker Backend - API Grug Style

Backend simples e funcional para gerenciar imóveis e leads.

## Stack

- **Node.js** + **Express**
- **SQLite** (better-sqlite3)
- **JWT** para auth
- **bcrypt** para senhas

## Setup Inicial

```bash
# 1. Copiar .env
cp .env.example .env

# 2. Instalar nodemon (dev)
npm install -D nodemon

# 3. Rodar servidor
npm run dev
```

## Criar Usuário Admin (PRIMEIRA VEZ)

```bash
curl -X POST http://localhost:3001/api/auth/setup \
  -H "Content-Type: application/json" \
  -d '{"username":"admin","password":"suasenha123"}'
```

**IMPORTANTE:** Use isso APENAS UMA VEZ! Depois mude a senha!

## Endpoints

### Auth
- `POST /api/auth/setup` - Criar primeiro admin (usar UMA VEZ)
- `POST /api/auth/login` - Login (retorna token JWT)

### Properties (Imóveis)
- `GET /api/properties` - Listar todos (público)
- `GET /api/properties/:id` - Ver um imóvel (público)
- `POST /api/properties` - Criar (🔒 protegido)
- `PUT /api/properties/:id` - Editar (🔒 protegido)
- `DELETE /api/properties/:id` - Deletar (🔒 protegido)

### Leads
- `GET /api/leads` - Listar leads (🔒 protegido)
- `POST /api/leads` - Criar lead (público - vem do site)
- `DELETE /api/leads/:id` - Deletar lead (🔒 protegido)

## Usar Rotas Protegidas

Adicionar header em TODAS requisições protegidas:

```
Authorization: Bearer SEU_TOKEN_AQUI
```

## Estrutura do Banco

### properties
- id, title, subtitle, price, image, bairro, tipo, specs, tags, created_at, updated_at

### leads
- id, name, phone, property_id, property_title, type, created_at

### users
- id, username, password_hash, created_at

## Testar com cURL

### Login
```bash
curl -X POST http://localhost:3001/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username":"admin","password":"suasenha123"}'
```

### Criar Imóvel
```bash
curl -X POST http://localhost:3001/api/properties \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer SEU_TOKEN" \
  -d '{
    "title":"Cobertura Gonzaga",
    "subtitle":"Vista mar incrível",
    "price":"R$ 2.500.000",
    "bairro":"Gonzaga",
    "tipo":"Cobertura",
    "specs":"3 suítes • 180m²",
    "tags":["Frente Mar","Exclusivo"]
  }'
```

### Criar Lead
```bash
curl -X POST http://localhost:3001/api/leads \
  -H "Content-Type: application/json" \
  -d '{
    "name":"João Silva",
    "phone":"(13) 99999-9999",
    "property_title":"Cobertura Gonzaga",
    "type":"gate"
  }'
```

## Grug diz

> "Código simples. Funciona. Grug feliz! 🦖"

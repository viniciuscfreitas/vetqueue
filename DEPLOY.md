# 🚀 Guia de Deploy - VetQueue

## Visão Geral

Este guia fornece instruções completas para fazer deploy da aplicação VetQueue em ambiente de produção usando Docker.

## 📋 Pré-requisitos

### Software Necessário
- **Docker Desktop** (Windows/Mac) ou **Docker Engine** (Linux)
- **Docker Compose** v2.0+
- **Git** (para clonar o repositório)

### Recursos do Sistema
- **RAM**: Mínimo 4GB, recomendado 8GB+
- **CPU**: 2 cores, recomendado 4 cores+
- **Disco**: 10GB livres para imagens e volumes

## 🏗️ Arquitetura de Deploy

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Frontend      │    │   Backend       │    │   PostgreSQL    │
│   (Nginx)       │    │   (FastAPI)     │    │   (Database)    │
│   Port: 3000    │    │   Port: 8000    │    │   Port: 5432    │
└─────────────────┘    └─────────────────┘    └─────────────────┘
         │                       │                       │
         └───────────────────────┼───────────────────────┘
                                 │
                    ┌─────────────────┐
                    │   Redis         │
                    │   (Cache)       │
                    │   Port: 6379    │
                    └─────────────────┘
```

## 🚀 Deploy Rápido

### 1. Preparar Ambiente

```bash
# Clonar repositório
git clone <repository-url>
cd vetqueue

# Configurar variáveis de ambiente
cp .env.production .env
# Editar .env com suas configurações
```

### 2. Deploy Automático

#### Linux/Mac:
```bash
./deploy.sh start
```

#### Windows:
```cmd
deploy.bat start
```

### 3. Verificar Deploy

```bash
# Verificar status
./deploy.sh status  # Linux/Mac
deploy.bat status    # Windows

# Ver logs
./deploy.sh logs     # Linux/Mac
deploy.bat logs      # Windows
```

## ⚙️ Configuração Detalhada

### Variáveis de Ambiente (.env)

```bash
# Database
POSTGRES_PASSWORD=senha_super_segura_aqui

# JWT Security (OBRIGATÓRIO)
JWT_SECRET_KEY=chave_jwt_super_segura_64_caracteres
JWT_ALGORITHM=HS256
ACCESS_TOKEN_EXPIRE_MINUTES=30
REFRESH_TOKEN_EXPIRE_DAYS=7

# Application
DEBUG=false
LOG_LEVEL=INFO
FRONTEND_URL=http://localhost:3000

# Frontend URLs
VITE_API_URL=http://localhost:8000
VITE_WS_URL=ws://localhost:8000
```

### Geração de Chaves Seguras

```bash
# Gerar chave JWT segura
openssl rand -hex 32

# Ou usando Python
python -c "import secrets; print(secrets.token_hex(32))"
```

## 🐳 Comandos Docker

### Gerenciamento de Serviços

```bash
# Iniciar todos os serviços
docker-compose -f docker-compose.prod.yml up -d

# Parar todos os serviços
docker-compose -f docker-compose.prod.yml down

# Reiniciar serviços
docker-compose -f docker-compose.prod.yml restart

# Ver logs
docker-compose -f docker-compose.prod.yml logs -f

# Ver status
docker-compose -f docker-compose.prod.yml ps
```

### Gerenciamento Individual

```bash
# Apenas backend
docker-compose -f docker-compose.prod.yml up -d backend

# Apenas frontend
docker-compose -f docker-compose.prod.yml up -d frontend

# Apenas banco
docker-compose -f docker-compose.prod.yml up -d postgres
```

## 🔧 Manutenção

### Backup do Banco

```bash
# Backup
docker exec vetqueue-postgres pg_dump -U vetqueue vetqueue_prod > backup.sql

# Restore
docker exec -i vetqueue-postgres psql -U vetqueue vetqueue_prod < backup.sql
```

### Atualização da Aplicação

```bash
# Parar serviços
./deploy.sh stop

# Atualizar código
git pull origin main

# Rebuild e iniciar
./deploy.sh start
```

### Limpeza de Recursos

```bash
# Remover containers parados
docker-compose -f docker-compose.prod.yml down

# Remover volumes (CUIDADO: apaga dados!)
docker-compose -f docker-compose.prod.yml down -v

# Limpeza completa
docker system prune -a
```

## 🌐 Acessos

Após o deploy bem-sucedido:

- **Frontend**: http://localhost:3000
- **Backend API**: http://localhost:8000
- **API Docs**: http://localhost:8000/docs
- **PostgreSQL**: localhost:5432
- **Redis**: localhost:6379

## 🔒 Segurança

### Checklist de Segurança

- [ ] Alterar senhas padrão
- [ ] Configurar JWT_SECRET_KEY segura
- [ ] Configurar firewall (portas 3000, 8000)
- [ ] Usar HTTPS em produção
- [ ] Configurar backup automático
- [ ] Monitorar logs de segurança

### Configuração de Firewall

```bash
# Ubuntu/Debian
ufw allow 3000
ufw allow 8000
ufw enable

# CentOS/RHEL
firewall-cmd --permanent --add-port=3000/tcp
firewall-cmd --permanent --add-port=8000/tcp
firewall-cmd --reload
```

## 📊 Monitoramento

### Health Checks

```bash
# Verificar saúde dos serviços
curl http://localhost:8000/health
curl http://localhost:3000/health

# Verificar logs
docker-compose -f docker-compose.prod.yml logs backend
docker-compose -f docker-compose.prod.yml logs frontend
```

### Métricas de Performance

```bash
# Uso de recursos
docker stats

# Espaço em disco
docker system df

# Logs de performance
docker-compose -f docker-compose.prod.yml logs --tail=100
```

## 🚨 Troubleshooting

### Problemas Comuns

#### 1. Porta já em uso
```bash
# Verificar portas em uso
netstat -tulpn | grep :3000
netstat -tulpn | grep :8000

# Parar processo conflitante
sudo kill -9 <PID>
```

#### 2. Erro de permissão
```bash
# Corrigir permissões
sudo chown -R $USER:$USER .
chmod +x deploy.sh
```

#### 3. Container não inicia
```bash
# Verificar logs
docker-compose -f docker-compose.prod.yml logs <service>

# Rebuild
docker-compose -f docker-compose.prod.yml build --no-cache
```

#### 4. Banco não conecta
```bash
# Verificar se PostgreSQL está rodando
docker-compose -f docker-compose.prod.yml ps postgres

# Verificar logs do banco
docker-compose -f docker-compose.prod.yml logs postgres
```

## 📞 Suporte

Para problemas ou dúvidas:

1. Verificar logs: `./deploy.sh logs`
2. Verificar status: `./deploy.sh status`
3. Consultar documentação
4. Abrir issue no repositório

---

**VetQueue** - Sistema de Gestão de Fila Veterinária
*Deploy automatizado com Docker*

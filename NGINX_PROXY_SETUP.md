# Configuração Nginx Proxy Manager

## 📋 Configurações Necessárias

### 1. Site Principal (Frontend Público)

**Proxy Host: `marcelobraz.vinicius.xyz`**

#### Tab "Details":
- **Domain Names:** `marcelobraz.vinicius.xyz`
- **Scheme:** `http`
- **Forward Hostname / IP:** `marcelobraz-site`
- **Forward Port:** `80`
- **Cache Assets:** ❌ OFF
- **Block Common Exploits:** ✅ ON
- **Websockets Support:** ✅ ON

#### Tab "Custom Locations":
Adicione uma location `/api`:
- **Location:** `/api`
- **Scheme:** `http`
- **Forward Hostname / IP:** `marcelobraz-backend`
- **Forward Port:** `3001`

#### Tab "SSL":
- **SSL Certificate:** Solicite certificado Let's Encrypt para `marcelobraz.vinicius.xyz`
- **Force SSL:** ✅ ON
- **HTTP/2 Support:** ✅ ON
- **HSTS Enabled:** ✅ ON
- **HSTS Sub-domains:** ✅ ON

---

### 2. Painel Admin

**Proxy Host: `admin.marcelobraz.vinicius.xyz`** (ou outro subdomínio)

#### Tab "Details":
- **Domain Names:** `admin.marcelobraz.vinicius.xyz`
- **Scheme:** `http`
- **Forward Hostname / IP:** `marcelobraz-admin`
- **Forward Port:** `5173`
- **Cache Assets:** ❌ OFF
- **Block Common Exploits:** ✅ ON
- **Websockets Support:** ✅ ON

#### Tab "SSL":
- **SSL Certificate:** Solicite certificado Let's Encrypt para `admin.marcelobraz.vinicius.xyz`
- **Force SSL:** ✅ ON
- **HTTP/2 Support:** ✅ ON
- **HSTS Enabled:** ✅ ON

---

## 🔐 Credenciais Admin

**Após configurar no servidor:**
```bash
cd ~/www/marcelobraz
git pull origin main
docker compose down
docker compose up -d --build
docker exec marcelobraz-backend node create-admin.js
```

**Credenciais padrão:**
- **Usuário:** `admin`
- **Senha:** `admin123`

---

## ✅ Verificações

### 1. Verificar Containers na Rede npm_default

```bash
# Site
docker inspect marcelobraz-site | grep -A 10 "npm_default"

# Backend
docker inspect marcelobraz-backend | grep -A 10 "npm_default"

# Admin
docker inspect marcelobraz-admin | grep -A 10 "npm_default"
```

### 2. Testar Acesso dos Containers

```bash
# Testar site → backend
docker exec marcelobraz-site wget -qO- http://marcelobraz-backend:3001/api/health

# Testar NPM → site
docker exec npm-app-1 sh -c "curl -s http://marcelobraz-site:80"

# Testar NPM → backend
docker exec npm-app-1 sh -c "curl -s http://marcelobraz-backend:3001/api/health"

# Testar NPM → admin
docker exec npm-app-1 sh -c "curl -s http://marcelobraz-admin:5173"
```

---

## 🔧 Troubleshooting

### Se algum container não estiver na rede npm_default:

```bash
# Conectar manualmente
docker network connect npm_default marcelobraz-site
docker network connect npm_default marcelobraz-backend
docker network connect npm_default marcelobraz-admin
```

### Se precisar reconectar tudo:

```bash
cd ~/www/marcelobraz
docker compose down
docker compose up -d
chmod +x connect-networks.sh
./connect-networks.sh
```

---

## 📝 URLs Finais

- **Site:** `https://marcelobraz.vinicius.xyz`
- **Admin:** `https://admin.marcelobraz.vinicius.xyz` (ou outro subdomínio)
- **API:** `https://marcelobraz.vinicius.xyz/api` (rota automática via Custom Location)

---

## 🎯 Checklist de Configuração

- [ ] Site principal configurado no NPM
- [ ] Custom Location `/api` configurada
- [ ] SSL configurado para site principal
- [ ] Admin configurado no NPM (opcional, mas recomendado)
- [ ] SSL configurado para admin
- [ ] Todos os containers na rede npm_default
- [ ] Credenciais admin criadas
- [ ] Testes de acesso funcionando


# Dockerfile para VetQueue Frontend - Build Multi-Stage Otimizado
FROM node:20-alpine AS builder

# Metadados da imagem
LABEL maintainer="VetQueue Team"
LABEL description="VetQueue Frontend - React + Vite + TypeScript"
LABEL version="1.0.0"

# Variáveis de ambiente para build
ENV NODE_ENV=production \
    VITE_API_URL=http://localhost:8000 \
    VITE_WS_URL=ws://localhost:8000

# Instalar dependências do sistema
RUN apk add --no-cache git

# Definir diretório de trabalho
WORKDIR /app

# Copiar package files
COPY package*.json ./

# Instalar dependências
RUN npm ci --only=production --silent

# Copiar código fonte
COPY . .

# Build da aplicação
RUN npm run build

# Stage 2: Servidor Nginx para servir arquivos estáticos
FROM nginx:alpine AS production

# Copiar configuração customizada do Nginx
COPY nginx.conf /etc/nginx/nginx.conf

# Copiar arquivos buildados
COPY --from=builder /app/dist /usr/share/nginx/html

# Criar usuário não-root
RUN addgroup -g 1001 -S nginx && \
    adduser -S -D -H -u 1001 -h /var/cache/nginx -s /sbin/nologin -G nginx -g nginx nginx

# Configurar permissões
RUN chown -R nginx:nginx /usr/share/nginx/html && \
    chown -R nginx:nginx /var/cache/nginx && \
    chown -R nginx:nginx /var/log/nginx && \
    chown -R nginx:nginx /etc/nginx/conf.d

# Mudar para usuário não-root
USER nginx

# Expor porta
EXPOSE 80

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \
    CMD wget --no-verbose --tries=1 --spider http://localhost:80/ || exit 1

# Comando de inicialização
CMD ["nginx", "-g", "daemon off;"]

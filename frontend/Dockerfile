# Dockerfile para VetQueue Frontend - Build Multi-Stage Otimizado v2
# Estágio 1: Builder - Constrói a aplicação React/Vite
FROM node:20-alpine AS builder

LABEL maintainer="VetQueue Team"
LABEL description="VetQueue Frontend - React + Vite + TypeScript"
LABEL version="1.0.0"

WORKDIR /app

# ---- CORREÇÃO 2: Usar ARGs para injetar variáveis de ambiente no build ----
# Estas são variáveis que podem ser passadas durante o 'docker compose build'
ARG VITE_API_URL
ARG VITE_WS_URL

# Agora, definimos as ENVs que o Vite vai usar, baseadas nos ARGs que recebemos
ENV VITE_API_URL=$VITE_API_URL
ENV VITE_WS_URL=$VITE_WS_URL

COPY package*.json ./

# ---- CORREÇÃO 1: Instalar TODAS as dependências para o build funcionar ----
RUN npm ci --silent

COPY . .

RUN npm run build

# Estágio 2: Production - Servidor Nginx leve para servir os arquivos
FROM nginx:alpine AS production

COPY nginx.conf /etc/nginx/nginx.conf
COPY --from=builder /app/dist /usr/share/nginx/html

# Criação de usuário não-root (Excelente prática de segurança!)
RUN addgroup -g 1001 -S nginx && \
    adduser -S -D -H -u 1001 -h /var/cache/nginx -s /sbin/nologin -G nginx -g nginx nginx
RUN chown -R nginx:nginx /usr/share/nginx/html && \
    chown -R nginx:nginx /var/cache/nginx && \
    chown -R nginx:nginx /var/log/nginx && \
    chown -R nginx:nginx /etc/nginx/conf.d

USER nginx
EXPOSE 80

# Health check (Excelente prática!)
HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \
    CMD wget --no-verbose --tries=1 --spider http://localhost/ || exit 1

CMD ["nginx", "-g", "daemon off;"]
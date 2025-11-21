#!/bin/bash
# Script para garantir que o backend está na rede npm_default
# Execute este script após docker compose up se a conexão não funcionar

set -e

echo "🔍 Verificando conexão do backend à rede npm_default..."

# Verificar se o container existe
if ! docker ps -a --format '{{.Names}}' | grep -q "^marcelobraz-backend$"; then
    echo "❌ Container marcelobraz-backend não encontrado!"
    exit 1
fi

# Verificar se está na rede npm_default
if docker inspect marcelobraz-backend | grep -q '"npm_default"'; then
    echo "✅ Backend já está na rede npm_default"
else
    echo "⚠️  Backend não está na rede npm_default. Conectando..."
    docker network connect npm_default marcelobraz-backend 2>/dev/null || echo "⚠️  Tentativa de conexão falhou (pode já estar conectado)"
fi

# Verificar novamente
if docker inspect marcelobraz-backend | grep -q '"npm_default"'; then
    echo "✅ Backend conectado à rede npm_default com sucesso!"
    docker inspect marcelobraz-backend | grep -A 5 '"npm_default"' | grep "IPAddress" || true
else
    echo "❌ Falha ao conectar backend à rede npm_default"
    exit 1
fi


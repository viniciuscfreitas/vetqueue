#!/bin/bash

MINUTES=${1:-5}

echo "🔍 Buscando erros nos últimos $MINUTES minutos..."
echo ""

docker-compose logs --since=${MINUTES}m backend | grep -i "error\|exception\|✗" | tail -20

ERROR_COUNT=$(docker-compose logs --since=${MINUTES}m backend | grep -ic "error\|✗")

echo ""
if [ "$ERROR_COUNT" -gt 0 ]; then
  echo "⚠️  Total de erros encontrados: $ERROR_COUNT"
else
  echo "✅ Nenhum erro encontrado!"
fi


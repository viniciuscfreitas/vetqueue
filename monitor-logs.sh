#!/bin/bash

echo "🔍 Monitorando logs do VetQueue em tempo real..."
echo "Press Ctrl+C to stop"
echo ""

# Cores para output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Monitora logs e destaca erros
docker-compose logs -f backend | while read line; do
  if echo "$line" | grep -qi "error\|✗"; then
    echo -e "${RED}$line${NC}"
  elif echo "$line" | grep -qi "warn\|⚠"; then
    echo -e "${YELLOW}$line${NC}"
  elif echo "$line" | grep -qi "✓"; then
    echo -e "${GREEN}$line${NC}"
  else
    echo "$line"
  fi
done



#!/bin/bash
# Script de Deploy para Produção - VetQueue
# Uso: ./deploy.sh [start|stop|restart|logs|status]

set -e

# Cores para output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Função para log
log() {
    echo -e "${BLUE}[$(date +'%Y-%m-%d %H:%M:%S')]${NC} $1"
}

error() {
    echo -e "${RED}[ERROR]${NC} $1" >&2
}

success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

# Verificar se Docker está instalado
check_docker() {
    if ! command -v docker &> /dev/null; then
        error "Docker não está instalado. Instale o Docker primeiro."
        exit 1
    fi
    
    if ! command -v docker-compose &> /dev/null; then
        error "Docker Compose não está instalado. Instale o Docker Compose primeiro."
        exit 1
    fi
}

# Verificar arquivo de ambiente
check_env() {
    if [ ! -f ".env.production" ]; then
        error "Arquivo .env.production não encontrado!"
        error "Copie .env.production para .env e configure as variáveis."
        exit 1
    fi
    
    # Copiar .env.production para .env se necessário
    if [ ! -f ".env" ]; then
        log "Copiando .env.production para .env..."
        cp .env.production .env
        warning "Configure as variáveis em .env antes de continuar!"
    fi
}

# Gerar chave JWT segura se não existir
generate_jwt_key() {
    if ! grep -q "JWT_SECRET_KEY=" .env || grep -q "your_super_secret_jwt_key_here" .env; then
        log "Gerando chave JWT segura..."
        JWT_KEY=$(openssl rand -hex 32 2>/dev/null || python3 -c "import secrets; print(secrets.token_hex(32))")
        sed -i "s/JWT_SECRET_KEY=.*/JWT_SECRET_KEY=$JWT_KEY/" .env
        success "Chave JWT gerada automaticamente"
    fi
}

# Iniciar serviços
start_services() {
    log "Iniciando serviços VetQueue..."
    
    # Parar serviços existentes
    docker-compose -f docker-compose.prod.yml down 2>/dev/null || true
    
    # Build das imagens
    log "Construindo imagens Docker..."
    docker-compose -f docker-compose.prod.yml build --no-cache
    
    # Iniciar serviços
    log "Iniciando containers..."
    docker-compose -f docker-compose.prod.yml up -d
    
    # Aguardar serviços ficarem prontos
    log "Aguardando serviços ficarem prontos..."
    sleep 30
    
    # Verificar status
    if docker-compose -f docker-compose.prod.yml ps | grep -q "Up"; then
        success "Serviços iniciados com sucesso!"
        log "Frontend: http://localhost:3000"
        log "Backend API: http://localhost:8000"
        log "PostgreSQL: localhost:5432"
    else
        error "Falha ao iniciar serviços"
        docker-compose -f docker-compose.prod.yml logs
        exit 1
    fi
}

# Parar serviços
stop_services() {
    log "Parando serviços VetQueue..."
    docker-compose -f docker-compose.prod.yml down
    success "Serviços parados"
}

# Reiniciar serviços
restart_services() {
    log "Reiniciando serviços VetQueue..."
    stop_services
    sleep 5
    start_services
}

# Mostrar logs
show_logs() {
    docker-compose -f docker-compose.prod.yml logs -f
}

# Mostrar status
show_status() {
    log "Status dos serviços:"
    docker-compose -f docker-compose.prod.yml ps
}

# Função principal
main() {
    case "${1:-start}" in
        start)
            check_docker
            check_env
            generate_jwt_key
            start_services
            ;;
        stop)
            stop_services
            ;;
        restart)
            restart_services
            ;;
        logs)
            show_logs
            ;;
        status)
            show_status
            ;;
        *)
            echo "Uso: $0 [start|stop|restart|logs|status]"
            echo ""
            echo "Comandos:"
            echo "  start   - Iniciar todos os serviços"
            echo "  stop    - Parar todos os serviços"
            echo "  restart - Reiniciar todos os serviços"
            echo "  logs    - Mostrar logs em tempo real"
            echo "  status  - Mostrar status dos containers"
            exit 1
            ;;
    esac
}

# Executar função principal
main "$@"

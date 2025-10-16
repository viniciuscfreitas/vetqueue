@echo off
REM Script de Deploy para Produção - VetQueue (Windows)
REM Uso: deploy.bat [start|stop|restart|logs|status]

setlocal enabledelayedexpansion

REM Cores (limitadas no Windows)
set "RED=[91m"
set "GREEN=[92m"
set "YELLOW=[93m"
set "BLUE=[94m"
set "NC=[0m"

REM Função para log
:log
echo %BLUE%[%date% %time%]%NC% %~1
goto :eof

:error
echo %RED%[ERROR]%NC% %~1 >&2
goto :eof

:success
echo %GREEN%[SUCCESS]%NC% %~1
goto :eof

:warning
echo %YELLOW%[WARNING]%NC% %~1
goto :eof

REM Verificar se Docker está instalado
:check_docker
docker --version >nul 2>&1
if errorlevel 1 (
    call :error "Docker não está instalado. Instale o Docker Desktop primeiro."
    exit /b 1
)

docker-compose --version >nul 2>&1
if errorlevel 1 (
    call :error "Docker Compose não está instalado. Instale o Docker Desktop primeiro."
    exit /b 1
)
goto :eof

REM Verificar arquivo de ambiente
:check_env
if not exist ".env.production" (
    call :error "Arquivo .env.production não encontrado!"
    call :error "Copie .env.production para .env e configure as variáveis."
    exit /b 1
)

REM Copiar .env.production para .env se necessário
if not exist ".env" (
    call :log "Copiando .env.production para .env..."
    copy ".env.production" ".env" >nul
    call :warning "Configure as variáveis em .env antes de continuar!"
)
goto :eof

REM Gerar chave JWT segura se não existir
:generate_jwt_key
findstr /C:"JWT_SECRET_KEY=" .env | findstr /C:"your_super_secret_jwt_key_here" >nul
if not errorlevel 1 (
    call :log "Gerando chave JWT segura..."
    python -c "import secrets; print('JWT_SECRET_KEY=' + secrets.token_hex(32))" > temp_jwt.txt
    for /f "tokens=*" %%i in (temp_jwt.txt) do set JWT_KEY=%%i
    del temp_jwt.txt
    powershell -Command "(Get-Content .env) -replace 'JWT_SECRET_KEY=.*', '!JWT_KEY!' | Set-Content .env"
    call :success "Chave JWT gerada automaticamente"
)
goto :eof

REM Iniciar serviços
:start_services
call :log "Iniciando serviços VetQueue..."

REM Parar serviços existentes
docker-compose -f docker-compose.prod.yml down >nul 2>&1

REM Build das imagens
call :log "Construindo imagens Docker..."
docker-compose -f docker-compose.prod.yml build --no-cache

REM Iniciar serviços
call :log "Iniciando containers..."
docker-compose -f docker-compose.prod.yml up -d

REM Aguardar serviços ficarem prontos
call :log "Aguardando serviços ficarem prontos..."
timeout /t 30 /nobreak >nul

REM Verificar status
docker-compose -f docker-compose.prod.yml ps | findstr "Up" >nul
if not errorlevel 1 (
    call :success "Serviços iniciados com sucesso!"
    call :log "Frontend: http://localhost:3000"
    call :log "Backend API: http://localhost:8000"
    call :log "PostgreSQL: localhost:5432"
) else (
    call :error "Falha ao iniciar serviços"
    docker-compose -f docker-compose.prod.yml logs
    exit /b 1
)
goto :eof

REM Parar serviços
:stop_services
call :log "Parando serviços VetQueue..."
docker-compose -f docker-compose.prod.yml down
call :success "Serviços parados"
goto :eof

REM Reiniciar serviços
:restart_services
call :log "Reiniciando serviços VetQueue..."
call :stop_services
timeout /t 5 /nobreak >nul
call :start_services
goto :eof

REM Mostrar logs
:show_logs
docker-compose -f docker-compose.prod.yml logs -f
goto :eof

REM Mostrar status
:show_status
call :log "Status dos serviços:"
docker-compose -f docker-compose.prod.yml ps
goto :eof

REM Função principal
:main
if "%1"=="" set "1=start"

if "%1"=="start" (
    call :check_docker
    call :check_env
    call :generate_jwt_key
    call :start_services
) else if "%1"=="stop" (
    call :stop_services
) else if "%1"=="restart" (
    call :restart_services
) else if "%1"=="logs" (
    call :show_logs
) else if "%1"=="status" (
    call :show_status
) else (
    echo Uso: %0 [start^|stop^|restart^|logs^|status]
    echo.
    echo Comandos:
    echo   start   - Iniciar todos os serviços
    echo   stop    - Parar todos os serviços
    echo   restart - Reiniciar todos os serviços
    echo   logs    - Mostrar logs em tempo real
    echo   status  - Mostrar status dos containers
    exit /b 1
)

REM Executar função principal
call :main %*

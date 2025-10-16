@echo off
echo ========================================
echo   VetQueue - Sistema Integrado
echo ========================================
echo.
echo Iniciando servidores...
echo.

echo [1/4] Iniciando PostgreSQL...
docker-compose up -d postgres
if %errorlevel% neq 0 (
    echo ERRO: Falha ao iniciar PostgreSQL
    pause
    exit /b 1
)
echo ✅ PostgreSQL iniciado

echo.
echo [2/4] Aguardando PostgreSQL ficar pronto...
timeout /t 5 /nobreak >nul

echo.
echo [3/5] Aplicando migrations do banco...
cd backend
python -m alembic upgrade head
if %errorlevel% neq 0 (
    echo AVISO: Falha ao aplicar migrations (banco pode não existir ainda)
    echo Continuando...
)
echo ✅ Migrations aplicadas

echo.
echo [4/5] Criando usuário administrador...
python scripts/create_admin_user.py
if %errorlevel% neq 0 (
    echo AVISO: Falha ao criar usuário admin
    echo Continuando...
)
echo ✅ Usuário admin criado

echo.
echo [5/5] Iniciando Backend (FastAPI)...
start "VetQueue Backend" cmd /k "cd backend && python run.py"

REM Aguardar 3 segundos
timeout /t 3 /nobreak >nul

REM Iniciar frontend em nova janela
echo [5/4] Iniciando Frontend (Vite)...
start "VetQueue Frontend" cmd /k "cd frontend && npm run dev"

echo.
echo ========================================
echo   Servidores iniciados!
echo ========================================
echo.
echo Backend:  http://localhost:8000
echo Frontend: http://localhost:5173
echo Docs API: http://localhost:8000/docs
echo.
echo Pressione qualquer tecla para abrir o navegador...
pause >nul

REM Abrir navegador
start http://localhost:5173

echo.
echo Sistema em execucao. Feche as janelas dos servidores para parar.
echo.
pause


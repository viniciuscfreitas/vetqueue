"""
VetQueue Backend - Sistema de Gerenciamento de Fila Veterinária

Ponto de entrada da aplicação FastAPI seguindo Arquitetura Hexagonal.
"""

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from vetqueue.infrastructure.api.routes import (
    fila_router,
    pacientes_router,
)
from vetqueue.infrastructure.api.auth_routes import auth_router
from vetqueue.infrastructure.api.websocket_routes import websocket_router
from vetqueue.application.event_handlers import register_event_handlers
from vetqueue.infrastructure.persistence.database import close_db, init_db

# Criação da aplicação FastAPI
app = FastAPI(
    title="VetQueue API",
    description="API REST para gerenciamento de fila de atendimento veterinário",
    version="0.1.0",
    docs_url="/docs",
    redoc_url="/redoc",
)

# Configuração do CORS (permitir requisições do frontend)
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5173",  # Vite dev server
        "http://localhost:5174",  # Vite dev server (porta alternativa)
        "http://localhost:3000",  # Possível porta alternativa
        "http://127.0.0.1:5173",
        "http://127.0.0.1:5174",
        "http://127.0.0.1:3000",
    ],
    allow_credentials=True,
    allow_methods=["*"],  # Permite todos os métodos (GET, POST, PUT, DELETE, etc.)
    allow_headers=["*"],  # Permite todos os headers
)

# Registro dos routers
app.include_router(auth_router)
app.include_router(fila_router)
app.include_router(pacientes_router)
app.include_router(websocket_router)  # WebSocket routes


# Health check endpoint
@app.get("/", tags=["Health"])
async def root():
    """
    Endpoint raiz - health check da API.
    """
    return {
        "status": "healthy",
        "service": "VetQueue API",
        "version": "0.1.0",
        "docs": "/docs",
    }


# Evento de startup (opcional - para debug)
@app.on_event("startup")
async def startup_event():
    """Executado quando a aplicação inicia"""
    # Inicializa o banco de dados
    await init_db()
    
    # Registra os event handlers para Domain Events
    register_event_handlers()
    
    print("🚀 VetQueue API iniciada com sucesso!")
    print("📚 Documentação disponível em: http://localhost:8000/docs")
    print("🔌 WebSocket disponível em: ws://localhost:8000/ws/fila/default")
    print("🗄️  Database: PostgreSQL conectado")


# Evento de shutdown (opcional - para cleanup)
@app.on_event("shutdown")
async def shutdown_event():
    """Executado quando a aplicação é encerrada"""
    # Fecha conexões do banco de dados
    await close_db()
    print("🛑 VetQueue API encerrada")


if __name__ == "__main__":
    import uvicorn
    
    # Configuração para execução direta (python main.py)
    uvicorn.run(
        "main:app",
        host="0.0.0.0",
        port=8000,
        reload=True,  # Auto-reload em desenvolvimento
        log_level="info",
    )


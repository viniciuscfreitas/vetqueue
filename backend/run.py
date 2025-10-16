"""
Script de inicialização rápida do VetQueue Backend

Uso:
    python run.py
"""

import uvicorn

if __name__ == "__main__":
    print("🚀 Iniciando VetQueue Backend...")
    print("📚 Documentação: http://localhost:8000/docs")
    print("🔄 Auto-reload ativado (modo desenvolvimento)")
    print()
    
    uvicorn.run(
        "main:app",
        host="0.0.0.0",
        port=8000,
        reload=True,
        log_level="info",
    )


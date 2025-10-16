"""Script para executar testes com PostgreSQL"""

import asyncio
import subprocess
import sys
from pathlib import Path

# Adiciona o diretório backend ao path
backend_dir = Path(__file__).parent.parent
sys.path.insert(0, str(backend_dir))


async def main():
    """Executa os testes de integração com PostgreSQL"""
    print("🧪 Iniciando testes de integração com PostgreSQL...")
    
    try:
        # Executar pytest com configurações específicas
        result = subprocess.run([
            "python", "-m", "pytest", 
            "tests/integration/",
            "-v",
            "--tb=short",
            "--asyncio-mode=auto"
        ], cwd=backend_dir)
        
        if result.returncode == 0:
            print("✅ Todos os testes passaram!")
        else:
            print("❌ Alguns testes falharam")
            sys.exit(1)
            
    except Exception as e:
        print(f"❌ Erro ao executar testes: {e}")
        sys.exit(1)


if __name__ == "__main__":
    asyncio.run(main())

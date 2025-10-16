"""Script para inicializar o banco de dados e aplicar migrations"""

import asyncio
import sys
from pathlib import Path

# Adiciona o diretório backend ao path para imports
backend_dir = Path(__file__).parent.parent
sys.path.insert(0, str(backend_dir))

from vetqueue.infrastructure.persistence.database import init_db


async def main():
    """Inicializa o banco de dados"""
    print("🗄️  Inicializando banco de dados...")
    
    try:
        await init_db()
        print("✅ Banco de dados inicializado com sucesso!")
    except Exception as e:
        print(f"❌ Erro ao inicializar banco de dados: {e}")
        sys.exit(1)


if __name__ == "__main__":
    asyncio.run(main())

"""Script para criar usuário administrador inicial"""

import asyncio
import sys
from pathlib import Path

# Adiciona o diretório backend ao path para imports
backend_dir = Path(__file__).parent.parent
sys.path.insert(0, str(backend_dir))

from vetqueue.infrastructure.persistence.database import get_async_session
from vetqueue.infrastructure.persistence.user_repository import PostgresUserRepository
from vetqueue.infrastructure.auth.jwt_service import JWTService
from vetqueue.domain.user_entities import User


async def create_admin_user():
    """Cria o usuário administrador inicial"""
    print("👤 Criando usuário administrador inicial...")
    
    try:
        # Obter sessão do banco
        async for session in get_async_session():
            repository = PostgresUserRepository(session)
            
            # Verificar se já existe usuário admin
            existing_admin = await repository.get_by_username("admin")
            if existing_admin:
                print("✅ Usuário administrador já existe")
                return
            
            # Criar hash da senha
            hashed_password = JWTService.get_password_hash("admin123")
            
            # Criar usuário admin
            admin_user = User(
                username="admin",
                email="admin@vetqueue.com",
                hashed_password=hashed_password,
                full_name="Administrador do Sistema",
                is_active=True,
                is_admin=True
            )
            
            # Salvar no banco
            created_user = await repository.create(admin_user)
            
            print("✅ Usuário administrador criado com sucesso!")
            print(f"   Username: {created_user.username}")
            print(f"   Email: {created_user.email}")
            print(f"   Senha: admin123")
            print(f"   ID: {created_user.id}")
            
            break  # Sair do loop async
            
    except Exception as e:
        print(f"❌ Erro ao criar usuário administrador: {e}")
        sys.exit(1)


if __name__ == "__main__":
    asyncio.run(create_admin_user())

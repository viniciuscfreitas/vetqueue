"""PostgreSQL User Repository - Implementação concreta do UserRepositoryPort"""

from typing import List, Optional
from uuid import UUID

from sqlalchemy import select
from sqlalchemy.exc import IntegrityError
from sqlalchemy.ext.asyncio import AsyncSession

from ...domain.user_entities import User
from ...domain.user_repositories import UserRepositoryPort
from .user_mappers import model_to_user, models_to_users, user_to_model
from .user_models import UserModel


class PostgresUserRepository(UserRepositoryPort):
    """
    Implementação PostgreSQL do repositório de usuários.
    
    Esta é uma implementação de "Adaptador" na Arquitetura Hexagonal.
    Implementa a "Porta" (UserRepositoryPort) definida no domínio.
    
    Usa transações explícitas para operações críticas e SQLAlchemy 2.0 style.
    """
    
    def __init__(self, session: AsyncSession):
        """
        Inicializa o repositório com uma sessão do SQLAlchemy.
        
        Args:
            session: Sessão async do SQLAlchemy
        """
        self.session = session
    
    async def create(self, user: User) -> User:
        """
        Cria um novo usuário.
        
        Args:
            user: Entidade User a ser criada
            
        Returns:
            O usuário criado
            
        Raises:
            ValueError: Se houver erro de integridade (username/email duplicado)
        """
        try:
            async with self.session.begin():
                model = user_to_model(user)
                self.session.add(model)
                await self.session.flush()
                return model_to_user(model)
        except IntegrityError as e:
            if "username" in str(e):
                raise ValueError(f"Username '{user.username}' já está em uso")
            elif "email" in str(e):
                raise ValueError(f"Email '{user.email}' já está em uso")
            else:
                raise ValueError(f"Erro ao criar usuário: {str(e)}")
    
    async def get_by_id(self, user_id: UUID) -> Optional[User]:
        """
        Busca um usuário pelo ID.
        
        Args:
            user_id: UUID do usuário
            
        Returns:
            Usuário encontrado ou None
        """
        stmt = select(UserModel).where(UserModel.id == user_id)
        result = await self.session.execute(stmt)
        model = result.scalar_one_or_none()
        
        return model_to_user(model) if model else None
    
    async def get_by_username(self, username: str) -> Optional[User]:
        """
        Busca um usuário pelo username.
        
        Args:
            username: Nome de usuário
            
        Returns:
            Usuário encontrado ou None
        """
        stmt = select(UserModel).where(UserModel.username == username)
        result = await self.session.execute(stmt)
        model = result.scalar_one_or_none()
        
        return model_to_user(model) if model else None
    
    async def get_by_email(self, email: str) -> Optional[User]:
        """
        Busca um usuário pelo email.
        
        Args:
            email: Email do usuário
            
        Returns:
            Usuário encontrado ou None
        """
        stmt = select(UserModel).where(UserModel.email == email)
        result = await self.session.execute(stmt)
        model = result.scalar_one_or_none()
        
        return model_to_user(model) if model else None
    
    async def update(self, user: User) -> User:
        """
        Atualiza os dados de um usuário existente.
        
        Args:
            user: Entidade User com dados atualizados
            
        Returns:
            O usuário atualizado
            
        Raises:
            ValueError: Se o usuário não existir
        """
        async with self.session.begin():
            # Usar merge para operação atômica e performática
            model = user_to_model(user)
            merged_model = await self.session.merge(model)
            await self.session.flush()
            return model_to_user(merged_model)
    
    async def delete(self, user_id: UUID) -> None:
        """
        Remove um usuário do sistema.
        
        Args:
            user_id: UUID do usuário a ser removido
            
        Raises:
            ValueError: Se o usuário não existir
        """
        from sqlalchemy import delete
        
        async with self.session.begin():
            # DELETE direto - mais performático e atômico
            stmt = delete(UserModel).where(UserModel.id == user_id)
            result = await self.session.execute(stmt)
            
            if result.rowcount == 0:
                raise ValueError(f"Usuário com ID {user_id} não encontrado")
    
    async def list_all(self) -> List[User]:
        """
        Lista todos os usuários (para administração).
        
        Returns:
            Lista com todos os usuários
        """
        stmt = select(UserModel)
        result = await self.session.execute(stmt)
        models = result.scalars().all()
        
        return models_to_users(list(models))
    
    async def list_active(self) -> List[User]:
        """
        Lista todos os usuários ativos.
        
        Returns:
            Lista com usuários ativos
        """
        stmt = select(UserModel).where(UserModel.is_active == True)
        result = await self.session.execute(stmt)
        models = result.scalars().all()
        
        return models_to_users(list(models))

"""User Repository Ports - Interfaces abstratas para acesso a dados de usuários"""

from abc import ABC, abstractmethod
from typing import List, Optional
from uuid import UUID

from .user_entities import User


class UserRepositoryPort(ABC):
    """
    Port (interface) para o repositório de usuários.
    
    Esta é uma "Porta" na Arquitetura Hexagonal - define o contrato
    que qualquer adaptador de persistência deve implementar.
    
    O domínio depende apenas desta abstração, nunca de implementações concretas.
    """
    
    @abstractmethod
    async def create(self, user: User) -> User:
        """
        Cria um novo usuário.
        
        Args:
            user: Entidade User a ser criada
            
        Returns:
            O usuário criado (pode conter campos atualizados pelo repositório)
        """
        pass
    
    @abstractmethod
    async def get_by_id(self, user_id: UUID) -> Optional[User]:
        """
        Busca um usuário pelo ID.
        
        Args:
            user_id: UUID do usuário
            
        Returns:
            Usuário encontrado ou None
        """
        pass
    
    @abstractmethod
    async def get_by_username(self, username: str) -> Optional[User]:
        """
        Busca um usuário pelo username.
        
        Args:
            username: Nome de usuário
            
        Returns:
            Usuário encontrado ou None
        """
        pass
    
    @abstractmethod
    async def get_by_email(self, email: str) -> Optional[User]:
        """
        Busca um usuário pelo email.
        
        Args:
            email: Email do usuário
            
        Returns:
            Usuário encontrado ou None
        """
        pass
    
    @abstractmethod
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
        pass
    
    @abstractmethod
    async def delete(self, user_id: UUID) -> None:
        """
        Remove um usuário do sistema.
        
        Args:
            user_id: UUID do usuário a ser removido
            
        Raises:
            ValueError: Se o usuário não existir
        """
        pass
    
    @abstractmethod
    async def list_all(self) -> List[User]:
        """
        Lista todos os usuários (para administração).
        
        Returns:
            Lista com todos os usuários
        """
        pass
    
    @abstractmethod
    async def list_active(self) -> List[User]:
        """
        Lista todos os usuários ativos.
        
        Returns:
            Lista com usuários ativos
        """
        pass

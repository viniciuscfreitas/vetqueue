"""Auth Use Cases - Casos de uso de autenticação"""

from typing import Optional
from uuid import UUID

from ..domain.user_entities import User
from ..domain.user_repositories import UserRepositoryPort
from ..infrastructure.auth.jwt_service import JWTService


class AuthUseCase:
    """Caso de uso base para autenticação"""
    
    def __init__(self, user_repository: UserRepositoryPort):
        """
        Inicializa o caso de uso com o repositório de usuários.
        
        Args:
            user_repository: Repositório de usuários
        """
        self.user_repository = user_repository


class LoginUseCase(AuthUseCase):
    """Caso de uso para login de usuário"""
    
    async def execute(self, username: str, password: str) -> dict:
        """
        Executa o login de um usuário.
        
        Args:
            username: Nome de usuário
            password: Senha em texto plano
            
        Returns:
            Dicionário com tokens e dados do usuário
            
        Raises:
            ValueError: Se as credenciais forem inválidas
        """
        # Buscar usuário pelo username
        user = await self.user_repository.get_by_username(username)
        if not user:
            raise ValueError("Credenciais inválidas")
        
        # Verificar se o usuário está ativo
        if not user.can_login():
            raise ValueError("Usuário inativo")
        
        # Verificar senha
        if not JWTService.verify_password(password, user.hashed_password):
            raise ValueError("Credenciais inválidas")
        
        # Atualizar último login
        user.update_last_login()
        await self.user_repository.update(user)
        
        # Criar tokens
        tokens = JWTService.create_token_pair(str(user.id), user.username)
        
        return {
            **tokens,
            "user": {
                "id": str(user.id),
                "username": user.username,
                "email": user.email,
                "full_name": user.full_name,
                "is_admin": user.is_admin
            }
        }


class RefreshTokenUseCase(AuthUseCase):
    """Caso de uso para renovação de token"""
    
    async def execute(self, refresh_token: str) -> dict:
        """
        Executa a renovação de token usando refresh token.
        
        Args:
            refresh_token: Token de refresh
            
        Returns:
            Dicionário com novo access token
            
        Raises:
            ValueError: Se o refresh token for inválido
        """
        # Verificar refresh token
        payload = JWTService.verify_token(refresh_token, "refresh")
        if not payload:
            raise ValueError("Refresh token inválido ou expirado")
        
        # Buscar usuário
        user_id = payload.get("sub")
        if not user_id:
            raise ValueError("Refresh token inválido")
        
        user = await self.user_repository.get_by_id(UUID(user_id))
        if not user or not user.can_login():
            raise ValueError("Usuário não encontrado ou inativo")
        
        # Criar novo access token
        access_token = JWTService.create_access_token({
            "sub": str(user.id),
            "username": user.username
        })
        
        return {
            "access_token": access_token,
            "token_type": "bearer",
            "expires_in": 30 * 60  # 30 minutos em segundos
        }


class RegisterUseCase(AuthUseCase):
    """Caso de uso para registro de usuário"""
    
    async def execute(self, username: str, email: str, password: str, full_name: Optional[str] = None) -> dict:
        """
        Executa o registro de um novo usuário.
        
        Args:
            username: Nome de usuário
            email: Email do usuário
            password: Senha em texto plano
            full_name: Nome completo (opcional)
            
        Returns:
            Dicionário com dados do usuário criado
            
        Raises:
            ValueError: Se houver erro na criação do usuário
        """
        # Verificar se username já existe
        existing_user = await self.user_repository.get_by_username(username)
        if existing_user:
            raise ValueError("Username já está em uso")
        
        # Verificar se email já existe
        existing_email = await self.user_repository.get_by_email(email)
        if existing_email:
            raise ValueError("Email já está em uso")
        
        # Criar hash da senha
        hashed_password = JWTService.get_password_hash(password)
        
        # Criar usuário
        user = User(
            username=username,
            email=email,
            hashed_password=hashed_password,
            full_name=full_name,
            is_active=True,
            is_admin=False
        )
        
        # Salvar no repositório
        created_user = await self.user_repository.create(user)
        
        return {
            "id": str(created_user.id),
            "username": created_user.username,
            "email": created_user.email,
            "full_name": created_user.full_name,
            "is_admin": created_user.is_admin,
            "created_at": created_user.last_login
        }


class GetCurrentUserUseCase(AuthUseCase):
    """Caso de uso para obter dados do usuário atual"""
    
    async def execute(self, user_id: UUID) -> Optional[dict]:
        """
        Executa a busca de dados do usuário atual.
        
        Args:
            user_id: ID do usuário
            
        Returns:
            Dados do usuário ou None se não encontrado
        """
        user = await self.user_repository.get_by_id(user_id)
        if not user:
            return None
        
        return {
            "id": str(user.id),
            "username": user.username,
            "email": user.email,
            "full_name": user.full_name,
            "is_admin": user.is_admin,
            "is_active": user.is_active,
            "last_login": user.last_login
        }

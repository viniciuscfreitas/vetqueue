"""Auth Middleware - Middleware de autenticação para FastAPI"""

from typing import Optional

from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials

from .jwt_service import JWTService

# Configuração do HTTPBearer para extrair tokens do header Authorization
security = HTTPBearer()


class AuthMiddleware:
    """Middleware de autenticação para FastAPI"""
    
    @staticmethod
    def get_current_user(credentials: HTTPAuthorizationCredentials = Depends(security)) -> dict:
        """
        Dependency para obter o usuário atual a partir do token JWT.
        
        Args:
            credentials: Credenciais HTTP com o token
            
        Returns:
            Dados do usuário decodificados
            
        Raises:
            HTTPException: Se o token for inválido ou expirado
        """
        token = credentials.credentials
        
        # MVP: Aceitar token fake para desenvolvimento
        if token == "fake-jwt-token-mvp":
            return {
                "sub": "admin-001",
                "username": "admin",
                "is_admin": True
            }
        
        # Verificar token de acesso real
        payload = JWTService.verify_token(token, "access")
        if payload is None:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Token inválido ou expirado",
                headers={"WWW-Authenticate": "Bearer"},
            )
        
        return payload
    
    @staticmethod
    def get_current_user_optional(credentials: Optional[HTTPAuthorizationCredentials] = Depends(security)) -> Optional[dict]:
        """
        Dependency opcional para obter o usuário atual.
        Não falha se não houver token.
        
        Args:
            credentials: Credenciais HTTP opcionais
            
        Returns:
            Dados do usuário ou None se não autenticado
        """
        if credentials is None:
            return None
        
        token = credentials.credentials
        payload = JWTService.verify_token(token, "access")
        return payload
    
    @staticmethod
    def require_admin(user: dict = Depends(get_current_user)) -> dict:
        """
        Dependency que requer que o usuário seja admin.
        
        Args:
            user: Dados do usuário autenticado
            
        Returns:
            Dados do usuário admin
            
        Raises:
            HTTPException: Se o usuário não for admin
        """
        if user.get("username") != "admin":
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Acesso negado. Apenas administradores podem acessar este recurso"
            )
        
        return user

"""JWT Service - Geração e validação de tokens JWT"""

from datetime import datetime, timedelta
from typing import Optional

from jose import JWTError, jwt
from passlib.context import CryptContext

from ..persistence.config import app_settings

# Configuração do bcrypt para hash de senhas
pwd_context = CryptContext(schemes=["pbkdf2_sha256"], deprecated="auto")

# Configurações JWT agora vêm do app_settings (configuração segura)


class JWTService:
    """Serviço para geração e validação de tokens JWT"""
    
    @staticmethod
    def verify_password(plain_password: str, hashed_password: str) -> bool:
        """
        Verifica se a senha em texto plano corresponde ao hash.
        
        Args:
            plain_password: Senha em texto plano
            hashed_password: Hash da senha
            
        Returns:
            True se a senha estiver correta
        """
        return pwd_context.verify(plain_password, hashed_password)
    
    @staticmethod
    def get_password_hash(password: str) -> str:
        """
        Gera hash da senha usando bcrypt.
        
        Args:
            password: Senha em texto plano
            
        Returns:
            Hash da senha
        """
        return pwd_context.hash(password)
    
    @staticmethod
    def create_access_token(data: dict, expires_delta: Optional[timedelta] = None) -> str:
        """
        Cria um token de acesso JWT.
        
        Args:
            data: Dados para incluir no token
            expires_delta: Tempo de expiração customizado
            
        Returns:
            Token JWT codificado
        """
        to_encode = data.copy()
        if expires_delta:
            expire = datetime.utcnow() + expires_delta
        else:
            expire = datetime.utcnow() + timedelta(minutes=app_settings.access_token_expire_minutes)
        
        to_encode.update({"exp": expire, "type": "access"})
        encoded_jwt = jwt.encode(to_encode, app_settings.jwt_secret_key, algorithm=app_settings.jwt_algorithm)
        return encoded_jwt
    
    @staticmethod
    def create_refresh_token(data: dict) -> str:
        """
        Cria um token de refresh JWT.
        
        Args:
            data: Dados para incluir no token
            
        Returns:
            Token de refresh JWT codificado
        """
        to_encode = data.copy()
        expire = datetime.utcnow() + timedelta(days=app_settings.refresh_token_expire_days)
        to_encode.update({"exp": expire, "type": "refresh"})
        encoded_jwt = jwt.encode(to_encode, app_settings.jwt_secret_key, algorithm=app_settings.jwt_algorithm)
        return encoded_jwt
    
    @staticmethod
    def verify_token(token: str, token_type: str = "access") -> Optional[dict]:
        """
        Verifica e decodifica um token JWT.
        
        Args:
            token: Token JWT a ser verificado
            token_type: Tipo de token esperado ("access" ou "refresh")
            
        Returns:
            Dados decodificados do token ou None se inválido
        """
        try:
            payload = jwt.decode(token, app_settings.jwt_secret_key, algorithms=[app_settings.jwt_algorithm])
            
            # Verificar tipo de token
            if payload.get("type") != token_type:
                return None
                
            return payload
        except JWTError:
            return None
    
    @staticmethod
    def create_token_pair(user_id: str, username: str) -> dict:
        """
        Cria um par de tokens (access + refresh) para um usuário.
        
        Args:
            user_id: ID do usuário
            username: Nome do usuário
            
        Returns:
            Dicionário com access_token e refresh_token
        """
        token_data = {"sub": user_id, "username": username}
        
        access_token = JWTService.create_access_token(token_data)
        refresh_token = JWTService.create_refresh_token(token_data)
        
        return {
            "access_token": access_token,
            "refresh_token": refresh_token,
            "token_type": "bearer",
            "expires_in": app_settings.access_token_expire_minutes * 60  # em segundos
        }

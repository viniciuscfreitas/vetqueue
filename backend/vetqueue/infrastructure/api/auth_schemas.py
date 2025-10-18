"""Auth Schemas - Schemas Pydantic para autenticação"""

from typing import Optional
from uuid import UUID

from pydantic import BaseModel, Field


class LoginRequest(BaseModel):
    """Schema para requisição de login"""
    username: str = Field(..., min_length=3, max_length=50, description="Nome de usuário")
    password: str = Field(..., min_length=4, description="Senha")


class RegisterRequest(BaseModel):
    """Schema para requisição de registro"""
    username: str = Field(..., min_length=3, max_length=50, description="Nome de usuário")
    email: str = Field(..., description="Email do usuário")
    password: str = Field(..., min_length=6, description="Senha")
    full_name: Optional[str] = Field(None, max_length=255, description="Nome completo")


class RefreshTokenRequest(BaseModel):
    """Schema para requisição de refresh token"""
    refresh_token: str = Field(..., description="Token de refresh")


class UserResponse(BaseModel):
    """Schema para resposta de dados do usuário"""
    id: str
    username: str
    email: str
    full_name: Optional[str] = None
    is_admin: bool
    is_active: bool
    last_login: Optional[str] = None


class LoginResponse(BaseModel):
    """Schema para resposta de login"""
    access_token: str
    refresh_token: str
    token_type: str
    expires_in: int
    user: UserResponse


class RefreshTokenResponse(BaseModel):
    """Schema para resposta de refresh token"""
    access_token: str
    token_type: str
    expires_in: int


class RegisterResponse(BaseModel):
    """Schema para resposta de registro"""
    message: str
    user: UserResponse


class ErrorResponse(BaseModel):
    """Schema para resposta de erro"""
    detail: str
    error_code: Optional[str] = None

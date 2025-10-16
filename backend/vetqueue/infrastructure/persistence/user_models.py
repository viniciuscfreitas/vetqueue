"""User Models - Modelos SQLAlchemy para usuários"""

from datetime import datetime
from uuid import UUID

from sqlalchemy import Column, DateTime, String, Boolean, func
from sqlalchemy.dialects.postgresql import UUID as PostgresUUID
from sqlalchemy.ext.declarative import declarative_base

from .models import Base


class UserModel(Base):
    """
    Modelo SQLAlchemy para a tabela de usuários.
    
    Mapeia diretamente para entidades de usuário do sistema.
    """
    __tablename__ = "users"
    
    # Primary Key
    id = Column(PostgresUUID(as_uuid=True), primary_key=True)
    
    # Campos de autenticação
    username = Column(String(50), unique=True, nullable=False, index=True)
    email = Column(String(255), unique=True, nullable=False, index=True)
    hashed_password = Column(String(255), nullable=False)
    
    # Campos de perfil
    full_name = Column(String(255), nullable=True)
    is_active = Column(Boolean, default=True, nullable=False)
    is_admin = Column(Boolean, default=False, nullable=False)
    
    # Campos de auditoria
    created_at = Column(DateTime, server_default=func.now(), nullable=False)
    updated_at = Column(DateTime, server_default=func.now(), onupdate=func.now(), nullable=False)
    last_login = Column(DateTime, nullable=True)
    
    def __repr__(self) -> str:
        return f"<UserModel(id={self.id}, username='{self.username}', is_admin={self.is_admin})>"

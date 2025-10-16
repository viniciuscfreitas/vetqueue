"""User Mappers - Tradução entre entidades de usuário e modelos ORM"""

from typing import List, Optional
from uuid import UUID

from ...domain.user_entities import User
from .user_models import UserModel


def user_to_model(user: User) -> UserModel:
    """
    Converte entidade de domínio → modelo ORM.
    
    Args:
        user: Entidade de domínio User
        
    Returns:
        Modelo SQLAlchemy UserModel
    """
    return UserModel(
        id=user.id,
        username=user.username,
        email=user.email,
        hashed_password=user.hashed_password,
        full_name=user.full_name,
        is_active=user.is_active,
        is_admin=user.is_admin,
        last_login=user.last_login
    )


def model_to_user(model: UserModel) -> User:
    """
    Converte modelo ORM → entidade de domínio.
    
    Args:
        model: Modelo SQLAlchemy UserModel
        
    Returns:
        Entidade de domínio User
    """
    return User(
        id=model.id,
        username=model.username,
        email=model.email,
        hashed_password=model.hashed_password,
        full_name=model.full_name,
        is_active=model.is_active,
        is_admin=model.is_admin,
        last_login=model.last_login
    )


def models_to_users(models: List[UserModel]) -> List[User]:
    """
    Converte lista de modelos ORM → lista de entidades de domínio.
    
    Args:
        models: Lista de modelos SQLAlchemy UserModel
        
    Returns:
        Lista de entidades de domínio User
    """
    return [model_to_user(model) for model in models]

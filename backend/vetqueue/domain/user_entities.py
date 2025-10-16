"""User Entities - Entidades de domínio para usuários"""

from dataclasses import dataclass, field
from datetime import datetime
from typing import Optional
from uuid import UUID, uuid4


@dataclass
class User:
    """
    Entidade User - Representa um usuário do sistema.
    
    Esta é uma entidade de domínio pura, sem dependências de frameworks.
    Contém a lógica de negócio relacionada ao ciclo de vida de um usuário.
    """
    username: str
    email: str
    hashed_password: str
    full_name: Optional[str] = field(default=None)
    is_active: bool = field(default=True)
    is_admin: bool = field(default=False)
    last_login: Optional[datetime] = field(default=None)
    id: UUID = field(default_factory=uuid4)
    
    def __post_init__(self):
        """Validações após inicialização"""
        self._validar_username()
        self._validar_email()
    
    def _validar_username(self) -> None:
        """Valida que o username não está vazio e tem formato válido"""
        if not self.username or not self.username.strip():
            raise ValueError("Username não pode ser vazio")
        
        if len(self.username) < 3:
            raise ValueError("Username deve ter pelo menos 3 caracteres")
        
        if not self.username.replace("_", "").replace("-", "").isalnum():
            raise ValueError("Username deve conter apenas letras, números, _ e -")
    
    def _validar_email(self) -> None:
        """Valida que o email tem formato válido"""
        if not self.email or not self.email.strip():
            raise ValueError("Email não pode ser vazio")
        
        if "@" not in self.email or "." not in self.email.split("@")[-1]:
            raise ValueError("Email deve ter formato válido")
    
    def update_last_login(self) -> None:
        """Atualiza o timestamp do último login"""
        self.last_login = datetime.utcnow()
    
    def activate(self) -> None:
        """Ativa o usuário"""
        self.is_active = True
    
    def deactivate(self) -> None:
        """Desativa o usuário"""
        self.is_active = False
    
    def promote_to_admin(self) -> None:
        """Promove o usuário a administrador"""
        self.is_admin = True
    
    def demote_from_admin(self) -> None:
        """Remove privilégios de administrador"""
        self.is_admin = False
    
    def can_login(self) -> bool:
        """Verifica se o usuário pode fazer login"""
        return self.is_active
    
    def is_administrator(self) -> bool:
        """Verifica se o usuário é administrador"""
        return self.is_admin and self.is_active

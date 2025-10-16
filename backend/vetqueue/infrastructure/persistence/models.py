"""SQLAlchemy Models - Mapeamento ORM das entidades de domínio"""

from datetime import datetime
from uuid import UUID

from sqlalchemy import Column, DateTime, Enum, String, func
from sqlalchemy.dialects.postgresql import UUID as PostgresUUID
from sqlalchemy.ext.declarative import declarative_base

from ...domain.value_objects import StatusPaciente

# Base para todos os modelos SQLAlchemy
Base = declarative_base()


class PacienteModel(Base):
    """
    Modelo SQLAlchemy para a tabela de pacientes.
    
    Mapeia diretamente para a entidade de domínio Paciente.
    Segue o princípio de responsabilidade única: apenas estrutura da tabela.
    """
    __tablename__ = "pacientes"
    
    # Primary Key
    id = Column(PostgresUUID(as_uuid=True), primary_key=True)
    
    # Campos de negócio
    nome_pet = Column(String(255), nullable=False)
    nome_tutor = Column(String(255), nullable=False)
    status = Column(Enum(StatusPaciente), nullable=False)
    sala_atendimento = Column(String(100), nullable=True)
    
    # Campos de auditoria
    created_at = Column(DateTime, server_default=func.now(), nullable=False)
    updated_at = Column(DateTime, server_default=func.now(), onupdate=func.now(), nullable=False)
    
    def __repr__(self) -> str:
        return f"<PacienteModel(id={self.id}, nome_pet='{self.nome_pet}', status={self.status})>"

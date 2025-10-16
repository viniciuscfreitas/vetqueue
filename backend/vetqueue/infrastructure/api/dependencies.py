"""Dependencies - Injeção de Dependências para FastAPI"""

from functools import lru_cache
from typing import AsyncGenerator

from fastapi import Depends
from sqlalchemy.ext.asyncio import AsyncSession

from ...application.use_cases import (
    AdicionarPacienteUseCase,
    ChamarPacienteUseCase,
    FinalizarAtendimentoUseCase,
    ObterFilaUseCase,
)
from ...domain.repositories import FilaRepositoryPort
from ..persistence.database import get_async_session
from ..persistence.memory_repository import InMemoryFilaRepository
from ..persistence.postgres_repository import PostgresFilaRepository


def get_repository(session: AsyncSession = Depends(get_async_session)) -> FilaRepositoryPort:
    """
    Retorna a instância do repositório PostgreSQL.
    
    Args:
        session: Sessão async do SQLAlchemy
        
    Returns:
        PostgresFilaRepository: Repositório PostgreSQL
    """
    return PostgresFilaRepository(session)


def get_memory_repository() -> FilaRepositoryPort:
    """
    Retorna o repositório em memória (para testes).
    
    Returns:
        InMemoryFilaRepository: Repositório em memória
    """
    return InMemoryFilaRepository()


# Use Cases Factories (injetam o repositório automaticamente)

def get_adicionar_paciente_use_case(repository: FilaRepositoryPort = Depends(get_repository)) -> AdicionarPacienteUseCase:
    """Factory para AdicionarPacienteUseCase"""
    return AdicionarPacienteUseCase(repository)


def get_chamar_paciente_use_case(repository: FilaRepositoryPort = Depends(get_repository)) -> ChamarPacienteUseCase:
    """Factory para ChamarPacienteUseCase"""
    return ChamarPacienteUseCase(repository)


def get_finalizar_atendimento_use_case(repository: FilaRepositoryPort = Depends(get_repository)) -> FinalizarAtendimentoUseCase:
    """Factory para FinalizarAtendimentoUseCase"""
    return FinalizarAtendimentoUseCase(repository)


def get_obter_fila_use_case(repository: FilaRepositoryPort = Depends(get_repository)) -> ObterFilaUseCase:
    """Factory para ObterFilaUseCase"""
    return ObterFilaUseCase(repository)


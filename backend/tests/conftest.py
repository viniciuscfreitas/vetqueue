"""Configuração global de testes - Fixtures e Setup"""

import asyncio
import pytest
from sqlalchemy.ext.asyncio import AsyncSession, create_async_engine
from sqlalchemy.pool import NullPool

from vetqueue.infrastructure.persistence.database import get_test_session
from vetqueue.infrastructure.persistence.models import Base
from vetqueue.infrastructure.persistence.config import database_settings


@pytest.fixture(scope="session")
def event_loop():
    """Cria um event loop para toda a sessão de testes."""
    loop = asyncio.new_event_loop()
    yield loop
    loop.close()


@pytest.fixture(scope="session")
async def test_engine():
    """
    Fixture de sessão: Cria engine de teste e executa migrations.
    Executado UMA VEZ para toda a suíte de testes.
    """
    # Engine específico para testes com NullPool
    engine = create_async_engine(
        database_settings.test_database_url,
        echo=False,
        poolclass=NullPool
    )
    
    # Criar todas as tabelas (equivalente a migrations)
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)
    
    yield engine
    
    # Cleanup: dropar todas as tabelas
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.drop_all)
    
    await engine.dispose()


@pytest.fixture(scope="function")
async def db_session(test_engine):
    """
    Fixture de função: Sessão isolada por teste com rollback.
    
    Cada teste roda em uma transação isolada que é revertida ao final,
    garantindo que o banco esteja sempre limpo entre testes.
    """
    # Criar sessão
    async_session = AsyncSession(test_engine, expire_on_commit=False)
    
    # Iniciar transação
    transaction = await async_session.begin()
    
    try:
        yield async_session
    finally:
        # Rollback da transação (limpa todas as mudanças)
        await transaction.rollback()
        await async_session.close()


@pytest.fixture(scope="function")
async def test_repository(db_session):
    """
    Fixture para repositório de teste usando sessão isolada.
    """
    from vetqueue.infrastructure.persistence.postgres_repository import PostgresFilaRepository
    return PostgresFilaRepository(db_session)

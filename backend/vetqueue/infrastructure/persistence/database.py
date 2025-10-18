"""Database Configuration - Engine, Session Factory e Lifecycle"""

from typing import AsyncGenerator

from sqlalchemy.ext.asyncio import AsyncSession, async_sessionmaker, create_async_engine
from sqlalchemy.pool import NullPool
from sqlalchemy.engine import URL

from .config import database_settings
from .models import Base


# Global engine instance
_engine = None
_session_factory = None


def get_async_engine():
    """Get or create the async engine."""
    global _engine
    if _engine is None:
        # Pega a URL string da configuração
        db_url_str = database_settings.database_url
        
        # Cria um objeto URL e remove o parâmetro 'sslmode' se existir
        db_url = URL.create(db_url_str)
        if 'sslmode' in db_url.query:
            del db_url.query['sslmode']
        
        # Converte o objeto URL de volta para string
        clean_db_url = str(db_url)

        _engine = create_async_engine(
            db_url_str,  # Usa a URL diretamente sem modificações
            echo=database_settings.echo_sql,
            pool_size=database_settings.pool_size,
            max_overflow=database_settings.max_overflow,
            # Para testes, usar NullPool para evitar problemas de conexão
            poolclass=NullPool if "test" in database_settings.database_url else None
        )
    return _engine


def get_session_factory():
    """Get or create the session factory."""
    global _session_factory
    if _session_factory is None:
        engine = get_async_engine()
        _session_factory = async_sessionmaker(
            engine,
            class_=AsyncSession,
            expire_on_commit=False
        )
    return _session_factory


async def get_async_session() -> AsyncGenerator[AsyncSession, None]:
    """
    Dependency para obter uma sessão async do banco de dados.
    
    Yields:
        AsyncSession: Sessão do SQLAlchemy para operações de banco
    """
    session_factory = get_session_factory()
    async with session_factory() as session:
        try:
            yield session
        finally:
            await session.close()


async def init_db() -> None:
    """
    Inicializa o banco de dados.
    Cria todas as tabelas definidas nos modelos.
    """
    engine = get_async_engine()
    
    async with engine.begin() as conn:
        # Criar todas as tabelas
        await conn.run_sync(Base.metadata.create_all)
    
    print("Database initialized successfully")


async def close_db() -> None:
    """
    Fecha as conexões do banco de dados.
    """
    global _engine
    if _engine:
        await _engine.dispose()
        _engine = None
        print("✅ Database connections closed")


async def get_test_session() -> AsyncGenerator[AsyncSession, None]:
    """
    Dependency para testes - usa banco de teste.
    
    Yields:
        AsyncSession: Sessão do SQLAlchemy para testes
    """
    # Para testes, criar engine específico com URL de teste
    test_db_url_str = database_settings.test_database_url
    
    # Cria um objeto URL e remove o parâmetro 'sslmode' se existir
    test_db_url = URL.create(test_db_url_str)
    if 'sslmode' in test_db_url.query:
        del test_db_url.query['sslmode']
    
    # Converte o objeto URL de volta para string
    clean_test_db_url = str(test_db_url)
    
    test_engine = create_async_engine(
        clean_test_db_url,  # Usa a string da URL modificada
        echo=False,
        poolclass=NullPool,
        # Passa o argumento 'ssl' diretamente para o asyncpg
        connect_args={"ssl": "prefer"}
    )
    
    test_session_factory = async_sessionmaker(
        test_engine,
        class_=AsyncSession,
        expire_on_commit=False
    )
    
    async with test_session_factory() as session:
        try:
            yield session
        finally:
            await session.close()
            await test_engine.dispose()

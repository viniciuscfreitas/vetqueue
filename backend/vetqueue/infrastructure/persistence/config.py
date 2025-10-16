"""Configuração Type-Safe da Aplicação usando Pydantic Settings"""

from pydantic import Field
from pydantic_settings import BaseSettings


class DatabaseSettings(BaseSettings):
    """Configurações do banco de dados com validação type-safe"""
    
    database_url: str = Field(
        default="postgresql+asyncpg://vetqueue:vetqueue_dev_password@localhost:5432/vetqueue_dev",
        description="URL de conexão com o banco de dados PostgreSQL",
        alias="DATABASE_URL"
    )
    
    test_database_url: str = Field(
        default="postgresql+asyncpg://vetqueue:vetqueue_test_password@localhost:5433/vetqueue_test",
        description="URL de conexão com o banco de dados de testes",
        alias="TEST_DATABASE_URL"
    )
    
    echo_sql: bool = Field(
        default=False,
        description="Se deve exibir queries SQL no console (debug)"
    )
    
    pool_size: int = Field(
        default=10,
        description="Tamanho do pool de conexões"
    )
    
    max_overflow: int = Field(
        default=20,
        description="Máximo de conexões extras além do pool_size"
    )
    
    class Config:
        env_file = ".env"
        env_file_encoding = "utf-8"
        extra = "ignore"  # Ignorar campos extras


class AppSettings(BaseSettings):
    """Configurações gerais da aplicação"""
    
    debug: bool = Field(
        default=False,
        description="Modo debug da aplicação"
    )
    
    log_level: str = Field(
        default="INFO",
        description="Nível de log da aplicação"
    )
    
    frontend_url: str = Field(
        default="http://localhost:5173",
        description="URL do frontend para CORS"
    )
    
    # Configurações de JWT
    jwt_secret_key: str = Field(
        ...,
        description="Chave secreta para assinar tokens JWT",
        alias="JWT_SECRET_KEY"
    )
    
    jwt_algorithm: str = Field(
        "HS256",
        description="Algoritmo de assinatura JWT",
        alias="JWT_ALGORITHM"
    )
    
    access_token_expire_minutes: int = Field(
        30,
        description="Tempo de expiração do access token em minutos",
        alias="ACCESS_TOKEN_EXPIRE_MINUTES"
    )
    
    refresh_token_expire_days: int = Field(
        7,
        description="Tempo de expiração do refresh token em dias",
        alias="REFRESH_TOKEN_EXPIRE_DAYS"
    )
    
    class Config:
        env_file = ".env"
        env_file_encoding = "utf-8"
        extra = "ignore"  # Ignorar campos extras


# Instâncias globais das configurações
database_settings = DatabaseSettings()
app_settings = AppSettings()

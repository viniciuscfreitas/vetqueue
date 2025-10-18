"""Auth Routes - Rotas de autenticação"""

from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, status

from ...application.auth_use_cases import (
    GetCurrentUserUseCase,
    LoginUseCase,
    RefreshTokenUseCase,
    RegisterUseCase,
)
from ...domain.user_repositories import UserRepositoryPort
from ...infrastructure.persistence.user_repository import PostgresUserRepository
from ...infrastructure.persistence.database import get_async_session
from ...infrastructure.auth.auth_middleware import AuthMiddleware
from .auth_schemas import (
    LoginRequest,
    LoginResponse,
    RegisterRequest,
    RegisterResponse,
    RefreshTokenRequest,
    RefreshTokenResponse,
    UserResponse,
    ErrorResponse,
)

# Router de autenticação
auth_router = APIRouter(prefix="/auth", tags=["Autenticação"])


# Dependency para obter repositório de usuários
def get_user_repository(session = Depends(get_async_session)) -> UserRepositoryPort:
    """Dependency para obter repositório de usuários"""
    return PostgresUserRepository(session)


# Dependency factories para use cases
def get_login_use_case(repository: UserRepositoryPort = Depends(get_user_repository)) -> LoginUseCase:
    """Factory para LoginUseCase"""
    return LoginUseCase(repository)


def get_register_use_case(repository: UserRepositoryPort = Depends(get_user_repository)) -> RegisterUseCase:
    """Factory para RegisterUseCase"""
    return RegisterUseCase(repository)


def get_refresh_token_use_case(repository: UserRepositoryPort = Depends(get_user_repository)) -> RefreshTokenUseCase:
    """Factory para RefreshTokenUseCase"""
    return RefreshTokenUseCase(repository)


def get_current_user_use_case(repository: UserRepositoryPort = Depends(get_user_repository)) -> GetCurrentUserUseCase:
    """Factory para GetCurrentUserUseCase"""
    return GetCurrentUserUseCase(repository)


@auth_router.post(
    "/login",
    response_model=LoginResponse,
    status_code=status.HTTP_200_OK,
    summary="Realizar login",
    description="Autentica um usuário e retorna tokens JWT",
)
async def login(
    request: LoginRequest,
    use_case: LoginUseCase = Depends(get_login_use_case)
):
    """
    Endpoint de login com autenticação JWT.
    
    **Parâmetros:**
    - username: Nome de usuário
    - password: Senha
    
    **Resposta:**
    - access_token: Token de acesso JWT
    - refresh_token: Token de refresh
    - user: Dados do usuário
    """
    # MVP: Credenciais hardcoded para teste
    if request.username == "admin" and request.password == "admin123":
        from .auth_schemas import LoginResponse
        return LoginResponse(
            access_token="fake-jwt-token-mvp",
            refresh_token="fake-refresh-token-mvp",
            token_type="bearer",
            expires_in=1800,
            user={
                "id": "admin-001",
                "username": "admin",
                "email": "admin@vetqueue.com",
                "full_name": "Administrador",
                "is_admin": True,
                "is_active": True,
                "last_login": None
            }
        )
    
    try:
        result = await use_case.execute(request.username, request.password)
        return LoginResponse(**result)
    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail=str(e)
        )


@auth_router.post(
    "/register",
    response_model=RegisterResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Registrar usuário",
    description="Cria um novo usuário no sistema",
)
async def register(
    request: RegisterRequest,
    use_case: RegisterUseCase = Depends(get_register_use_case)
):
    """
    Endpoint de registro de usuário.
    
    **Parâmetros:**
    - username: Nome de usuário único
    - email: Email único
    - password: Senha
    - full_name: Nome completo (opcional)
    
    **Resposta:**
    - message: Mensagem de sucesso
    - user: Dados do usuário criado
    """
    try:
        result = await use_case.execute(
            request.username,
            request.email,
            request.password,
            request.full_name
        )
        return RegisterResponse(
            message="Usuário criado com sucesso",
            user=UserResponse(**result)
        )
    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e)
        )


@auth_router.post(
    "/refresh",
    response_model=RefreshTokenResponse,
    status_code=status.HTTP_200_OK,
    summary="Renovar token",
    description="Renova o access token usando refresh token",
)
async def refresh_token(
    request: RefreshTokenRequest,
    use_case: RefreshTokenUseCase = Depends(get_refresh_token_use_case)
):
    """
    Endpoint para renovação de token.
    
    **Parâmetros:**
    - refresh_token: Token de refresh válido
    
    **Resposta:**
    - access_token: Novo token de acesso
    """
    try:
        result = await use_case.execute(request.refresh_token)
        return RefreshTokenResponse(**result)
    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail=str(e)
        )


@auth_router.get(
    "/me",
    response_model=UserResponse,
    status_code=status.HTTP_200_OK,
    summary="Obter dados do usuário atual",
    description="Retorna os dados do usuário autenticado",
)
async def get_current_user(
    current_user: dict = Depends(AuthMiddleware.get_current_user),
    use_case: GetCurrentUserUseCase = Depends(get_current_user_use_case)
):
    """
    Endpoint para obter dados do usuário atual.
    
    **Headers:**
    - Authorization: Bearer <access_token>
    
    **Resposta:**
    - Dados completos do usuário autenticado
    """
    user_id = UUID(current_user["sub"])
    user_data = await use_case.execute(user_id)
    
    if not user_data:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Usuário não encontrado"
        )
    
    return UserResponse(**user_data)

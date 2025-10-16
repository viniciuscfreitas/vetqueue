"""FastAPI Routes - Definição dos endpoints da API"""

from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, status

from ...application.use_cases import (
    AdicionarPacienteUseCase,
    ChamarPacienteUseCase,
    FinalizarAtendimentoUseCase,
    ObterFilaUseCase,
    PacienteNaoEncontradoError,
)
from ...domain.entities import (
    PacienteJaEmAtendimentoError,
    PacienteNaoEstaEmAtendimentoError,
)
from .dependencies import (
    get_adicionar_paciente_use_case,
    get_chamar_paciente_use_case,
    get_finalizar_atendimento_use_case,
    get_obter_fila_use_case,
)
from ..auth.auth_middleware import AuthMiddleware
from .schemas import (
    AdicionarPacienteRequest,
    AuthUserResponse,
    ChamarPacienteRequest,
    ErrorResponse,
    FilaStateResponse,
    FinalizarAtendimentoResponse,
    LoginRequest,
    PacienteResponse,
)


# --- Router de Autenticação ---

auth_router = APIRouter(prefix="/auth", tags=["Autenticação"])


@auth_router.post(
    "/login",
    response_model=AuthUserResponse,
    status_code=status.HTTP_200_OK,
    summary="Realizar login",
    description="Autentica um usuário e retorna um token JWT (MVP: hardcoded admin/1234)",
)
async def login(request: LoginRequest):
    """
    Endpoint de autenticação (MVP simplificado).
    
    **Credenciais de teste:**
    - user: admin
    - pass: 1234
    """
    # TODO: Implementar autenticação real com JWT em Fase 2
    if request.user == "admin" and request.pass_ == "1234":
        return AuthUserResponse(
            nome="Dr. Ricardo",
            token="fake-jwt-token"
        )
    
    raise HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Usuário ou senha inválidos"
    )


# --- Router de Fila ---

fila_router = APIRouter(prefix="/fila", tags=["Fila de Atendimento"])


@fila_router.get(
    "",
    response_model=FilaStateResponse,
    status_code=status.HTTP_200_OK,
    summary="Obter estado da fila",
    description="Retorna todos os pacientes aguardando e em atendimento",
)
async def obter_fila(
    use_case: ObterFilaUseCase = Depends(get_obter_fila_use_case)
):
    """
    Retorna o estado completo da fila de atendimento.
    
    **Resposta:**
    - aguardando: lista de pacientes aguardando
    - em_atendimento: lista de pacientes em atendimento
    """
    fila_state = await use_case.execute()
    return FilaStateResponse.from_domain(fila_state)


# --- Router de Pacientes ---

pacientes_router = APIRouter(prefix="/pacientes", tags=["Pacientes"])


@pacientes_router.post(
    "",
    response_model=PacienteResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Adicionar paciente à fila",
    description="Adiciona um novo paciente na fila de atendimento",
)
async def adicionar_paciente(
    request: AdicionarPacienteRequest,
    current_user: dict = Depends(AuthMiddleware.get_current_user),
    use_case: AdicionarPacienteUseCase = Depends(get_adicionar_paciente_use_case)
):
    """
    Adiciona um novo paciente à fila de atendimento.
    
    **Body:**
    - nome_pet: nome do animal
    - nome_tutor: nome do responsável
    """
    try:
        paciente = await use_case.execute(
            nome_pet=request.nome_pet,
            nome_tutor=request.nome_tutor
        )
        return PacienteResponse.from_domain(paciente)
    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e)
        )


@pacientes_router.put(
    "/{paciente_id}/chamar",
    response_model=PacienteResponse,
    status_code=status.HTTP_200_OK,
    summary="Chamar paciente para atendimento",
    description="Chama um paciente para atendimento em uma sala específica",
)
async def chamar_paciente(
    paciente_id: UUID,
    request: ChamarPacienteRequest,
    current_user: dict = Depends(AuthMiddleware.get_current_user),
    use_case: ChamarPacienteUseCase = Depends(get_chamar_paciente_use_case)
):
    """
    Chama um paciente para atendimento.
    
    **Path Parameters:**
    - paciente_id: UUID do paciente
    
    **Body:**
    - sala: nome/número da sala de atendimento
    """
    try:
        paciente = await use_case.execute(
            paciente_id=paciente_id,
            sala=request.sala
        )
        return PacienteResponse.from_domain(paciente)
    except PacienteNaoEncontradoError as e:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=str(e)
        )
    except PacienteJaEmAtendimentoError as e:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail=str(e)
        )
    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e)
        )


@pacientes_router.delete(
    "/{paciente_id}",
    response_model=FinalizarAtendimentoResponse,
    status_code=status.HTTP_200_OK,
    summary="Finalizar atendimento",
    description="Finaliza o atendimento de um paciente e o remove da fila",
)
async def finalizar_atendimento(
    paciente_id: UUID,
    current_user: dict = Depends(AuthMiddleware.get_current_user),
    use_case: FinalizarAtendimentoUseCase = Depends(get_finalizar_atendimento_use_case)
):
    """
    Finaliza o atendimento de um paciente.
    
    **Path Parameters:**
    - paciente_id: UUID do paciente
    """
    try:
        await use_case.execute(paciente_id)
        return FinalizarAtendimentoResponse(id=str(paciente_id))
    except PacienteNaoEncontradoError as e:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=str(e)
        )
    except PacienteNaoEstaEmAtendimentoError as e:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail=str(e)
        )


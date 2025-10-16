"""Pydantic Schemas - DTOs para serialização/deserialização da API"""

from typing import List, Optional
from uuid import UUID

from pydantic import BaseModel, Field, ConfigDict

from ...domain.value_objects import StatusPaciente


# --- Request Schemas ---

class LoginRequest(BaseModel):
    """Schema para request de login"""
    user: str = Field(..., min_length=1, description="Nome de usuário")
    pass_: str = Field(..., alias="pass", min_length=1, description="Senha")
    
    model_config = ConfigDict(populate_by_name=True)


class AdicionarPacienteRequest(BaseModel):
    """Schema para request de adicionar paciente"""
    nome_pet: str = Field(..., min_length=1, max_length=100, description="Nome do pet")
    nome_tutor: str = Field(..., min_length=1, max_length=100, description="Nome do tutor")


class ChamarPacienteRequest(BaseModel):
    """Schema para request de chamar paciente para atendimento"""
    sala: str = Field(..., min_length=1, max_length=50, description="Sala de atendimento")


# --- Response Schemas ---

class AuthUserResponse(BaseModel):
    """Schema para response de autenticação"""
    nome: str = Field(..., description="Nome do usuário autenticado")
    token: str = Field(..., description="Token JWT")


class PacienteResponse(BaseModel):
    """Schema para response de paciente"""
    id: str = Field(..., description="UUID do paciente")
    nome_pet: str = Field(..., description="Nome do pet")
    nome_tutor: str = Field(..., description="Nome do tutor")
    status: StatusPaciente = Field(..., description="Status do paciente na fila")
    sala_atendimento: Optional[str] = Field(None, description="Sala de atendimento (se aplicável)")
    
    model_config = ConfigDict(from_attributes=True)
    
    @classmethod
    def from_domain(cls, paciente) -> "PacienteResponse":
        """Converte uma entidade de domínio para o schema de resposta"""
        return cls(
            id=str(paciente.id),
            nome_pet=paciente.nome_pet,
            nome_tutor=paciente.nome_tutor,
            status=paciente.status,
            sala_atendimento=paciente.sala_atendimento
        )


class FilaStateResponse(BaseModel):
    """Schema para response do estado completo da fila"""
    aguardando: List[PacienteResponse] = Field(default_factory=list, description="Pacientes aguardando")
    em_atendimento: List[PacienteResponse] = Field(default_factory=list, description="Pacientes em atendimento")
    
    @classmethod
    def from_domain(cls, fila_state) -> "FilaStateResponse":
        """Converte o DTO de domínio para o schema de resposta"""
        return cls(
            aguardando=[PacienteResponse.from_domain(p) for p in fila_state.aguardando],
            em_atendimento=[PacienteResponse.from_domain(p) for p in fila_state.em_atendimento]
        )


class FinalizarAtendimentoResponse(BaseModel):
    """Schema para response de finalizar atendimento"""
    id: str = Field(..., description="UUID do paciente finalizado")


class ErrorResponse(BaseModel):
    """Schema padrão para respostas de erro"""
    detail: str = Field(..., description="Mensagem de erro detalhada")


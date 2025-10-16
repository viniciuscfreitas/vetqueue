"""Entities - Objetos de domínio com identidade e comportamento"""

from dataclasses import dataclass, field
from typing import Optional
from uuid import UUID, uuid4

from .value_objects import StatusPaciente


class DomainException(Exception):
    """Exceção base para erros de domínio"""
    pass


class PacienteJaEmAtendimentoError(DomainException):
    """Erro ao tentar chamar um paciente que já está em atendimento"""
    pass


class PacienteNaoEstaEmAtendimentoError(DomainException):
    """Erro ao tentar finalizar atendimento de um paciente que não está em atendimento"""
    pass


@dataclass
class Paciente:
    """
    Entidade Paciente - Representa um paciente na fila de atendimento.
    
    Esta é uma entidade de domínio pura, sem dependências de frameworks.
    Contém a lógica de negócio relacionada ao ciclo de vida de um paciente na fila.
    """
    nome_pet: str
    nome_tutor: str
    status: StatusPaciente = field(default=StatusPaciente.AGUARDANDO)
    sala_atendimento: Optional[str] = field(default=None)
    id: UUID = field(default_factory=uuid4)
    
    def __post_init__(self):
        """Validações após inicialização"""
        self._validar_nome_pet()
        self._validar_nome_tutor()
        self._validar_sala_atendimento()
    
    def _validar_nome_pet(self) -> None:
        """Valida que o nome do pet não está vazio"""
        if not self.nome_pet or not self.nome_pet.strip():
            raise ValueError("Nome do pet não pode ser vazio")
    
    def _validar_nome_tutor(self) -> None:
        """Valida que o nome do tutor não está vazio"""
        if not self.nome_tutor or not self.nome_tutor.strip():
            raise ValueError("Nome do tutor não pode ser vazio")
    
    def _validar_sala_atendimento(self) -> None:
        """Valida coerência entre status e sala de atendimento"""
        if self.status == StatusPaciente.EM_ATENDIMENTO and not self.sala_atendimento:
            raise ValueError("Paciente em atendimento deve ter sala definida")
        if self.status == StatusPaciente.AGUARDANDO and self.sala_atendimento:
            raise ValueError("Paciente aguardando não pode ter sala de atendimento")
    
    def chamar_para_atendimento(self, sala: str) -> None:
        """
        Chama o paciente para atendimento em uma sala específica.
        
        Args:
            sala: Nome/número da sala de atendimento
            
        Raises:
            PacienteJaEmAtendimentoError: Se o paciente já está em atendimento
            ValueError: Se a sala não for válida
        """
        if self.status == StatusPaciente.EM_ATENDIMENTO:
            raise PacienteJaEmAtendimentoError(
                f"Paciente {self.nome_pet} já está em atendimento na sala {self.sala_atendimento}"
            )
        
        if not sala or not sala.strip():
            raise ValueError("Sala de atendimento não pode ser vazia")
        
        self.status = StatusPaciente.EM_ATENDIMENTO
        self.sala_atendimento = sala.strip()
    
    def finalizar_atendimento(self) -> None:
        """
        Finaliza o atendimento do paciente.
        
        Raises:
            PacienteNaoEstaEmAtendimentoError: Se o paciente não está em atendimento
        """
        if self.status != StatusPaciente.EM_ATENDIMENTO:
            raise PacienteNaoEstaEmAtendimentoError(
                f"Paciente {self.nome_pet} não está em atendimento"
            )
        
        # Nota: Ao finalizar, o paciente será removido da fila pelo repositório
        # Este método apenas valida a regra de negócio
        self.sala_atendimento = None
    
    def esta_aguardando(self) -> bool:
        """Verifica se o paciente está aguardando atendimento"""
        return self.status == StatusPaciente.AGUARDANDO
    
    def esta_em_atendimento(self) -> bool:
        """Verifica se o paciente está em atendimento"""
        return self.status == StatusPaciente.EM_ATENDIMENTO


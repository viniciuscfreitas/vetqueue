"""Use Cases - Orquestração da lógica de negócio (Application Layer)"""

from dataclasses import dataclass
from typing import List
from uuid import UUID

from ..domain.entities import Paciente
from ..domain.repositories import FilaRepositoryPort
from ..domain.value_objects import StatusPaciente
from ..domain.events import (
    PacienteAdicionadoEvent,
    PacienteChamadoEvent,
    PacienteFinalizadoEvent,
)
from ..domain.event_dispatcher import dispatcher


class PacienteNaoEncontradoError(Exception):
    """Erro quando um paciente não é encontrado no repositório"""
    pass


@dataclass
class FilaState:
    """DTO para representar o estado completo da fila"""
    aguardando: List[Paciente]
    em_atendimento: List[Paciente]


class AdicionarPacienteUseCase:
    """
    Caso de uso: Adicionar um novo paciente à fila.
    
    Responsabilidades:
    - Criar uma nova entidade Paciente
    - Validar dados de entrada (delegando para a entidade)
    - Persistir o paciente através do repositório
    """
    
    def __init__(self, repository: FilaRepositoryPort):
        self.repository = repository
    
    async def execute(self, nome_pet: str, nome_tutor: str) -> Paciente:
        """
        Executa o caso de uso de adicionar paciente.
        
        Args:
            nome_pet: Nome do animal de estimação
            nome_tutor: Nome do tutor/responsável
            
        Returns:
            Paciente criado e adicionado à fila
            
        Raises:
            ValueError: Se os dados forem inválidos (validado pela entidade)
        """
        # A entidade Paciente já valida os dados no __post_init__
        paciente = Paciente(
            nome_pet=nome_pet,
            nome_tutor=nome_tutor,
            status=StatusPaciente.AGUARDANDO
        )
        
        paciente = await self.repository.adicionar(paciente)
        
        # Despacha evento de domínio (sem acoplamento com infraestrutura)
        event = PacienteAdicionadoEvent(paciente=paciente)
        await dispatcher.dispatch(event)
        
        return paciente


class ChamarPacienteUseCase:
    """
    Caso de uso: Chamar um paciente para atendimento.
    
    Responsabilidades:
    - Buscar o paciente no repositório
    - Aplicar a regra de negócio de chamada (delegando para a entidade)
    - Atualizar o paciente no repositório
    """
    
    def __init__(self, repository: FilaRepositoryPort):
        self.repository = repository
    
    async def execute(self, paciente_id: UUID, sala: str) -> Paciente:
        """
        Executa o caso de uso de chamar paciente para atendimento.
        
        Args:
            paciente_id: UUID do paciente a ser chamado
            sala: Nome/número da sala de atendimento
            
        Returns:
            Paciente atualizado com status EM_ATENDIMENTO
            
        Raises:
            PacienteNaoEncontradoError: Se o paciente não existir
            PacienteJaEmAtendimentoError: Se o paciente já estiver em atendimento
            ValueError: Se a sala for inválida
        """
        paciente = await self.repository.buscar_por_id(paciente_id)
        
        if paciente is None:
            raise PacienteNaoEncontradoError(
                f"Paciente com ID {paciente_id} não encontrado"
            )
        
        # A lógica de negócio está na entidade
        paciente.chamar_para_atendimento(sala)
        
        paciente = await self.repository.atualizar(paciente)
        
        # Despacha evento de domínio (sem acoplamento com infraestrutura)
        event = PacienteChamadoEvent(paciente=paciente, sala=sala)
        await dispatcher.dispatch(event)
        
        return paciente


class FinalizarAtendimentoUseCase:
    """
    Caso de uso: Finalizar o atendimento de um paciente.
    
    Responsabilidades:
    - Buscar o paciente no repositório
    - Validar que ele está em atendimento (delegando para a entidade)
    - Remover o paciente da fila
    """
    
    def __init__(self, repository: FilaRepositoryPort):
        self.repository = repository
    
    async def execute(self, paciente_id: UUID) -> None:
        """
        Executa o caso de uso de finalizar atendimento.
        
        Args:
            paciente_id: UUID do paciente cujo atendimento será finalizado
            
        Raises:
            PacienteNaoEncontradoError: Se o paciente não existir
            PacienteNaoEstaEmAtendimentoError: Se o paciente não estiver em atendimento
        """
        paciente = await self.repository.buscar_por_id(paciente_id)
        
        if paciente is None:
            raise PacienteNaoEncontradoError(
                f"Paciente com ID {paciente_id} não encontrado"
            )
        
        # Validação da regra de negócio na entidade
        paciente.finalizar_atendimento()
        
        # Remove da fila
        await self.repository.remover(paciente_id)
        
        # Despacha evento de domínio (sem acoplamento com infraestrutura)
        event = PacienteFinalizadoEvent(paciente_id=str(paciente_id))
        await dispatcher.dispatch(event)


class ObterFilaUseCase:
    """
    Caso de uso: Obter o estado completo da fila.
    
    Responsabilidades:
    - Buscar todos os pacientes aguardando
    - Buscar todos os pacientes em atendimento
    - Retornar o estado agregado
    """
    
    def __init__(self, repository: FilaRepositoryPort):
        self.repository = repository
    
    async def execute(self) -> FilaState:
        """
        Executa o caso de uso de obter estado da fila.
        
        Returns:
            FilaState com listas de pacientes aguardando e em atendimento
        """
        aguardando = await self.repository.listar_aguardando()
        em_atendimento = await self.repository.listar_em_atendimento()
        
        return FilaState(
            aguardando=aguardando,
            em_atendimento=em_atendimento
        )


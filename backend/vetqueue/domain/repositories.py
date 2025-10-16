"""Repository Ports - Interfaces abstratas para acesso a dados (Portas)"""

from abc import ABC, abstractmethod
from typing import List, Optional
from uuid import UUID

from .entities import Paciente


class FilaRepositoryPort(ABC):
    """
    Port (interface) para o repositório de fila de pacientes.
    
    Esta é uma "Porta" na Arquitetura Hexagonal - define o contrato
    que qualquer adaptador de persistência deve implementar.
    
    O domínio depende apenas desta abstração, nunca de implementações concretas.
    """
    
    @abstractmethod
    async def adicionar(self, paciente: Paciente) -> Paciente:
        """
        Adiciona um novo paciente à fila.
        
        Args:
            paciente: Entidade Paciente a ser adicionada
            
        Returns:
            O paciente adicionado (pode conter campos atualizados pelo repositório)
        """
        pass
    
    @abstractmethod
    async def buscar_por_id(self, paciente_id: UUID) -> Optional[Paciente]:
        """
        Busca um paciente pelo ID.
        
        Args:
            paciente_id: UUID do paciente
            
        Returns:
            Paciente encontrado ou None
        """
        pass
    
    @abstractmethod
    async def listar_aguardando(self) -> List[Paciente]:
        """
        Lista todos os pacientes aguardando atendimento.
        
        Returns:
            Lista de pacientes com status AGUARDANDO
        """
        pass
    
    @abstractmethod
    async def listar_em_atendimento(self) -> List[Paciente]:
        """
        Lista todos os pacientes em atendimento.
        
        Returns:
            Lista de pacientes com status EM_ATENDIMENTO
        """
        pass
    
    @abstractmethod
    async def atualizar(self, paciente: Paciente) -> Paciente:
        """
        Atualiza os dados de um paciente existente.
        
        Args:
            paciente: Entidade Paciente com dados atualizados
            
        Returns:
            O paciente atualizado
            
        Raises:
            ValueError: Se o paciente não existir
        """
        pass
    
    @abstractmethod
    async def remover(self, paciente_id: UUID) -> None:
        """
        Remove um paciente da fila.
        
        Args:
            paciente_id: UUID do paciente a ser removido
            
        Raises:
            ValueError: Se o paciente não existir
        """
        pass
    
    @abstractmethod
    async def listar_todos(self) -> List[Paciente]:
        """
        Lista todos os pacientes na fila (para testes e debug).
        
        Returns:
            Lista com todos os pacientes
        """
        pass


"""In-Memory Repository - Implementação do repositório em memória (Adaptador)"""

import asyncio
from typing import Dict, List, Optional
from uuid import UUID

from ...domain.entities import Paciente
from ...domain.repositories import FilaRepositoryPort
from ...domain.value_objects import StatusPaciente


class InMemoryFilaRepository(FilaRepositoryPort):
    """
    Implementação em memória do repositório de fila.
    
    Esta é uma implementação de "Adaptador" na Arquitetura Hexagonal.
    Implementa a "Porta" (FilaRepositoryPort) definida no domínio.
    
    Thread-safe usando asyncio.Lock para ambientes assíncronos.
    """
    
    def __init__(self):
        self._storage: Dict[UUID, Paciente] = {}
        self._lock = asyncio.Lock()  # asyncio.Lock para ambiente async (não threading.Lock!)
    
    async def adicionar(self, paciente: Paciente) -> Paciente:
        """
        Adiciona um paciente ao armazenamento em memória.
        """
        async with self._lock:
            self._storage[paciente.id] = paciente
            return paciente
    
    async def buscar_por_id(self, paciente_id: UUID) -> Optional[Paciente]:
        """
        Busca um paciente pelo ID.
        """
        async with self._lock:
            return self._storage.get(paciente_id)
    
    async def listar_aguardando(self) -> List[Paciente]:
        """
        Lista todos os pacientes com status AGUARDANDO.
        """
        async with self._lock:
            return [
                p for p in self._storage.values()
                if p.status == StatusPaciente.AGUARDANDO
            ]
    
    async def listar_em_atendimento(self) -> List[Paciente]:
        """
        Lista todos os pacientes com status EM_ATENDIMENTO.
        """
        async with self._lock:
            return [
                p for p in self._storage.values()
                if p.status == StatusPaciente.EM_ATENDIMENTO
            ]
    
    async def atualizar(self, paciente: Paciente) -> Paciente:
        """
        Atualiza um paciente existente.
        """
        async with self._lock:
            if paciente.id not in self._storage:
                raise ValueError(f"Paciente com ID {paciente.id} não encontrado")
            
            self._storage[paciente.id] = paciente
            return paciente
    
    async def remover(self, paciente_id: UUID) -> None:
        """
        Remove um paciente do armazenamento.
        """
        async with self._lock:
            if paciente_id not in self._storage:
                raise ValueError(f"Paciente com ID {paciente_id} não encontrado")
            
            del self._storage[paciente_id]
    
    async def listar_todos(self) -> List[Paciente]:
        """
        Lista todos os pacientes (útil para debug e testes).
        """
        async with self._lock:
            return list(self._storage.values())
    
    async def limpar(self) -> None:
        """
        Limpa todo o armazenamento (útil para testes).
        """
        async with self._lock:
            self._storage.clear()


"""PostgreSQL Repository - Implementação concreta do FilaRepositoryPort"""

from typing import List, Optional
from uuid import UUID

from sqlalchemy import select
from sqlalchemy.exc import IntegrityError
from sqlalchemy.ext.asyncio import AsyncSession

from ...domain.entities import Paciente
from ...domain.repositories import FilaRepositoryPort
from ...domain.value_objects import StatusPaciente
from .mappers import model_to_paciente, models_to_pacientes, paciente_to_model


class PostgresFilaRepository(FilaRepositoryPort):
    """
    Implementação PostgreSQL do repositório de fila.
    
    Esta é uma implementação de "Adaptador" na Arquitetura Hexagonal.
    Implementa a "Porta" (FilaRepositoryPort) definida no domínio.
    
    Usa transações explícitas para operações críticas e SQLAlchemy 2.0 style.
    """
    
    def __init__(self, session: AsyncSession):
        """
        Inicializa o repositório com uma sessão do SQLAlchemy.
        
        Args:
            session: Sessão async do SQLAlchemy
        """
        self.session = session
    
    async def adicionar(self, paciente: Paciente) -> Paciente:
        """
        Adiciona um novo paciente à fila.
        
        Args:
            paciente: Entidade Paciente a ser adicionada
            
        Returns:
            O paciente adicionado
            
        Raises:
            ValueError: Se houver erro de integridade (ID duplicado)
        """
        try:
            async with self.session.begin():
                model = paciente_to_model(paciente)
                self.session.add(model)
                await self.session.flush()
                return model_to_paciente(model)
        except IntegrityError as e:
            raise ValueError(f"Erro ao adicionar paciente: {str(e)}")
    
    async def buscar_por_id(self, paciente_id: UUID) -> Optional[Paciente]:
        """
        Busca um paciente pelo ID.
        
        Args:
            paciente_id: UUID do paciente
            
        Returns:
            Paciente encontrado ou None
        """
        stmt = select(PacienteModel).where(PacienteModel.id == paciente_id)
        result = await self.session.execute(stmt)
        model = result.scalar_one_or_none()
        
        return model_to_paciente(model) if model else None
    
    async def listar_aguardando(self) -> List[Paciente]:
        """
        Lista todos os pacientes aguardando atendimento.
        
        Returns:
            Lista de pacientes com status AGUARDANDO
        """
        stmt = select(PacienteModel).where(
            PacienteModel.status == StatusPaciente.AGUARDANDO
        )
        result = await self.session.execute(stmt)
        models = result.scalars().all()
        
        return models_to_pacientes(list(models))
    
    async def listar_em_atendimento(self) -> List[Paciente]:
        """
        Lista todos os pacientes em atendimento.
        
        Returns:
            Lista de pacientes com status EM_ATENDIMENTO
        """
        stmt = select(PacienteModel).where(
            PacienteModel.status == StatusPaciente.EM_ATENDIMENTO
        )
        result = await self.session.execute(stmt)
        models = result.scalars().all()
        
        return models_to_pacientes(list(models))
    
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
        async with self.session.begin():
            # Usar merge para operação atômica e performática
            model = paciente_to_model(paciente)
            merged_model = await self.session.merge(model)
            await self.session.flush()
            return model_to_paciente(merged_model)
    
    async def remover(self, paciente_id: UUID) -> None:
        """
        Remove um paciente da fila.
        
        Args:
            paciente_id: UUID do paciente a ser removido
            
        Raises:
            ValueError: Se o paciente não existir
        """
        from sqlalchemy import delete
        
        async with self.session.begin():
            # DELETE direto - mais performático e atômico
            stmt = delete(PacienteModel).where(PacienteModel.id == paciente_id)
            result = await self.session.execute(stmt)
            
            if result.rowcount == 0:
                raise ValueError(f"Paciente com ID {paciente_id} não encontrado")
    
    async def listar_todos(self) -> List[Paciente]:
        """
        Lista todos os pacientes na fila (para testes e debug).
        
        Returns:
            Lista com todos os pacientes
        """
        stmt = select(PacienteModel)
        result = await self.session.execute(stmt)
        models = result.scalars().all()
        
        return models_to_pacientes(list(models))

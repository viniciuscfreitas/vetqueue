"""Testes Unitários - Use Cases da Aplicação"""

import pytest
from unittest.mock import AsyncMock, MagicMock
from uuid import uuid4

from vetqueue.application.use_cases import (
    AdicionarPacienteUseCase,
    ChamarPacienteUseCase,
    FinalizarAtendimentoUseCase,
    ObterFilaUseCase,
    PacienteNaoEncontradoError,
)
from vetqueue.domain.entities import (
    Paciente,
    PacienteJaEmAtendimentoError,
    PacienteNaoEstaEmAtendimentoError,
)
from vetqueue.domain.value_objects import StatusPaciente


@pytest.fixture
def mock_repository():
    """Fixture para criar um mock do repositório"""
    return MagicMock()


class TestAdicionarPacienteUseCase:
    """Testes para AdicionarPacienteUseCase"""
    
    @pytest.mark.asyncio
    async def test_adicionar_paciente_com_sucesso(self, mock_repository):
        """Deve adicionar um paciente com sucesso"""
        # Arrange
        mock_repository.adicionar = AsyncMock(
            side_effect=lambda p: p
        )
        use_case = AdicionarPacienteUseCase(mock_repository)
        
        # Act
        paciente = await use_case.execute(
            nome_pet="Bolinha",
            nome_tutor="Maria Silva"
        )
        
        # Assert
        assert paciente.nome_pet == "Bolinha"
        assert paciente.nome_tutor == "Maria Silva"
        assert paciente.status == StatusPaciente.AGUARDANDO
        assert paciente.sala_atendimento is None
        mock_repository.adicionar.assert_called_once()
    
    @pytest.mark.asyncio
    async def test_adicionar_paciente_nome_pet_vazio_deve_falhar(self, mock_repository):
        """Não deve adicionar paciente com nome do pet vazio"""
        use_case = AdicionarPacienteUseCase(mock_repository)
        
        with pytest.raises(ValueError, match="Nome do pet não pode ser vazio"):
            await use_case.execute(nome_pet="", nome_tutor="Maria Silva")
        
        mock_repository.adicionar.assert_not_called()
    
    @pytest.mark.asyncio
    async def test_adicionar_paciente_nome_tutor_vazio_deve_falhar(self, mock_repository):
        """Não deve adicionar paciente com nome do tutor vazio"""
        use_case = AdicionarPacienteUseCase(mock_repository)
        
        with pytest.raises(ValueError, match="Nome do tutor não pode ser vazio"):
            await use_case.execute(nome_pet="Bolinha", nome_tutor="")
        
        mock_repository.adicionar.assert_not_called()


class TestChamarPacienteUseCase:
    """Testes para ChamarPacienteUseCase"""
    
    @pytest.mark.asyncio
    async def test_chamar_paciente_com_sucesso(self, mock_repository):
        """Deve chamar paciente para atendimento com sucesso"""
        # Arrange
        paciente_id = uuid4()
        paciente = Paciente(
            id=paciente_id,
            nome_pet="Bolinha",
            nome_tutor="Maria Silva"
        )
        
        mock_repository.buscar_por_id = AsyncMock(return_value=paciente)
        mock_repository.atualizar = AsyncMock(side_effect=lambda p: p)
        
        use_case = ChamarPacienteUseCase(mock_repository)
        
        # Act
        resultado = await use_case.execute(paciente_id, "Consultório 1")
        
        # Assert
        assert resultado.status == StatusPaciente.EM_ATENDIMENTO
        assert resultado.sala_atendimento == "Consultório 1"
        mock_repository.buscar_por_id.assert_called_once_with(paciente_id)
        mock_repository.atualizar.assert_called_once()
    
    @pytest.mark.asyncio
    async def test_chamar_paciente_nao_encontrado_deve_falhar(self, mock_repository):
        """Não deve chamar paciente que não existe"""
        # Arrange
        paciente_id = uuid4()
        mock_repository.buscar_por_id = AsyncMock(return_value=None)
        
        use_case = ChamarPacienteUseCase(mock_repository)
        
        # Act & Assert
        with pytest.raises(PacienteNaoEncontradoError, match="não encontrado"):
            await use_case.execute(paciente_id, "Consultório 1")
        
        mock_repository.atualizar.assert_not_called()
    
    @pytest.mark.asyncio
    async def test_chamar_paciente_ja_em_atendimento_deve_falhar(self, mock_repository):
        """Não deve chamar paciente que já está em atendimento"""
        # Arrange
        paciente_id = uuid4()
        paciente = Paciente(
            id=paciente_id,
            nome_pet="Bolinha",
            nome_tutor="Maria Silva"
        )
        paciente.chamar_para_atendimento("Consultório 1")
        
        mock_repository.buscar_por_id = AsyncMock(return_value=paciente)
        
        use_case = ChamarPacienteUseCase(mock_repository)
        
        # Act & Assert
        with pytest.raises(PacienteJaEmAtendimentoError, match="já está em atendimento"):
            await use_case.execute(paciente_id, "Consultório 2")
        
        mock_repository.atualizar.assert_not_called()
    
    @pytest.mark.asyncio
    async def test_chamar_paciente_sala_vazia_deve_falhar(self, mock_repository):
        """Não deve chamar paciente com sala vazia"""
        # Arrange
        paciente_id = uuid4()
        paciente = Paciente(
            id=paciente_id,
            nome_pet="Bolinha",
            nome_tutor="Maria Silva"
        )
        
        mock_repository.buscar_por_id = AsyncMock(return_value=paciente)
        
        use_case = ChamarPacienteUseCase(mock_repository)
        
        # Act & Assert
        with pytest.raises(ValueError, match="Sala de atendimento não pode ser vazia"):
            await use_case.execute(paciente_id, "")
        
        mock_repository.atualizar.assert_not_called()


class TestFinalizarAtendimentoUseCase:
    """Testes para FinalizarAtendimentoUseCase"""
    
    @pytest.mark.asyncio
    async def test_finalizar_atendimento_com_sucesso(self, mock_repository):
        """Deve finalizar atendimento com sucesso"""
        # Arrange
        paciente_id = uuid4()
        paciente = Paciente(
            id=paciente_id,
            nome_pet="Bolinha",
            nome_tutor="Maria Silva"
        )
        paciente.chamar_para_atendimento("Consultório 1")
        
        mock_repository.buscar_por_id = AsyncMock(return_value=paciente)
        mock_repository.remover = AsyncMock()
        
        use_case = FinalizarAtendimentoUseCase(mock_repository)
        
        # Act
        await use_case.execute(paciente_id)
        
        # Assert
        mock_repository.buscar_por_id.assert_called_once_with(paciente_id)
        mock_repository.remover.assert_called_once_with(paciente_id)
    
    @pytest.mark.asyncio
    async def test_finalizar_atendimento_paciente_nao_encontrado_deve_falhar(self, mock_repository):
        """Não deve finalizar atendimento de paciente que não existe"""
        # Arrange
        paciente_id = uuid4()
        mock_repository.buscar_por_id = AsyncMock(return_value=None)
        
        use_case = FinalizarAtendimentoUseCase(mock_repository)
        
        # Act & Assert
        with pytest.raises(PacienteNaoEncontradoError, match="não encontrado"):
            await use_case.execute(paciente_id)
        
        mock_repository.remover.assert_not_called()
    
    @pytest.mark.asyncio
    async def test_finalizar_atendimento_paciente_nao_esta_em_atendimento_deve_falhar(self, mock_repository):
        """Não deve finalizar atendimento de paciente que não está em atendimento"""
        # Arrange
        paciente_id = uuid4()
        paciente = Paciente(
            id=paciente_id,
            nome_pet="Bolinha",
            nome_tutor="Maria Silva"
        )
        # Paciente está AGUARDANDO, não EM_ATENDIMENTO
        
        mock_repository.buscar_por_id = AsyncMock(return_value=paciente)
        
        use_case = FinalizarAtendimentoUseCase(mock_repository)
        
        # Act & Assert
        with pytest.raises(PacienteNaoEstaEmAtendimentoError, match="não está em atendimento"):
            await use_case.execute(paciente_id)
        
        mock_repository.remover.assert_not_called()


class TestObterFilaUseCase:
    """Testes para ObterFilaUseCase"""
    
    @pytest.mark.asyncio
    async def test_obter_fila_com_sucesso(self, mock_repository):
        """Deve obter o estado da fila com sucesso"""
        # Arrange
        paciente_aguardando = Paciente(
            nome_pet="Bolinha",
            nome_tutor="Maria Silva"
        )
        paciente_em_atendimento = Paciente(
            nome_pet="Rex",
            nome_tutor="João Silva"
        )
        paciente_em_atendimento.chamar_para_atendimento("Consultório 1")
        
        mock_repository.listar_aguardando = AsyncMock(return_value=[paciente_aguardando])
        mock_repository.listar_em_atendimento = AsyncMock(return_value=[paciente_em_atendimento])
        
        use_case = ObterFilaUseCase(mock_repository)
        
        # Act
        fila_state = await use_case.execute()
        
        # Assert
        assert len(fila_state.aguardando) == 1
        assert len(fila_state.em_atendimento) == 1
        assert fila_state.aguardando[0].nome_pet == "Bolinha"
        assert fila_state.em_atendimento[0].nome_pet == "Rex"
        mock_repository.listar_aguardando.assert_called_once()
        mock_repository.listar_em_atendimento.assert_called_once()
    
    @pytest.mark.asyncio
    async def test_obter_fila_vazia(self, mock_repository):
        """Deve retornar fila vazia quando não há pacientes"""
        # Arrange
        mock_repository.listar_aguardando = AsyncMock(return_value=[])
        mock_repository.listar_em_atendimento = AsyncMock(return_value=[])
        
        use_case = ObterFilaUseCase(mock_repository)
        
        # Act
        fila_state = await use_case.execute()
        
        # Assert
        assert len(fila_state.aguardando) == 0
        assert len(fila_state.em_atendimento) == 0


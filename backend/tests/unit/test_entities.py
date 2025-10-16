"""Testes Unitários - Entidades do Domínio"""

import pytest
from uuid import uuid4

from vetqueue.domain.entities import (
    Paciente,
    PacienteJaEmAtendimentoError,
    PacienteNaoEstaEmAtendimentoError,
)
from vetqueue.domain.value_objects import StatusPaciente


class TestPaciente:
    """Testes para a entidade Paciente"""
    
    def test_criar_paciente_valido(self):
        """Deve criar um paciente com dados válidos"""
        paciente = Paciente(
            nome_pet="Bolinha",
            nome_tutor="Maria Silva"
        )
        
        assert paciente.nome_pet == "Bolinha"
        assert paciente.nome_tutor == "Maria Silva"
        assert paciente.status == StatusPaciente.AGUARDANDO
        assert paciente.sala_atendimento is None
        assert paciente.id is not None
    
    def test_criar_paciente_com_id_customizado(self):
        """Deve aceitar um ID customizado"""
        custom_id = uuid4()
        paciente = Paciente(
            nome_pet="Rex",
            nome_tutor="João Silva",
            id=custom_id
        )
        
        assert paciente.id == custom_id
    
    def test_criar_paciente_nome_pet_vazio_deve_falhar(self):
        """Não deve criar paciente com nome do pet vazio"""
        with pytest.raises(ValueError, match="Nome do pet não pode ser vazio"):
            Paciente(nome_pet="", nome_tutor="Maria Silva")
    
    def test_criar_paciente_nome_pet_apenas_espacos_deve_falhar(self):
        """Não deve criar paciente com nome do pet contendo apenas espaços"""
        with pytest.raises(ValueError, match="Nome do pet não pode ser vazio"):
            Paciente(nome_pet="   ", nome_tutor="Maria Silva")
    
    def test_criar_paciente_nome_tutor_vazio_deve_falhar(self):
        """Não deve criar paciente com nome do tutor vazio"""
        with pytest.raises(ValueError, match="Nome do tutor não pode ser vazio"):
            Paciente(nome_pet="Bolinha", nome_tutor="")
    
    def test_criar_paciente_nome_tutor_apenas_espacos_deve_falhar(self):
        """Não deve criar paciente com nome do tutor contendo apenas espaços"""
        with pytest.raises(ValueError, match="Nome do tutor não pode ser vazio"):
            Paciente(nome_pet="Bolinha", nome_tutor="   ")
    
    def test_criar_paciente_em_atendimento_sem_sala_deve_falhar(self):
        """Não deve criar paciente em atendimento sem sala definida"""
        with pytest.raises(ValueError, match="em atendimento deve ter sala definida"):
            Paciente(
                nome_pet="Bolinha",
                nome_tutor="Maria Silva",
                status=StatusPaciente.EM_ATENDIMENTO,
                sala_atendimento=None
            )
    
    def test_criar_paciente_aguardando_com_sala_deve_falhar(self):
        """Não deve criar paciente aguardando com sala definida"""
        with pytest.raises(ValueError, match="aguardando não pode ter sala"):
            Paciente(
                nome_pet="Bolinha",
                nome_tutor="Maria Silva",
                status=StatusPaciente.AGUARDANDO,
                sala_atendimento="Consultório 1"
            )
    
    def test_chamar_para_atendimento_sucesso(self):
        """Deve chamar paciente para atendimento com sucesso"""
        paciente = Paciente(nome_pet="Bolinha", nome_tutor="Maria Silva")
        
        paciente.chamar_para_atendimento("Consultório 1")
        
        assert paciente.status == StatusPaciente.EM_ATENDIMENTO
        assert paciente.sala_atendimento == "Consultório 1"
    
    def test_chamar_para_atendimento_remove_espacos_da_sala(self):
        """Deve remover espaços extras do nome da sala"""
        paciente = Paciente(nome_pet="Bolinha", nome_tutor="Maria Silva")
        
        paciente.chamar_para_atendimento("  Consultório 2  ")
        
        assert paciente.sala_atendimento == "Consultório 2"
    
    def test_chamar_para_atendimento_sala_vazia_deve_falhar(self):
        """Não deve chamar para atendimento com sala vazia"""
        paciente = Paciente(nome_pet="Bolinha", nome_tutor="Maria Silva")
        
        with pytest.raises(ValueError, match="Sala de atendimento não pode ser vazia"):
            paciente.chamar_para_atendimento("")
    
    def test_chamar_para_atendimento_sala_apenas_espacos_deve_falhar(self):
        """Não deve chamar para atendimento com sala contendo apenas espaços"""
        paciente = Paciente(nome_pet="Bolinha", nome_tutor="Maria Silva")
        
        with pytest.raises(ValueError, match="Sala de atendimento não pode ser vazia"):
            paciente.chamar_para_atendimento("   ")
    
    def test_chamar_paciente_ja_em_atendimento_deve_falhar(self):
        """Não deve chamar paciente que já está em atendimento"""
        paciente = Paciente(nome_pet="Bolinha", nome_tutor="Maria Silva")
        paciente.chamar_para_atendimento("Consultório 1")
        
        with pytest.raises(PacienteJaEmAtendimentoError, match="já está em atendimento"):
            paciente.chamar_para_atendimento("Consultório 2")
    
    def test_finalizar_atendimento_sucesso(self):
        """Deve finalizar atendimento com sucesso"""
        paciente = Paciente(nome_pet="Bolinha", nome_tutor="Maria Silva")
        paciente.chamar_para_atendimento("Consultório 1")
        
        paciente.finalizar_atendimento()
        
        assert paciente.sala_atendimento is None
    
    def test_finalizar_atendimento_paciente_nao_esta_em_atendimento_deve_falhar(self):
        """Não deve finalizar atendimento de paciente que não está em atendimento"""
        paciente = Paciente(nome_pet="Bolinha", nome_tutor="Maria Silva")
        
        with pytest.raises(PacienteNaoEstaEmAtendimentoError, match="não está em atendimento"):
            paciente.finalizar_atendimento()
    
    def test_esta_aguardando_retorna_true_quando_aguardando(self):
        """Método esta_aguardando deve retornar True quando status é AGUARDANDO"""
        paciente = Paciente(nome_pet="Bolinha", nome_tutor="Maria Silva")
        
        assert paciente.esta_aguardando() is True
        assert paciente.esta_em_atendimento() is False
    
    def test_esta_em_atendimento_retorna_true_quando_em_atendimento(self):
        """Método esta_em_atendimento deve retornar True quando status é EM_ATENDIMENTO"""
        paciente = Paciente(nome_pet="Bolinha", nome_tutor="Maria Silva")
        paciente.chamar_para_atendimento("Consultório 1")
        
        assert paciente.esta_aguardando() is False
        assert paciente.esta_em_atendimento() is True


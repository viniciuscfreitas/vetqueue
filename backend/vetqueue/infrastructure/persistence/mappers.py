"""Mappers - Tradução entre entidades de domínio e modelos ORM"""

from typing import List

from ...domain.entities import Paciente
from ...domain.value_objects import StatusPaciente
from .models import PacienteModel


def paciente_to_model(paciente: Paciente) -> PacienteModel:
    """
    Converte entidade de domínio → modelo ORM.
    
    Args:
        paciente: Entidade de domínio Paciente
        
    Returns:
        Modelo SQLAlchemy PacienteModel
    """
    return PacienteModel(
        id=paciente.id,
        nome_pet=paciente.nome_pet,
        nome_tutor=paciente.nome_tutor,
        status=paciente.status,
        sala_atendimento=paciente.sala_atendimento
    )


def model_to_paciente(model: PacienteModel) -> Paciente:
    """
    Converte modelo ORM → entidade de domínio.
    
    Args:
        model: Modelo SQLAlchemy PacienteModel
        
    Returns:
        Entidade de domínio Paciente
    """
    return Paciente(
        id=model.id,
        nome_pet=model.nome_pet,
        nome_tutor=model.nome_tutor,
        status=model.status,
        sala_atendimento=model.sala_atendimento
    )


def models_to_pacientes(models: List[PacienteModel]) -> List[Paciente]:
    """
    Converte lista de modelos ORM → lista de entidades de domínio.
    
    Args:
        models: Lista de modelos SQLAlchemy PacienteModel
        
    Returns:
        Lista de entidades de domínio Paciente
    """
    return [model_to_paciente(model) for model in models]


def update_model_from_entity(model: PacienteModel, paciente: Paciente) -> None:
    """
    Atualiza um modelo SQLAlchemy existente com dados da entidade de domínio.
    
    Args:
        model: Modelo SQLAlchemy existente a ser atualizado
        paciente: Entidade de domínio com dados atualizados
    """
    model.nome_pet = paciente.nome_pet
    model.nome_tutor = paciente.nome_tutor
    model.status = paciente.status
    model.sala_atendimento = paciente.sala_atendimento

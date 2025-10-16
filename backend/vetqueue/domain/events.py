"""
Domain Events - Eventos de Domínio

Eventos que representam fatos importantes que ocorreram no domínio.
Seguindo o padrão Domain Events para desacoplar a lógica de negócio
das preocupações de infraestrutura (notificações, logging, etc.).
"""

from dataclasses import dataclass, field
from datetime import datetime
from typing import Optional

from .entities import Paciente


@dataclass
class DomainEvent:
    """Classe base para todos os eventos de domínio."""
    
    timestamp: datetime = field(default_factory=datetime.now)
    fila_id: str = "default"  # MVP usa fila única, preparado para multi-tenant
    
    def to_dict(self) -> dict:
        """Serializa o evento para um dicionário."""
        return {
            "timestamp": self.timestamp.isoformat(),
            "fila_id": self.fila_id,
        }


@dataclass
class PacienteAdicionadoEvent(DomainEvent):
    """Evento disparado quando um paciente é adicionado à fila."""
    
    paciente: Paciente = field(default=None)  # Workaround para ordem de campos
    
    def to_dict(self) -> dict:
        base = super().to_dict()
        base.update({
            "event_type": "PACIENTE_ADICIONADO",
            "paciente": {
                "id": self.paciente.id,
                "nome_pet": self.paciente.nome_pet,
                "nome_tutor": self.paciente.nome_tutor,
                "status": self.paciente.status.value,
                "sala_atendimento": self.paciente.sala_atendimento,
            }
        })
        return base


@dataclass
class PacienteChamadoEvent(DomainEvent):
    """Evento disparado quando um paciente é chamado para atendimento."""
    
    paciente: Paciente = field(default=None)
    sala: str = ""
    
    def to_dict(self) -> dict:
        base = super().to_dict()
        base.update({
            "event_type": "PACIENTE_CHAMADO",
            "paciente": {
                "id": self.paciente.id,
                "nome_pet": self.paciente.nome_pet,
                "nome_tutor": self.paciente.nome_tutor,
                "status": self.paciente.status.value,
                "sala_atendimento": self.paciente.sala_atendimento,
            },
            "sala": self.sala,
        })
        return base


@dataclass
class PacienteFinalizadoEvent(DomainEvent):
    """Evento disparado quando um atendimento é finalizado."""
    
    paciente_id: str = ""
    
    def to_dict(self) -> dict:
        base = super().to_dict()
        base.update({
            "event_type": "PACIENTE_FINALIZADO",
            "paciente_id": self.paciente_id,
        })
        return base


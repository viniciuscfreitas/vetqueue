"""Value Objects - Objetos imutáveis que representam conceitos do domínio"""

from enum import Enum


class StatusPaciente(str, Enum):
    """
    Status possíveis para um paciente na fila.
    
    Herda de str para compatibilidade com JSON e Pydantic.
    """
    AGUARDANDO = "Aguardando"
    EM_ATENDIMENTO = "Em Atendimento"
    
    def __str__(self) -> str:
        return self.value


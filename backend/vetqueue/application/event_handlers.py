"""
Event Handlers - Handlers para Domain Events

Handlers que reagem a eventos de domínio e executam ações de infraestrutura,
como notificações via WebSocket, logging, envio de emails, etc.

Seguindo o padrão: Use Cases despacham eventos -> Handlers reagem
"""

import logging
from ..domain.events import (
    PacienteAdicionadoEvent,
    PacienteChamadoEvent,
    PacienteFinalizadoEvent,
)
from ..infrastructure.notifications.websocket_manager import websocket_manager

logger = logging.getLogger(__name__)


async def handle_paciente_adicionado(event: PacienteAdicionadoEvent) -> None:
    """
    Handler para o evento de paciente adicionado.
    
    Responsabilidades:
    - Notificar clientes WebSocket conectados sobre o novo paciente
    - Disparar evento genérico FILA_ATUALIZADA
    """
    logger.info(f"Handler: Paciente '{event.paciente.nome_pet}' adicionado")
    
    # Mensagem específica sobre o paciente adicionado
    message = event.to_dict()
    await websocket_manager.broadcast_to_room(event.fila_id, message)
    
    # Mensagem genérica de atualização da fila (para invalidação no frontend)
    fila_updated_message = {
        "event_type": "FILA_ATUALIZADA",
        "timestamp": event.timestamp.isoformat(),
        "fila_id": event.fila_id,
        "trigger": "PACIENTE_ADICIONADO",
    }
    await websocket_manager.broadcast_to_room(event.fila_id, fila_updated_message)


async def handle_paciente_chamado(event: PacienteChamadoEvent) -> None:
    """
    Handler para o evento de paciente chamado para atendimento.
    
    Responsabilidades:
    - Notificar clientes WebSocket sobre a chamada (importante para Painel Display)
    - Disparar evento genérico FILA_ATUALIZADA
    """
    logger.info(f"Handler: Paciente '{event.paciente.nome_pet}' chamado para sala '{event.sala}'")
    
    # Mensagem específica sobre a chamada (com dados completos para animação no Display)
    message = event.to_dict()
    await websocket_manager.broadcast_to_room(event.fila_id, message)
    
    # Mensagem genérica de atualização da fila
    fila_updated_message = {
        "event_type": "FILA_ATUALIZADA",
        "timestamp": event.timestamp.isoformat(),
        "fila_id": event.fila_id,
        "trigger": "PACIENTE_CHAMADO",
    }
    await websocket_manager.broadcast_to_room(event.fila_id, fila_updated_message)


async def handle_paciente_finalizado(event: PacienteFinalizadoEvent) -> None:
    """
    Handler para o evento de atendimento finalizado.
    
    Responsabilidades:
    - Notificar clientes WebSocket sobre a finalização
    - Disparar evento genérico FILA_ATUALIZADA
    """
    logger.info(f"Handler: Atendimento finalizado para paciente ID '{event.paciente_id}'")
    
    # Mensagem específica sobre a finalização
    message = event.to_dict()
    await websocket_manager.broadcast_to_room(event.fila_id, message)
    
    # Mensagem genérica de atualização da fila
    fila_updated_message = {
        "event_type": "FILA_ATUALIZADA",
        "timestamp": event.timestamp.isoformat(),
        "fila_id": event.fila_id,
        "trigger": "PACIENTE_FINALIZADO",
    }
    await websocket_manager.broadcast_to_room(event.fila_id, fila_updated_message)


def register_event_handlers() -> None:
    """
    Registra todos os event handlers no dispatcher.
    
    Deve ser chamado uma vez durante a inicialização da aplicação.
    """
    from ..domain.event_dispatcher import dispatcher
    
    dispatcher.subscribe(PacienteAdicionadoEvent, handle_paciente_adicionado)
    dispatcher.subscribe(PacienteChamadoEvent, handle_paciente_chamado)
    dispatcher.subscribe(PacienteFinalizadoEvent, handle_paciente_finalizado)
    
    logger.info("Event handlers registrados com sucesso")


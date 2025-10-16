"""
Event Dispatcher - Sistema Pub/Sub para Domain Events

Implementação simples de um Event Dispatcher para orquestrar
a comunicação entre Use Cases e Event Handlers sem acoplamento direto.
"""

from typing import Callable, Dict, List, Type
import asyncio
import logging

from .events import DomainEvent

logger = logging.getLogger(__name__)


class EventDispatcher:
    """
    Dispatcher singleton para gerenciar eventos de domínio.
    
    Permite que handlers se inscrevam para ouvir tipos específicos de eventos
    e os executa de forma assíncrona quando eventos são disparados.
    """
    
    _instance = None
    _handlers: Dict[Type[DomainEvent], List[Callable]] = {}
    
    def __new__(cls):
        """Garante que apenas uma instância do dispatcher existe (Singleton)."""
        if cls._instance is None:
            cls._instance = super(EventDispatcher, cls).__new__(cls)
            cls._instance._handlers = {}
        return cls._instance
    
    def subscribe(self, event_type: Type[DomainEvent], handler: Callable) -> None:
        """
        Inscreve um handler para ouvir um tipo específico de evento.
        
        Args:
            event_type: A classe do evento a ser ouvido
            handler: Função/método assíncrono que será chamado quando o evento ocorrer
        """
        if event_type not in self._handlers:
            self._handlers[event_type] = []
        
        self._handlers[event_type].append(handler)
        logger.info(f"Handler {handler.__name__} inscrito para {event_type.__name__}")
    
    async def dispatch(self, event: DomainEvent) -> None:
        """
        Despacha um evento para todos os handlers inscritos.
        
        Args:
            event: A instância do evento a ser despachado
        """
        event_type = type(event)
        handlers = self._handlers.get(event_type, [])
        
        if not handlers:
            logger.debug(f"Nenhum handler registrado para {event_type.__name__}")
            return
        
        logger.info(f"Despachando {event_type.__name__} para {len(handlers)} handler(s)")
        
        # Executa todos os handlers de forma assíncrona
        tasks = [handler(event) for handler in handlers]
        
        try:
            await asyncio.gather(*tasks)
        except Exception as e:
            logger.error(f"Erro ao executar handlers para {event_type.__name__}: {e}", exc_info=True)
            # Não propaga a exceção para não quebrar o fluxo principal
    
    def clear_handlers(self) -> None:
        """Limpa todos os handlers registrados. Útil para testes."""
        self._handlers = {}
        logger.info("Todos os handlers foram removidos")


# Instância global do dispatcher
dispatcher = EventDispatcher()


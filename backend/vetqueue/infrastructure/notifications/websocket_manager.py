"""
WebSocket Connection Manager

Gerencia conexões WebSocket ativas, organizadas por salas (rooms) baseadas em fila_id.
Preparado para arquitetura multi-tenant desde o Dia 1.
"""

from typing import Dict, List
from fastapi import WebSocket
import logging
import json

logger = logging.getLogger(__name__)


class WebSocketConnectionManager:
    """
    Gerenciador de conexões WebSocket com suporte a salas/rooms.
    
    Mantém um mapeamento de fila_id -> lista de conexões WebSocket ativas,
    permitindo broadcast seletivo de mensagens apenas para clientes interessados.
    """
    
    def __init__(self):
        # Mapeamento: fila_id -> List[WebSocket]
        self._active_connections: Dict[str, List[WebSocket]] = {}
    
    async def connect(self, websocket: WebSocket, fila_id: str) -> None:
        """
        Aceita e registra uma nova conexão WebSocket em uma sala específica.
        
        Args:
            websocket: A conexão WebSocket a ser registrada
            fila_id: ID da fila (sala) à qual o cliente deseja se conectar
        """
        await websocket.accept()
        
        if fila_id not in self._active_connections:
            self._active_connections[fila_id] = []
        
        self._active_connections[fila_id].append(websocket)
        logger.info(f"Nova conexão WebSocket na sala '{fila_id}'. Total: {len(self._active_connections[fila_id])}")
    
    def disconnect(self, websocket: WebSocket, fila_id: str) -> None:
        """
        Remove uma conexão WebSocket de uma sala.
        
        Args:
            websocket: A conexão WebSocket a ser removida
            fila_id: ID da fila (sala) da qual remover a conexão
        """
        if fila_id in self._active_connections:
            if websocket in self._active_connections[fila_id]:
                self._active_connections[fila_id].remove(websocket)
                logger.info(f"Conexão WebSocket removida da sala '{fila_id}'. Restantes: {len(self._active_connections[fila_id])}")
                
                # Remove a sala se não houver mais conexões
                if not self._active_connections[fila_id]:
                    del self._active_connections[fila_id]
                    logger.info(f"Sala '{fila_id}' removida (sem conexões ativas)")
    
    async def broadcast_to_room(self, fila_id: str, message: dict) -> None:
        """
        Envia uma mensagem para todas as conexões em uma sala específica.
        
        Args:
            fila_id: ID da fila (sala) para a qual enviar a mensagem
            message: Dicionário com a mensagem a ser enviada (será serializado para JSON)
        """
        if fila_id not in self._active_connections:
            logger.debug(f"Nenhuma conexão ativa na sala '{fila_id}' para broadcast")
            return
        
        connections = self._active_connections[fila_id].copy()  # Cópia para evitar modificação durante iteração
        message_json = json.dumps(message)
        
        logger.info(f"Broadcasting para {len(connections)} conexão(ões) na sala '{fila_id}': {message.get('event_type', 'UNKNOWN')}")
        
        # Lista de conexões que falharam (para remoção posterior)
        disconnected = []
        
        for connection in connections:
            try:
                await connection.send_text(message_json)
            except Exception as e:
                logger.warning(f"Erro ao enviar mensagem WebSocket: {e}")
                disconnected.append(connection)
        
        # Remove conexões que falharam
        for connection in disconnected:
            self.disconnect(connection, fila_id)
    
    async def broadcast_to_all(self, message: dict) -> None:
        """
        Envia uma mensagem para todas as conexões em todas as salas.
        
        Args:
            message: Dicionário com a mensagem a ser enviada (será serializado para JSON)
        """
        for fila_id in list(self._active_connections.keys()):
            await self.broadcast_to_room(fila_id, message)
    
    def get_active_connections_count(self, fila_id: str = None) -> int:
        """
        Retorna o número de conexões ativas.
        
        Args:
            fila_id: Se fornecido, retorna o count para uma sala específica.
                    Se None, retorna o total de todas as salas.
        
        Returns:
            Número de conexões ativas
        """
        if fila_id:
            return len(self._active_connections.get(fila_id, []))
        else:
            return sum(len(conns) for conns in self._active_connections.values())


# Instância singleton do manager
websocket_manager = WebSocketConnectionManager()


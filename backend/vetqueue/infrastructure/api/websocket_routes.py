"""
WebSocket Routes - Endpoints WebSocket

Define os endpoints WebSocket para comunicação em tempo real com o frontend.
"""

import logging
from fastapi import APIRouter, WebSocket, WebSocketDisconnect
from ..notifications.websocket_manager import websocket_manager

logger = logging.getLogger(__name__)

# Router para endpoints WebSocket
websocket_router = APIRouter()


@websocket_router.websocket("/ws/fila/{fila_id}")
async def websocket_fila_endpoint(websocket: WebSocket, fila_id: str):
    """
    Endpoint WebSocket para atualizações em tempo real da fila.
    
    Args:
        websocket: Conexão WebSocket
        fila_id: ID da fila (sala) à qual o cliente deseja se conectar
        
    Fluxo:
        1. Cliente conecta via ws://localhost:8000/ws/fila/{fila_id}
        2. Servidor aceita e registra a conexão no WebSocketManager
        3. Loop infinito mantém a conexão viva e aguarda mensagens
        4. Quando eventos de domínio ocorrem, handlers enviam mensagens broadcast
        5. Cliente desconecta, servidor faz cleanup
    """
    await websocket_manager.connect(websocket, fila_id)
    logger.info(f"Cliente conectado ao WebSocket - Fila: {fila_id}")
    
    try:
        # Loop para manter a conexão viva e receber mensagens do cliente
        while True:
            # Aguarda mensagens do cliente (heartbeat/ping ou comandos futuros)
            data = await websocket.receive_text()
            
            # Por enquanto, apenas loga mensagens recebidas
            # Futuramente, pode-se implementar comandos bidirecionais aqui
            logger.debug(f"Mensagem recebida do cliente (fila {fila_id}): {data}")
            
            # Echo de volta como heartbeat/pong
            if data == "ping":
                await websocket.send_text("pong")
    
    except WebSocketDisconnect:
        logger.info(f"Cliente desconectado do WebSocket - Fila: {fila_id}")
        websocket_manager.disconnect(websocket, fila_id)
    
    except Exception as e:
        logger.error(f"Erro na conexão WebSocket (fila {fila_id}): {e}", exc_info=True)
        websocket_manager.disconnect(websocket, fila_id)


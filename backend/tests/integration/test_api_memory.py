"""Testes de Integração - API REST com InMemory Repository (Sempre Funciona)"""

import pytest
from fastapi.testclient import TestClient
from unittest.mock import patch

from main import app
from vetqueue.infrastructure.persistence.memory_repository import InMemoryFilaRepository


# Cliente de teste com override do repositório para InMemory
@pytest.fixture
def client():
    """Fixture para criar um cliente de teste do FastAPI com InMemory Repository"""
    
    def override_get_repository():
        return InMemoryFilaRepository()
    
    # Override da dependency para usar o repositório em memória
    from vetqueue.infrastructure.api.dependencies import get_repository
    app.dependency_overrides = {
        get_repository: override_get_repository
    }
    
    yield TestClient(app)
    
    # Limpar overrides após o teste
    app.dependency_overrides.clear()


class TestHealthCheckMemory:
    """Testes para o endpoint de health check com InMemory"""
    
    def test_root_endpoint(self, client):
        """Deve retornar status healthy no endpoint raiz"""
        response = client.get("/")
        
        assert response.status_code == 200
        data = response.json()
        assert data["status"] == "healthy"
        assert data["service"] == "VetQueue API"


class TestPacientesEndpointsMemory:
    """Testes para endpoints de pacientes com InMemory"""
    
    def test_adicionar_paciente(self, client):
        """Deve adicionar um novo paciente com sucesso"""
        paciente_data = {
            "nome_pet": "Rex",
            "nome_tutor": "João Silva"
        }
        
        response = client.post("/pacientes", json=paciente_data)
        
        assert response.status_code == 201
        data = response.json()
        assert data["nome_pet"] == "Rex"
        assert data["nome_tutor"] == "João Silva"
        assert data["status"] == "Aguardando"
        assert "id" in data
    
    def test_listar_pacientes_aguardando(self, client):
        """Deve listar pacientes aguardando"""
        # Adicionar um paciente primeiro
        paciente_data = {
            "nome_pet": "Mimi",
            "nome_tutor": "Maria Santos"
        }
        client.post("/pacientes", json=paciente_data)
        
        # Listar pacientes aguardando
        response = client.get("/fila")
        
        assert response.status_code == 200
        data = response.json()
        assert len(data) >= 1
        assert data[0]["status"] == "Aguardando"
    
    def test_chamar_paciente(self, client):
        """Deve chamar um paciente para atendimento"""
        # Adicionar um paciente primeiro
        paciente_data = {
            "nome_pet": "Bolt",
            "nome_tutor": "Ana Costa"
        }
        response = client.post("/pacientes", json=paciente_data)
        paciente_id = response.json()["id"]
        
        # Chamar paciente
        chamada_data = {"sala": "Sala 1"}
        response = client.put(f"/pacientes/{paciente_id}/chamar", json=chamada_data)
        
        assert response.status_code == 200
        data = response.json()
        assert data["status"] == "Em Atendimento"
        assert data["sala_atendimento"] == "Sala 1"
    
    def test_finalizar_atendimento(self, client):
        """Deve finalizar atendimento de um paciente"""
        # Adicionar e chamar um paciente
        paciente_data = {
            "nome_pet": "Luna",
            "nome_tutor": "Carlos Oliveira"
        }
        response = client.post("/pacientes", json=paciente_data)
        paciente_id = response.json()["id"]
        
        # Chamar paciente
        chamada_data = {"sala": "Sala 2"}
        client.put(f"/pacientes/{paciente_id}/chamar", json=chamada_data)
        
        # Finalizar atendimento
        response = client.delete(f"/pacientes/{paciente_id}")
        
        assert response.status_code == 200
        data = response.json()
        assert data["message"] == "Atendimento finalizado com sucesso"


class TestFilaEndpointsMemory:
    """Testes para endpoints de fila com InMemory"""
    
    def test_obter_fila_completa(self, client):
        """Deve retornar a fila completa"""
        # Adicionar alguns pacientes
        pacientes = [
            {"nome_pet": "Dog1", "nome_tutor": "Tutor1"},
            {"nome_pet": "Dog2", "nome_tutor": "Tutor2"}
        ]
        
        for paciente in pacientes:
            client.post("/pacientes", json=paciente)
        
        # Obter fila completa
        response = client.get("/fila")
        
        assert response.status_code == 200
        data = response.json()
        assert "aguardando" in data
        assert "em_atendimento" in data
        assert len(data["aguardando"]) >= 2

"""Testes de Integração - API REST com PostgreSQL"""

import pytest
from fastapi.testclient import TestClient
from unittest.mock import patch

from main import app
from vetqueue.infrastructure.persistence.postgres_repository import PostgresFilaRepository


# Cliente de teste com override do repositório
@pytest.fixture
def client(test_repository):
    """Fixture para criar um cliente de teste do FastAPI com PostgreSQL"""
    
    def override_get_repository():
        return test_repository
    
    # Override da dependency para usar o repositório de teste
    from vetqueue.infrastructure.api.dependencies import get_repository
    app.dependency_overrides = {
        get_repository: override_get_repository
    }
    
    yield TestClient(app)
    
    # Limpar overrides após o teste
    app.dependency_overrides.clear()


class TestHealthCheck:
    """Testes para o endpoint de health check"""
    
    def test_root_endpoint(self, client):
        """Deve retornar status healthy no endpoint raiz"""
        response = client.get("/")
        
        assert response.status_code == 200
        data = response.json()
        assert data["status"] == "healthy"
        assert data["service"] == "VetQueue API"


class TestAuthEndpoints:
    """Testes para endpoints de autenticação"""
    
    def test_login_com_credenciais_validas(self, client):
        """Deve fazer login com sucesso usando credenciais válidas"""
        response = client.post(
            "/auth/login",
            json={"user": "admin", "pass": "1234"}
        )
        
        assert response.status_code == 200
        data = response.json()
        assert data["nome"] == "Dr. Ricardo"
        assert data["token"] == "fake-jwt-token"
    
    def test_login_com_credenciais_invalidas(self, client):
        """Deve retornar 401 com credenciais inválidas"""
        response = client.post(
            "/auth/login",
            json={"user": "admin", "pass": "senha_errada"}
        )
        
        assert response.status_code == 401
        data = response.json()
        assert "inválidos" in data["detail"].lower()


class TestFilaEndpoints:
    """Testes para endpoints da fila"""
    
    def test_obter_fila_vazia(self, client):
        """Deve retornar fila vazia inicialmente"""
        response = client.get("/fila")
        
        assert response.status_code == 200
        data = response.json()
        assert data["aguardando"] == []
        assert data["em_atendimento"] == []
    
    def test_obter_fila_com_pacientes(self, client):
        """Deve retornar pacientes na fila após adicionar"""
        # Adicionar um paciente aguardando
        client.post(
            "/pacientes",
            json={"nome_pet": "Bolinha", "nome_tutor": "Maria Silva"}
        )
        
        # Obter fila
        response = client.get("/fila")
        
        assert response.status_code == 200
        data = response.json()
        assert len(data["aguardando"]) == 1
        assert len(data["em_atendimento"]) == 0
        assert data["aguardando"][0]["nome_pet"] == "Bolinha"


class TestPacientesEndpoints:
    """Testes para endpoints de pacientes"""
    
    def test_adicionar_paciente_com_sucesso(self, client):
        """Deve adicionar um paciente com sucesso"""
        response = client.post(
            "/pacientes",
            json={"nome_pet": "Bolinha", "nome_tutor": "Maria Silva"}
        )
        
        assert response.status_code == 201
        data = response.json()
        assert data["nome_pet"] == "Bolinha"
        assert data["nome_tutor"] == "Maria Silva"
        assert data["status"] == "Aguardando"
        assert data["sala_atendimento"] is None
        assert "id" in data
    
    def test_adicionar_paciente_nome_pet_vazio_deve_falhar(self, client):
        """Não deve adicionar paciente com nome do pet vazio"""
        response = client.post(
            "/pacientes",
            json={"nome_pet": "", "nome_tutor": "Maria Silva"}
        )
        
        assert response.status_code == 422  # Pydantic validation error
    
    def test_adicionar_paciente_nome_tutor_vazio_deve_falhar(self, client):
        """Não deve adicionar paciente com nome do tutor vazio"""
        response = client.post(
            "/pacientes",
            json={"nome_pet": "Bolinha", "nome_tutor": ""}
        )
        
        assert response.status_code == 422  # Pydantic validation error
    
    def test_adicionar_paciente_sem_campos_obrigatorios_deve_falhar(self, client):
        """Não deve adicionar paciente sem campos obrigatórios"""
        response = client.post(
            "/pacientes",
            json={}
        )
        
        assert response.status_code == 422  # Validation error
    
    def test_chamar_paciente_para_atendimento_com_sucesso(self, client):
        """Deve chamar paciente para atendimento com sucesso"""
        # Adicionar paciente
        add_response = client.post(
            "/pacientes",
            json={"nome_pet": "Bolinha", "nome_tutor": "Maria Silva"}
        )
        paciente_id = add_response.json()["id"]
        
        # Chamar para atendimento
        response = client.put(
            f"/pacientes/{paciente_id}/chamar",
            json={"sala": "Consultório 1"}
        )
        
        assert response.status_code == 200
        data = response.json()
        assert data["status"] == "Em Atendimento"
        assert data["sala_atendimento"] == "Consultório 1"
    
    def test_chamar_paciente_inexistente_deve_falhar(self, client):
        """Não deve chamar paciente que não existe"""
        fake_id = "123e4567-e89b-12d3-a456-426614174000"
        
        response = client.put(
            f"/pacientes/{fake_id}/chamar",
            json={"sala": "Consultório 1"}
        )
        
        assert response.status_code == 404
    
    def test_chamar_paciente_ja_em_atendimento_deve_falhar(self, client):
        """Não deve chamar paciente que já está em atendimento"""
        # Adicionar e chamar paciente
        add_response = client.post(
            "/pacientes",
            json={"nome_pet": "Bolinha", "nome_tutor": "Maria Silva"}
        )
        paciente_id = add_response.json()["id"]
        
        client.put(
            f"/pacientes/{paciente_id}/chamar",
            json={"sala": "Consultório 1"}
        )
        
        # Tentar chamar novamente
        response = client.put(
            f"/pacientes/{paciente_id}/chamar",
            json={"sala": "Consultório 2"}
        )
        
        assert response.status_code == 409  # Conflict
    
    def test_chamar_paciente_sala_vazia_deve_falhar(self, client):
        """Não deve chamar paciente com sala vazia"""
        # Adicionar paciente
        add_response = client.post(
            "/pacientes",
            json={"nome_pet": "Bolinha", "nome_tutor": "Maria Silva"}
        )
        paciente_id = add_response.json()["id"]
        
        # Tentar chamar com sala vazia
        response = client.put(
            f"/pacientes/{paciente_id}/chamar",
            json={"sala": ""}
        )
        
        assert response.status_code == 422  # Pydantic validation error
    
    def test_finalizar_atendimento_com_sucesso(self, client):
        """Deve finalizar atendimento com sucesso"""
        # Adicionar e chamar paciente
        add_response = client.post(
            "/pacientes",
            json={"nome_pet": "Bolinha", "nome_tutor": "Maria Silva"}
        )
        paciente_id = add_response.json()["id"]
        
        client.put(
            f"/pacientes/{paciente_id}/chamar",
            json={"sala": "Consultório 1"}
        )
        
        # Finalizar atendimento
        response = client.delete(f"/pacientes/{paciente_id}")
        
        assert response.status_code == 200
        data = response.json()
        assert data["id"] == paciente_id
        
        # Verificar que foi removido da fila
        fila_response = client.get("/fila")
        fila_data = fila_response.json()
        assert len(fila_data["aguardando"]) == 0
        assert len(fila_data["em_atendimento"]) == 0
    
    def test_finalizar_atendimento_paciente_inexistente_deve_falhar(self, client):
        """Não deve finalizar atendimento de paciente que não existe"""
        fake_id = "123e4567-e89b-12d3-a456-426614174000"
        
        response = client.delete(f"/pacientes/{fake_id}")
        
        assert response.status_code == 404
    
    def test_finalizar_atendimento_paciente_nao_esta_em_atendimento_deve_falhar(self, client):
        """Não deve finalizar atendimento de paciente que não está em atendimento"""
        # Adicionar paciente (mas não chamar para atendimento)
        add_response = client.post(
            "/pacientes",
            json={"nome_pet": "Bolinha", "nome_tutor": "Maria Silva"}
        )
        paciente_id = add_response.json()["id"]
        
        # Tentar finalizar atendimento
        response = client.delete(f"/pacientes/{paciente_id}")
        
        assert response.status_code == 409  # Conflict


class TestFluxoCompleto:
    """Testes de fluxo completo (end-to-end)"""
    
    def test_fluxo_completo_adicionar_chamar_finalizar(self, client):
        """Deve executar fluxo completo: adicionar -> chamar -> finalizar"""
        # 1. Verificar fila vazia
        fila = client.get("/fila").json()
        assert len(fila["aguardando"]) == 0
        assert len(fila["em_atendimento"]) == 0
        
        # 2. Adicionar paciente
        add_response = client.post(
            "/pacientes",
            json={"nome_pet": "Bolinha", "nome_tutor": "Maria Silva"}
        )
        assert add_response.status_code == 201
        paciente_id = add_response.json()["id"]
        
        # 3. Verificar paciente na fila aguardando
        fila = client.get("/fila").json()
        assert len(fila["aguardando"]) == 1
        assert len(fila["em_atendimento"]) == 0
        
        # 4. Chamar para atendimento
        chamar_response = client.put(
            f"/pacientes/{paciente_id}/chamar",
            json={"sala": "Consultório 1"}
        )
        assert chamar_response.status_code == 200
        
        # 5. Verificar paciente em atendimento
        fila = client.get("/fila").json()
        assert len(fila["aguardando"]) == 0
        assert len(fila["em_atendimento"]) == 1
        assert fila["em_atendimento"][0]["sala_atendimento"] == "Consultório 1"
        
        # 6. Finalizar atendimento
        finalizar_response = client.delete(f"/pacientes/{paciente_id}")
        assert finalizar_response.status_code == 200
        
        # 7. Verificar fila vazia novamente
        fila = client.get("/fila").json()
        assert len(fila["aguardando"]) == 0
        assert len(fila["em_atendimento"]) == 0
    
    def test_fluxo_multiplos_pacientes(self, client):
        """Deve gerenciar múltiplos pacientes simultaneamente"""
        # Adicionar 3 pacientes
        paciente1_id = client.post(
            "/pacientes",
            json={"nome_pet": "Bolinha", "nome_tutor": "Maria Silva"}
        ).json()["id"]
        
        paciente2_id = client.post(
            "/pacientes",
            json={"nome_pet": "Rex", "nome_tutor": "João Silva"}
        ).json()["id"]
        
        paciente3_id = client.post(
            "/pacientes",
            json={"nome_pet": "Mimi", "nome_tutor": "Ana Pereira"}
        ).json()["id"]
        
        # Verificar 3 aguardando
        fila = client.get("/fila").json()
        assert len(fila["aguardando"]) == 3
        assert len(fila["em_atendimento"]) == 0
        
        # Chamar 2 para atendimento
        client.put(f"/pacientes/{paciente1_id}/chamar", json={"sala": "Consultório 1"})
        client.put(f"/pacientes/{paciente2_id}/chamar", json={"sala": "Consultório 2"})
        
        # Verificar 1 aguardando, 2 em atendimento
        fila = client.get("/fila").json()
        assert len(fila["aguardando"]) == 1
        assert len(fila["em_atendimento"]) == 2
        
        # Finalizar 1 atendimento
        client.delete(f"/pacientes/{paciente1_id}")
        
        # Verificar 1 aguardando, 1 em atendimento
        fila = client.get("/fila").json()
        assert len(fila["aguardando"]) == 1
        assert len(fila["em_atendimento"]) == 1


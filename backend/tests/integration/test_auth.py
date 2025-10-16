"""Testes de Integração - Autenticação JWT"""

import pytest
from fastapi.testclient import TestClient

from main import app


# Cliente de teste
@pytest.fixture
def client():
    """Fixture para criar um cliente de teste do FastAPI"""
    return TestClient(app)


class TestAuthEndpoints:
    """Testes para endpoints de autenticação"""
    
    def test_register_user(self, client):
        """Deve registrar um novo usuário com sucesso"""
        user_data = {
            "username": "testuser",
            "email": "test@example.com",
            "password": "testpass123",
            "full_name": "Test User"
        }
        
        response = client.post("/auth/register", json=user_data)
        
        assert response.status_code == 201
        data = response.json()
        assert data["message"] == "Usuário criado com sucesso"
        assert data["user"]["username"] == "testuser"
        assert data["user"]["email"] == "test@example.com"
        assert data["user"]["is_admin"] == False
    
    def test_login_with_valid_credentials(self, client):
        """Deve fazer login com credenciais válidas"""
        # Primeiro registrar um usuário
        user_data = {
            "username": "logintest",
            "email": "login@example.com",
            "password": "loginpass123"
        }
        client.post("/auth/register", json=user_data)
        
        # Fazer login
        login_data = {
            "username": "logintest",
            "password": "loginpass123"
        }
        
        response = client.post("/auth/login", json=login_data)
        
        assert response.status_code == 200
        data = response.json()
        assert "access_token" in data
        assert "refresh_token" in data
        assert data["token_type"] == "bearer"
        assert data["user"]["username"] == "logintest"
    
    def test_login_with_invalid_credentials(self, client):
        """Deve falhar com credenciais inválidas"""
        login_data = {
            "username": "nonexistent",
            "password": "wrongpass"
        }
        
        response = client.post("/auth/login", json=login_data)
        
        assert response.status_code == 401
        assert "Credenciais inválidas" in response.json()["detail"]
    
    def test_get_current_user_without_token(self, client):
        """Deve falhar ao acessar /me sem token"""
        response = client.get("/auth/me")
        
        assert response.status_code == 403  # Forbidden - sem token
    
    def test_get_current_user_with_valid_token(self, client):
        """Deve retornar dados do usuário com token válido"""
        # Registrar e fazer login
        user_data = {
            "username": "meuser",
            "email": "me@example.com",
            "password": "mepass123"
        }
        client.post("/auth/register", json=user_data)
        
        login_data = {
            "username": "meuser",
            "password": "mepass123"
        }
        login_response = client.post("/auth/login", json=login_data)
        token = login_response.json()["access_token"]
        
        # Acessar /me com token
        headers = {"Authorization": f"Bearer {token}"}
        response = client.get("/auth/me", headers=headers)
        
        assert response.status_code == 200
        data = response.json()
        assert data["username"] == "meuser"
        assert data["email"] == "me@example.com"

# Análise de Problema de Autenticação (401 Unauthorized)

## 🔍 Análise Grug (Seguindo Cursor Rules)

### Problema Identificado
- Erro 401 ao fazer login mesmo com senha correta
- URL: `https://fisiopet.petshopcisnebranco.com.br/api/auth/login`

### Possíveis Causas (em ordem de probabilidade)

#### 1. **Senha no banco foi criada ANTES da correção do trim()** ⚠️ MAIS PROVÁVEL
- **Cenário**: Seed foi executado antes da correção que adiciona trim() no login
- **Problema**: Hash no banco foi feito com senha sem trim, mas agora fazemos trim no login
- **Solução**: Resetar senhas usando endpoint `/api/auth/reset-password`

#### 2. **Seed não foi executado no ambiente de produção**
- **Cenário**: Usuários não existem no banco
- **Verificação**: Checar logs do backend - deve aparecer "Login failed - user not found"
- **Solução**: Executar seed no ambiente de produção

#### 3. **Problema de encoding/caracteres especiais**
- **Cenário**: Senha tem caracteres invisíveis ou encoding diferente
- **Verificação**: Usar endpoint `/api/auth/test-bcrypt` para ver `passwordChars`
- **Solução**: Resetar senha com senha limpa

#### 4. **Senha digitada diferente da esperada**
- **Cenário**: Usuário está digitando senha errada
- **Senhas esperadas do seed**:
  - `recepcao` → `senha123`
  - `alex` → `alex`
  - `drjoao` → `senha123`

## 🧪 Como Testar o Problema

### Teste 1: Endpoint de Diagnóstico (RECOMENDADO)

```bash
curl -X POST https://fisiopet.petshopcisnebranco.com.br/api/auth/test-bcrypt \
  -H "Content-Type: application/json" \
  -d '{"username": "recepcao", "password": "senha123"}'
```

**O que verificar:**
- `compareWithStored`: deve ser `true` se senha está correta
- `compareWithStoredTrimmed`: deve ser `true` se senha com trim funciona
- `passwordChars`: verificar se há caracteres estranhos
- `inputLength` vs `inputLengthTrimmed`: verificar se há espaços

### Teste 2: Verificar Logs do Backend

Procurar por estas mensagens nos logs:

1. `Login route called` - mostra dados recebidos (antes do trim)
2. `Login schema parsed` - mostra dados após validação (com trim)
3. `User found` - confirma que usuário existe
4. `Password comparison` - mostra resultado da comparação

**Exemplo de log esperado:**
```
Login route called: { username: "recepcao", passwordLength: 8 }
Login schema parsed: { parsedUsername: "recepcao", parsedPasswordLength: 8 }
User found: { username: "recepcao", hasPassword: true }
Password comparison: { passwordMatch: false }  // <-- AQUI está o problema
```

### Teste 3: Resetar Senha

Se o problema for hash antigo, resetar:

```bash
curl -X POST https://fisiopet.petshopcisnebranco.com.br/api/auth/reset-password \
  -H "Content-Type: application/json" \
  -d '{"username": "recepcao", "newPassword": "senha123"}'
```

Depois testar login novamente.

### Teste 4: Verificar Usuários no Banco

```sql
SELECT username, name, role, 
       LENGTH(password) as password_length,
       SUBSTRING(password, 1, 30) as password_prefix,
       created_at
FROM "User"
WHERE username IN ('recepcao', 'alex', 'drjoao');
```

## 🔧 Soluções Implementadas

### 1. Consistência no trim()
- ✅ Login agora faz trim() na senha (igual criação de usuário)
- ✅ Criação de usuário faz trim() antes de fazer hash
- ✅ Evita inconsistências entre criação e autenticação

### 2. Endpoint de Diagnóstico Melhorado
- ✅ `/api/auth/test-bcrypt` agora testa com e sem trim()
- ✅ Mostra caracteres da senha (para debug de encoding)
- ✅ Compara com hash armazenado e novo hash

### 3. Testes de Integração
- ✅ Criado `authRoutes.integration.test.ts`
- ✅ Testa login com senha correta
- ✅ Testa login com senha incorreta
- ✅ Testa login com espaços (trim)
- ✅ Testa validações (senha vazia, etc)

## 📋 Checklist de Diagnóstico

- [ ] Executar endpoint `/api/auth/test-bcrypt` com senha conhecida
- [ ] Verificar logs do backend durante tentativa de login
- [ ] Verificar se usuários existem no banco
- [ ] Verificar se senhas foram criadas antes ou depois da correção
- [ ] Testar reset de senha se necessário
- [ ] Executar testes de integração localmente

## 🎯 Próximos Passos

1. **Imediato**: Executar endpoint de diagnóstico em produção
2. **Se hash antigo**: Resetar senhas usando `/api/auth/reset-password`
3. **Se usuários não existem**: Executar seed no ambiente de produção
4. **Se problema persiste**: Verificar logs detalhados do backend

## 🔒 Segurança

- ✅ Endpoints de diagnóstico devem ser removidos ou protegidos em produção
- ✅ Endpoint `/api/auth/reset-password` deve ter autenticação em produção
- ✅ Logs não devem expor senhas completas (apenas prefixos e caracteres)

## 📝 Notas Grug

- **Não quebrar o que funciona**: Mantivemos compatibilidade com senhas existentes
- **Logging é importante**: Logs detalhados ajudam a diagnosticar
- **Testes de integração**: Criados para garantir que funciona
- **Simplicidade**: Solução direta sem over-engineering


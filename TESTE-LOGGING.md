# Testes de Logging - Benefícios Práticos

## 🎯 Benefícios Práticos

### 1. **Correlação de Logs (Request ID)**

**Antes:** Quando um erro acontecia, você tinha que procurar manualmente nos logs tentando juntar os pedaços.

**Agora:** Todos os logs de uma mesma requisição têm o mesmo `requestId`. Você pode:
- Filtrar por `requestId` no Dozzle e ver TUDO que aconteceu naquela requisição
- Rastrear o caminho completo: middleware → service → repository → erro
- Identificar onde exatamente o problema aconteceu

**Exemplo Real:**
```
User reporta: "Não consegui adicionar paciente na fila"
Antes: Procurar manualmente nos logs, tentar adivinhar qual requisição
Agora: Pegar requestId do erro, filtrar no Dozzle, ver toda a jornada
```

### 2. **Debug Rápido em Produção (Per-User Log Level)**

**Antes:** Para debugar um problema específico, você tinha que:
- Mudar `LOG_LEVEL=debug` globalmente (gera MUITO log)
- Reiniciar o servidor
- Depois voltar o nível normal

**Agora:** 
- Enviar header `X-Log-Level: debug` na requisição problemática
- Só AQUELE request vai ter logs debug
- Zero impacto em produção

**Exemplo Real:**
```
Cliente reporta problema específico
Você: "Envia essa requisição com header X-Log-Level: debug"
Agora você vê logs detalhados só daquela requisição
```

### 3. **Validações com Contexto**

**Antes:** Validação falhava, você só via o erro genérico.

**Agora:** Cada validação loga ANTES de falhar, com contexto completo:
- O que foi validado
- Por que falhou
- Valores recebidos
- RequestId para rastrear

**Exemplo Real:**
```
User tenta criar serviço com nome vazio
Antes: "Nome do serviço é obrigatório" (sem contexto)
Agora: Log mostra exatamente o que foi recebido, requestId, etc.
```

---

## 🧪 Como Testar

### Pré-requisitos

```bash
# Backend rodando
cd packages/backend
npm run dev

# Ou via Docker
docker compose up -d backend
```

### Teste 1: RequestId Automático (Correlação)

```bash
# Fazer uma requisição que passa por vários serviços
curl -X POST http://localhost:3002/api/queue \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer SEU_TOKEN" \
  -d '{
    "patientName": "Rex",
    "tutorName": "João Silva",
    "serviceType": "Consulta"
  }'

# No Dozzle (http://localhost:8888), filtrar por:
# requestId: "uuid-que-apareceu-no-response-header-X-Request-ID"

# Você verá TODOS os logs daquela requisição:
# - Request started
# - Adding to queue (queueService)
# - Queue entry created
# - Request completed
# TODOS com o mesmo requestId!
```

**Resultado Esperado:**
```json
{"timestamp":"2025-01-05T...","level":"info","message":"Request started","requestId":"abc-123","method":"POST","path":"/api/queue"}
{"timestamp":"2025-01-05T...","level":"info","message":"Adding to queue","requestId":"abc-123","patientName":"Rex","tutorName":"João Silva"}
{"timestamp":"2025-01-05T...","level":"debug","message":"Queue entry created","requestId":"abc-123","entryId":"xyz-789"}
{"timestamp":"2025-01-05T...","level":"info","message":"Request completed","requestId":"abc-123","statusCode":201,"duration":"45ms"}
```

### Teste 2: Per-User Log Level (Debug Rápido)

```bash
# Request normal (sem header) - só mostra info/warn/error
curl http://localhost:3002/api/health

# Request com debug (header X-Log-Level)
curl -H "X-Log-Level: debug" http://localhost:3002/api/health

# Agora você verá logs debug também:
# - Health check passed (debug)
# - Todos os logs debug aparecem
```

**Resultado Esperado:**

**Sem header:**
```json
{"timestamp":"...","level":"info","message":"Request started","requestId":"..."}
{"timestamp":"...","level":"info","message":"Request completed","requestId":"...","statusCode":200}
```

**Com header X-Log-Level: debug:**
```json
{"timestamp":"...","level":"info","message":"Request started","requestId":"..."}
{"timestamp":"...","level":"debug","message":"Health check passed","requestId":"..."}
{"timestamp":"...","level":"info","message":"Request completed","requestId":"...","statusCode":200}
```

### Teste 3: Validações com Logs

```bash
# Tentar criar serviço sem nome (vai falhar)
curl -X POST http://localhost:3002/api/services \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer SEU_TOKEN" \
  -d '{"name": ""}'

# Verificar logs no Dozzle
# Você verá:
# - Request started
# - Service name is empty (WARNING com requestId)
# - Request completed com statusCode 400
```

**Resultado Esperado:**
```json
{"timestamp":"...","level":"info","message":"Request started","requestId":"def-456","method":"POST","path":"/api/services"}
{"timestamp":"...","level":"warn","message":"Service name is empty","requestId":"def-456"}
{"timestamp":"...","level":"warn","message":"Request completed","requestId":"def-456","statusCode":400}
```

### Teste 4: Validação de Header Inválido

```bash
# Enviar header X-Log-Level com valor inválido
curl -H "X-Log-Level: invalid" http://localhost:3002/api/health

# Verificar logs - deve aparecer warning
```

**Resultado Esperado:**
```json
{"timestamp":"...","level":"warn","message":"Invalid X-Log-Level header value","requestId":"ghi-789","providedValue":"invalid","validValues":["debug","info","warn","error"]}
```

### Teste 5: Rastreamento Completo de Erro

```bash
# Fazer request que vai falhar em vários pontos
curl -X POST http://localhost:3002/api/queue \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer SEU_TOKEN" \
  -d '{
    "patientName": "",
    "tutorName": "Teste",
    "serviceType": "Consulta"
  }'

# Pegar o requestId do header X-Request-ID da resposta
# Filtrar no Dozzle por esse requestId
# Ver toda a jornada do erro:
```

**Resultado Esperado:**
```json
{"timestamp":"...","level":"info","message":"Request started","requestId":"jkl-012","method":"POST","path":"/api/queue"}
{"timestamp":"...","level":"info","message":"Adding to queue","requestId":"jkl-012","patientName":"","tutorName":"Teste"}
{"timestamp":"...","level":"warn","message":"Missing required fields","requestId":"jkl-012","hasPatientName":false,"hasTutorName":true}
{"timestamp":"...","level":"warn","message":"Request completed","requestId":"jkl-012","statusCode":400}
```

---

## 📊 Visualizando no Dozzle

1. Acesse: http://localhost:8888
2. Selecione container: `vetqueue-backend-1`
3. Use filtros:
   - Por requestId: Cole o requestId no campo de busca
   - Por nível: `level:error` ou `level:warn`
   - Por mensagem: `message:"Adding to queue"`

---

## 🔍 Casos de Uso Reais

### Caso 1: Bug em Produção
```
1. Cliente reporta erro
2. Você pega o requestId do erro (se tiver, senão pede para fazer request novamente)
3. Filtra no Dozzle por requestId
4. Vê EXATAMENTE o que aconteceu, passo a passo
5. Identifica o problema rapidamente
```

### Caso 2: Debug de Performance
```
1. Request lenta reportada
2. Filtra por requestId no Dozzle
3. Vê todos os logs com timestamps
4. Identifica qual operação está demorando
```

### Caso 3: Investigação de Validação
```
1. Cliente diz "não aceita meu dado"
2. Pede para fazer request com X-Log-Level: debug
3. Vê logs detalhados da validação
4. Entende exatamente por que foi rejeitado
```

---

## 🎁 Benefícios Resumidos

✅ **Debug 10x mais rápido** - Correlação automática de logs
✅ **Zero impacto em produção** - Debug por request, não global
✅ **Contexto completo** - Todas as validações logam antes de falhar
✅ **Rastreabilidade** - RequestId em todos os logs automaticamente
✅ **Simplicidade** - Zero configuração, funciona automaticamente


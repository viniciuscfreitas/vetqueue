# Guia de Implementação - Redução de Fricção

Este documento contém exemplos práticos de código para implementar as melhorias identificadas na análise de fricção.

---

## 🚀 Quick Wins (Fase 1)

### 1. Reduzir Debounce e Adicionar Navegação por Teclado

**Arquivo:** `packages/frontend/src/components/TutorAutocomplete.tsx`

```typescript
// ANTES: Debounce 300ms, sem navegação por teclado
useEffect(() => {
  const timer = setTimeout(() => {
    setDebouncedSearch(searchTerm);
  }, 300);
  return () => clearTimeout(timer);
}, [searchTerm]);

// DEPOIS: Debounce 150ms + navegação por teclado
const [highlightedIndex, setHighlightedIndex] = useState(-1);

useEffect(() => {
  const timer = setTimeout(() => {
    setDebouncedSearch(searchTerm);
  }, 150); // Reduzido de 300ms
  return () => clearTimeout(timer);
}, [searchTerm]);

// Adicionar handler de teclado
const handleKeyDown = (e: React.KeyboardEvent) => {
  if (!showDropdown || filteredTutors.length === 0) return;

  switch (e.key) {
    case "ArrowDown":
      e.preventDefault();
      setHighlightedIndex((prev) => 
        prev < filteredTutors.length - 1 ? prev + 1 : 0
      );
      break;
    case "ArrowUp":
      e.preventDefault();
      setHighlightedIndex((prev) => 
        prev > 0 ? prev - 1 : filteredTutors.length - 1
      );
      break;
    case "Enter":
      e.preventDefault();
      if (highlightedIndex >= 0) {
        handleSelect(filteredTutors[highlightedIndex]);
      }
      break;
    case "Escape":
      setShowDropdown(false);
      setHighlightedIndex(-1);
      break;
  }
};

// Atualizar Input
<Input
  // ... props existentes
  onKeyDown={handleKeyDown}
/>

// Atualizar dropdown com highlight
{filteredTutors.map((tutor, index) => (
  <button
    key={tutor.id}
    type="button"
    onClick={() => handleSelect(tutor)}
    className={`w-full text-left px-4 py-2 hover:bg-accent ${
      index === highlightedIndex ? 'bg-accent' : ''
    }`}
  >
    {tutor.name}
  </button>
))}
```

---

### 2. Documentar Atalhos de Teclado

**Arquivo:** `packages/frontend/src/components/KeyboardShortcuts.tsx` (novo)

```typescript
"use client";

import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "./ui/dialog";
import { Button } from "./ui/button";
import { HelpCircle, Keyboard } from "lucide-react";

const SHORTCUTS = [
  { key: "Enter", description: "Chamar próximo paciente na fila" },
  { key: "Ctrl + N", description: "Abrir formulário de adicionar à fila (Recepcionista)" },
  { key: "Esc", description: "Fechar modais e cancelar ações" },
  { key: "↑ ↓", description: "Navegar sugestões de autocomplete" },
  { key: "Tab", description: "Navegar entre campos do formulário" },
];

export function KeyboardShortcuts() {
  const [open, setOpen] = useState(false);

  return (
    <>
      <Button
        variant="ghost"
        size="sm"
        onClick={() => setOpen(true)}
        className="text-xs"
        title="Ver atalhos de teclado"
      >
        <Keyboard className="h-4 w-4 mr-1" />
        Atalhos
      </Button>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <HelpCircle className="h-5 w-5" />
              Atalhos de Teclado
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-3 mt-4">
            {SHORTCUTS.map((shortcut) => (
              <div key={shortcut.key} className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">
                  {shortcut.description}
                </span>
                <kbd className="px-2 py-1 text-xs font-semibold bg-muted rounded border">
                  {shortcut.key}
                </kbd>
              </div>
            ))}
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
```

**Integrar no Header:**
```typescript
// packages/frontend/src/components/Header.tsx
import { KeyboardShortcuts } from "./KeyboardShortcuts";

// Adicionar antes do botão de logout
<KeyboardShortcuts />
```

---

### 3. Melhorar Feedback Visual

**Arquivo:** `packages/frontend/src/hooks/useQueueMutations.ts`

```typescript
// Adicionar animação de sucesso
import { CheckCircle2 } from "lucide-react";

const onSuccess = () => {
  toast({
    title: "✅ Sucesso",
    description: "Ação realizada com sucesso",
    duration: 2000,
    className: "border-green-500 bg-green-50",
  });
  
  // Animação de confirmação
  queryClient.invalidateQueries({ queryKey: ["queue"] });
};
```

**Componente de Toast Melhorado:**
```typescript
// packages/frontend/src/components/ui/toast.tsx
// Adicionar variante de sucesso com ícone
{toast.variant === "success" && (
  <CheckCircle2 className="h-5 w-5 text-green-600 animate-in fade-in" />
)}
```

---

### 4. Aumentar Timeout e Adicionar Retry

**Arquivo:** `packages/frontend/src/lib/api.ts`

```typescript
import axios, { AxiosError } from "axios";

const api = axios.create({
  baseURL: "",
  timeout: 30000, // Aumentado de 10000
});

// Adicionar retry automático
const MAX_RETRIES = 3;
const RETRY_DELAY = 1000;

const sleep = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

api.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    const config = error.config as any;
    
    // Retry apenas para erros de rede ou 5xx
    if (
      (error.code === "ERR_NETWORK" || (error.response?.status ?? 0) >= 500) &&
      config &&
      !config._retry &&
      (config._retryCount ?? 0) < MAX_RETRIES
    ) {
      config._retry = true;
      config._retryCount = (config._retryCount ?? 0) + 1;
      
      await sleep(RETRY_DELAY * config._retryCount);
      
      return api.request(config);
    }
    
    return Promise.reject(error);
  }
);
```

---

## 🔧 Melhorias Médias (Fase 2)

### 5. Validação em Tempo Real

**Arquivo:** `packages/frontend/src/components/AddQueueFormInline.tsx`

```typescript
// Adicionar estado de validação
const [errors, setErrors] = useState<Record<string, string>>({});

// Validação inline
const validateField = (field: string, value: any) => {
  const newErrors = { ...errors };
  
  switch (field) {
    case "tutorName":
      if (!value.trim()) {
        newErrors.tutorName = "Nome do tutor é obrigatório";
      } else {
        delete newErrors.tutorName;
      }
      break;
    case "patientName":
      if (!value.trim()) {
        newErrors.patientName = "Nome do paciente é obrigatório";
      } else {
        delete newErrors.patientName;
      }
      break;
    case "serviceType":
      if (!value) {
        newErrors.serviceType = "Selecione um serviço";
      } else {
        delete newErrors.serviceType;
      }
      break;
  }
  
  setErrors(newErrors);
  return Object.keys(newErrors).length === 0;
};

// Usar no onChange
<TutorAutocomplete
  value={formData.tutorName}
  onChange={(tutorName, tutorId) => {
    setFormData({ ...formData, tutorName, tutorId });
    validateField("tutorName", tutorName);
  }}
  // ... outros props
/>

// Mostrar erro abaixo do campo
{errors.tutorName && (
  <p className="text-sm text-destructive mt-1">{errors.tutorName}</p>
)}
```

---

### 6. Lembrar Última Sala Usada

**Arquivo:** `packages/frontend/src/components/RoomSelectModal.tsx`

```typescript
// Adicionar ao início do componente
const [lastUsedRoomId, setLastUsedRoomId] = useState<string | null>(null);

useEffect(() => {
  if (typeof window !== "undefined") {
    const lastRoom = localStorage.getItem("vetqueue_last_room");
    if (lastRoom) {
      setLastUsedRoomId(lastRoom);
    }
  }
}, []);

// Ao selecionar sala
const handleSelect = (roomId: string) => {
  localStorage.setItem("vetqueue_last_room", roomId);
  onSelect(roomId);
};

// Destacar última sala usada
{rooms.map((room) => (
  <button
    key={room.id}
    onClick={() => handleSelect(room.id)}
    className={`w-full p-3 rounded-lg border-2 transition-colors ${
      room.id === lastUsedRoomId
        ? "border-primary bg-primary/10"
        : "border-gray-200 hover:border-primary/50"
    }`}
  >
    <div className="flex items-center justify-between">
      <span>{room.name}</span>
      {room.id === lastUsedRoomId && (
        <span className="text-xs text-muted-foreground">Última usada</span>
      )}
    </div>
  </button>
))}
```

---

### 7. Traduzir Mensagens de Erro do Backend

**Arquivo:** `packages/backend/src/api/routes/queueRoutes.ts`

```typescript
// Criar helper de tradução
const translateZodError = (error: z.ZodError): string[] => {
  const translations: Record<string, string> = {
    "Nome do paciente é obrigatório": "Nome do paciente é obrigatório",
    "Nome do tutor é obrigatório": "Nome do tutor é obrigatório",
    "Tipo de serviço é obrigatório": "Selecione um tipo de serviço",
    "Sala é obrigatória": "Selecione uma sala",
  };

  return error.errors.map((err) => {
    const message = err.message;
    return translations[message] || message;
  });
};

// Usar no catch
catch (error) {
  if (error instanceof z.ZodError) {
    const translatedErrors = translateZodError(error);
    res.status(400).json({ 
      error: translatedErrors,
      message: translatedErrors.join(". ")
    });
    return;
  }
  res.status(400).json({ error: (error as Error).message });
}
```

**Frontend - Melhorar parsing:**
```typescript
// packages/frontend/src/lib/errors.ts
export function getErrorMessage(error: unknown): string {
  // ... código existente ...
  
  if (Array.isArray(errorData)) {
    // Agrupar por campo
    const grouped = errorData.reduce((acc, err) => {
      const field = err.path.join(".");
      if (!acc[field]) acc[field] = [];
      acc[field].push(err.message);
      return acc;
    }, {} as Record<string, string[]>);
    
    // Retornar mensagens agrupadas
    return Object.entries(grouped)
      .map(([field, messages]) => `${field}: ${messages.join(", ")}`)
      .join(". ");
  }
  
  // ... resto do código
}
```

---

### 8. Salvar Rascunho do Formulário

**Arquivo:** `packages/frontend/src/components/AddQueueFormInline.tsx`

```typescript
const DRAFT_KEY = "vetqueue_form_draft";

// Salvar rascunho
useEffect(() => {
  const draft = {
    tutorName: formData.tutorName,
    patientName: formData.patientName,
    serviceType: formData.serviceType,
    priority: formData.priority,
  };
  
  if (Object.values(draft).some(v => v)) {
    localStorage.setItem(DRAFT_KEY, JSON.stringify(draft));
  }
}, [formData]);

// Carregar rascunho ao montar
useEffect(() => {
  if (typeof window !== "undefined") {
    const draft = localStorage.getItem(DRAFT_KEY);
    if (draft) {
      try {
        const parsed = JSON.parse(draft);
        setFormData(prev => ({ ...prev, ...parsed }));
      } catch (e) {
        // Ignorar erro de parsing
      }
    }
  }
}, []);

// Limpar rascunho ao salvar com sucesso
const handleSubmit = async (e: React.FormEvent) => {
  // ... código existente ...
  
  if (success) {
    localStorage.removeItem(DRAFT_KEY);
  }
};
```

---

### 9. Validação de Duplicatas

**Arquivo:** `packages/backend/src/services/queueService.ts`

```typescript
async addToQueue(data: AddQueueData): Promise<QueueEntry> {
  // Verificar duplicatas ativas
  const activeEntries = await this.repository.findActiveByPatient(
    data.patientName,
    data.tutorName
  );
  
  if (activeEntries.length > 0) {
    const existing = activeEntries[0];
    throw new Error(
      `Paciente ${data.patientName} já está na fila (${existing.status}). ` +
      `Deseja continuar mesmo assim?`
    );
  }
  
  // ... resto do código
}
```

**Frontend - Mostrar alerta:**
```typescript
// packages/frontend/src/components/AddQueueFormInline.tsx
try {
  await queueApi.add({...});
} catch (error) {
  const message = getErrorMessage(error);
  
  if (message.includes("já está na fila")) {
    // Mostrar dialog de confirmação
    const confirmed = window.confirm(message + "\n\nDeseja adicionar mesmo assim?");
    if (confirmed) {
      // Adicionar com flag de força
      await queueApi.add({...}, { force: true });
    }
  } else {
    handleError(error);
  }
}
```

---

## 📊 Métricas e Monitoramento

**Adicionar tracking de ações:**
```typescript
// packages/frontend/src/lib/analytics.ts (novo)
export function trackEvent(event: string, data?: Record<string, any>) {
  if (typeof window !== "undefined" && window.gtag) {
    window.gtag("event", event, data);
  }
  
  // Log local para debug
  console.log(`[Analytics] ${event}`, data);
}

// Usar nas ações
trackEvent("queue_entry_added", {
  has_patient_id: !!formData.patientId,
  service_type: formData.serviceType,
  priority: formData.priority,
});
```

---

## ✅ Checklist de Implementação

- [ ] Fase 1 - Quick Wins
  - [ ] Reduzir debounce autocomplete
  - [ ] Adicionar navegação por teclado
  - [ ] Documentar atalhos
  - [ ] Melhorar feedback visual
  - [ ] Aumentar timeout API
  - [ ] Adicionar retry automático

- [ ] Fase 2 - Melhorias Médias
  - [ ] Validação em tempo real
  - [ ] Lembrar última sala
  - [ ] Traduzir erros backend
  - [ ] Salvar rascunho formulário
  - [ ] Validação de duplicatas

- [ ] Fase 3 - Melhorias Avançadas
  - [ ] Preenchimento paralelo tutor/pet
  - [ ] Refetch adaptativo
  - [ ] Indicador de conexão
  - [ ] Templates de pacientes
  - [ ] WebSocket para updates

---

**Nota:** Implementar em ordem de prioridade, testando cada melhoria antes de prosseguir.


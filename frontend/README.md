# VetQueue - Sistema de Fila Veterinária

Sistema de gerenciamento de fila para clínicas veterinárias com painel de controle e display de chamadas.

## 🚀 Funcionalidades

- **Autenticação**: Login protegido (usuário: `admin`, senha: `1234`)
- **Painel de Controle** (`/painel`): Gerenciamento completo da fila
  - Adicionar novos pacientes (pet + tutor)
  - Chamar pacientes para atendimento (com seleção de sala)
  - Finalizar atendimentos
  - Visualização em tempo real das filas
- **Painel de Display** (`/display`): Tela para exibição pública
  - Mostra chamadas recentes com animação
  - Lista de pacientes aguardando
  - Alerta sonoro em novas chamadas

## 🛠️ Tecnologias

- **React 18** + **TypeScript**
- **Vite** (build tool)
- **React Router** (roteamento)
- **Tailwind CSS** (estilização)
- **Lucide React** (ícones)
- **Context API** (gerenciamento de estado)

## 📦 Instalação

```bash
# Instalar dependências
npm install

# Iniciar servidor de desenvolvimento
npm run dev

# Build para produção
npm run build

# Preview da build
npm run preview
```

## 🎯 Rotas

- `/login` - Tela de autenticação
- `/painel` - Painel de controle (protegido)
- `/display` - Painel de exibição pública

## 🏗️ Estrutura do Projeto

```
frontend2/
├── src/
│   ├── App.tsx          # Componente principal com todas as features
│   ├── main.tsx         # Entry point
│   └── index.css        # Estilos globais + Tailwind
├── public/              # Assets estáticos
├── index.html           # HTML base
└── package.json         # Dependências e scripts
```

## 🎨 Design System

- **Dark Theme**: Interface moderna em tons de cinza
- **Componentes Reutilizáveis**: Card, Button, Input, Modal (estilo shadcn/ui)
- **Responsivo**: Mobile-first approach

## 🔧 Desenvolvimento

O projeto usa uma API mock simulada. Para integrar com backend real, substitua as funções em `api` no arquivo `App.tsx`.

## 📝 Credenciais de Teste

- **Usuário**: `admin`
- **Senha**: `1234`

## 🎯 Próximos Passos

- [ ] Integração com backend real
- [ ] WebSocket para atualizações em tempo real
- [ ] Persistência de dados
- [ ] Testes unitários e E2E
- [ ] PWA para instalação mobile


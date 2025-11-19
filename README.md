# Lexiom Premium UI/UX Module

## 🎯 Visão Geral

Módulo de interface premium desenvolvido para o SaaS Lexiom, combinando funcionalidade jurídica com elegância corporativa, atendendo às necessidades específicas de advogados de alto padrão.

## 🎨 Sistema de Design

### Paleta de Cores
- **Primário**: Azul petróleo (#1A2E40)
- **Secundário**: Dourado fosco (#C4A76A)
- **Texto**: Cinza grafite (#2D3436)
- **Fundo**: Branco neve (#F9F9F9)

### Tipografia
- **Principal**: Inter (corpo de texto)
- **Títulos**: Söhne (cabeçalhos)
- **Interface**: Manrope (elementos UI)

## 📋 Componentes Implementados

### 1. Header Premium
- Logo Lexiom com ícone de balança
- Seletor de módulos jurídicos
- Barra de pesquisa inteligente
- Notificações e perfil de usuário

### 2. Sidebar de Navegação
- Menu principal com ícones coloridos
- Módulos: Processos, Documentos, Clientes, Agenda, Kanban
- Rodapé com informações do usuário
- Indicadores visuais de módulo ativo

### 3. Área de Conteúdo Principal
- Sistema de breadcrumbs
- Cards modulares dimensionáveis
- Layout responsivo
- Animações suaves

### 4. Cards de Processos
- Cabeçalho colorido por status
- Metadados visíveis (cliente, tribunal, responsável)
- Indicadores de prioridade
- Ações flutuantes (visualizar, editar, compartilhar)

### 5. Painel Direito de IA
- Ferramentas de IA jurídica
- Assistente de voz
- Ações rápidas
- Interface colapsável

### 6. Quadro Kanban Integrado
- Arrastar e soltar com snap
- Colunas personalizáveis
- Visualização de tempo
- Gestão de tarefas jurídicas

## 🛠️ Tecnologias Utilizadas

- **React 18+** com TypeScript
- **Tailwind CSS** para estilização
- **Lucide React** para ícones
- **@dnd-kit** para funcionalidade drag-and-drop
- **Sonner** para notificações
- **Vite** para build e desenvolvimento

## 📱 Responsividade

- Desktop: 1920px → 1280px
- Tablet: 1024px → 768px
- Mobile: 767px → 320px

## ♿ Acessibilidade

- Conformidade WCAG 2.1 nível AA+
- Navegação por teclado
- Textos alternativos em imagens
- Contraste de cores adequado
- Leitores de tela compatíveis

## 🚀 Performance

- Carregamento otimizado (<100ms para interações críticas)
- Componentes lazy load
- Imagens otimizadas
- CSS minimalista

## 📁 Estrutura de Arquivos

```
src/
├── components/
│   ├── Header/
│   ├── Sidebar/
│   ├── MainContent/
│   ├── Card/
│   ├── ProcessCard/
│   ├── RightPanel/
│   ├── KanbanBoard/
│   └── Layout/
├── styles/
│   └── designSystem.ts
├── data/
│   └── mockProcesses.ts
└── App.tsx
```

## 🎯 Próximos Passos

1. **Modo Escuro**: Implementar tema dark
2. **Editor Jurídico**: Criar editor especializado com sugestões de IA
3. **Integrações**: Conectar com sistemas jurídicos externos
4. **Analytics**: Adicionar dashboard de métricas
5. **Personalização**: Permitir temas customizados por escritório

## 📝 Instalação e Execução

```bash
# Instalar dependências
npm install

# Executar servidor de desenvolvimento
npm run dev

# Build para produção
npm run build
```

## 🔧 Configuração

O sistema utiliza variáveis de ambiente para configuração:
- `VITE_API_URL`: URL da API backend
- `VITE_APP_NAME`: Nome da aplicação
- `VITE_THEME_PRIMARY`: Cor primária customizada
- `VITE_THEME_SECONDARY`: Cor secundária customizada

---

**Lexiom Premium UI** - Desenvolvido com 💜 para advogados exigentes.

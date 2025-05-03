# BackEnd-UgymReact

API backend do aplicativo Ugym, fornecendo suporte para todas as funcionalidades do cliente React.

## Funcionalidades Implementadas

### Autenticação e Segurança
- ✅ Sistema completo de autenticação (login, registro)
- ✅ Proteção de rotas por tipo de usuário (Aluno, Personal, Academia)
- ✅ Gerenciamento de tokens JWT

### API para Alunos
- ✅ Gerenciamento de perfil completo
- ✅ CRUD de treinos e exercícios por dia da semana
- ✅ Registro e visualização de métricas (peso, medidas, etc.)
- ✅ Relatórios de progresso
- ✅ Listagem e vinculação com personal trainers

### API para Personal Trainers
- ✅ Gerenciamento de perfil profissional
- ✅ CRUD de alunos vinculados
- ✅ Criação e edição de treinos para alunos
- ✅ Geração e gerenciamento de relatórios
- ✅ Validação de credenciais CREF

### API para Academias
- ✅ Gerenciamento de perfil e informações do estabelecimento
- ✅ Gerenciamento de eventos e atividades
- ✅ Gestão de personais e alunos vinculados

### Funcionalidades Gerais
- ✅ Sistema de eventos/calendário
- ✅ Notificações e tarefas
- ✅ Upload e gerenciamento de imagens

### Infraestrutura
- ✅ Banco de dados PostgreSQL via Prisma ORM
- ✅ Rotas organizadas por tipo de usuário
- ✅ Middleware de validação e autenticação

## Tecnologias Utilizadas

- **Node.js**: Ambiente de execução JavaScript
- **Express**: Framework web para Node.js
- **Prisma**: ORM para acesso ao banco de dados PostgreSQL
- **JWT**: Autenticação baseada em tokens
- **Bcrypt**: Criptografia de senhas
- **CORS**: Suporte a requisições cross-origin

## Estrutura do Projeto

- **routes**: APIs organizadas por tipo de usuário
  - `authRoutes.js`: Autenticação e registro
  - `alunoRoutes.js`: Endpoints específicos para alunos
  - `personalRoutes.js`: Endpoints específicos para personal trainers
  - `academiaRoutes.js`: Endpoints específicos para academias
  - `geralUserRoutes.js`: Endpoints comuns a todos os usuários
- **prisma**: Schema e migrações do banco de dados
- **middlewares**: Funções de validação e proteção de rotas

## Como Configurar o Projeto

1. **Clone o repositório**:
   ```bash
   git clone https://github.com/seu-usuario/BackEnd-UgymReact.git
   cd BackEnd-UgymReact
   ```

2. **Instale as dependências**:
   ```bash
   bun install
   ```

3. **Configure o banco de dados**:
   - Crie um arquivo `.env` com as variáveis de ambiente necessárias:
   ```
   DATABASE_URL="postgresql://usuario:senha@localhost:5432/ugym"
   DIRECT_URL="postgresql://usuario:senha@localhost:5432/ugym"
   JWT_SECRET="sua_chave_secreta"
   ```

4. **Execute as migrações**:
   ```bash
   npx prisma migrate dev
   ```

5. **Inicie o servidor**:
   ```bash
   bun run dev
   ```

## Endpoints Principais

A API possui diversas rotas organizadas por tipo de usuário. Todas as rotas autenticadas exigem um token JWT válido no cabeçalho da requisição.

- **Autenticação**: `/login`, `/register`
- **Alunos**: `/aluno/profile`, `/aluno/treinos`, `/aluno/reports`
- **Personal**: `/personal/profile`, `/personal/students`, `/personal/reports`
- **Academia**: `/academia/profile`, `/academia/events`

Para mais detalhes, consulte a documentação completa da API ou o código fonte nas pastas de rotas.

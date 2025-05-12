# BackEnd-UgymReact

API backend do aplicativo Ugym desenvolvida em Node.js com Express, fornecendo suporte completo para todas as funcionalidades do cliente React com estrutura baseada em microserviços por tipo de usuário.

## Funcionalidades

### Sistema de Autenticação
- Registro completo para 3 tipos de usuários (Alunos, Personal Trainers, Academias)
- Login seguro com JWT
- Proteção de rotas por tipo de usuário
- Validação e sanitização de dados
- Recuperação de senha (via email)

### Gerenciamento de Usuários
- **Alunos**
  - Gerenciamento de perfil completo
  - Preferências de treino e dados biométricos
  - Vinculação com academia e personal
  - Upload de avatar
- **Personal Trainers**
  - Perfil profissional completo
  - Validação de CREF
  - Definição de especialidades e certificações
  - Gerenciamento de disponibilidade e preços
  - Vinculação com academia
- **Academias**
  - Perfil comercial completo
  - Informações de contato e endereço
  - Horários de funcionamento
  - Comodidades e planos oferecidos
  - Lista de alunos e personais vinculados

### Sistema de Treinos
- Criação e gerenciamento de treinos por dia da semana
- Banco de dados de exercícios com imagens e instruções
- Definição de séries, repetições e intervalos
- Status e acompanhamento de conclusão
- Recursos multimídia (fotos, GIFs, vídeos)

### Monitoramento de Progresso
- Sistema completo de relatórios
- Registro de métricas e medidas corporais
- Histórico de evolução
- Anotações do personal trainer

### Gerenciamento de Finanças
- Controle de pagamentos
- Diferentes planos de assinatura
- Status de pagamento (pago, pendente, atrasado)
- Histórico financeiro

### Eventos e Agenda
- Criação e gerenciamento de eventos
- Sistema de inscrição
- Confirmação de presença
- Categorização por tipo de evento

### Sistema de Tarefas
- Criação e atribuição de tarefas
- Status de conclusão
- Datas de vencimento
- Notificações

### Armazenamento e Multimídia
- Upload e gerenciamento de imagens
- Suporte para fotos de perfil
- Imagens de exercícios
- Otimização de recursos

## Tecnologias e Arquitetura

### Backend
- **Node.js** & **Express**: Framework web rápido e flexível
- **Prisma ORM**: ORM moderno para PostgreSQL
- **PostgreSQL**: Banco de dados relacional robusto
- **JWT**: Autenticação baseada em tokens
- **Bcrypt**: Criptografia segura de senhas
- **Multer**: Processamento de upload de arquivos

### Infraestrutura
- **REST API**: Design de API seguindo princípios REST
- **Arquitetura por domínio**: Rotas separadas por tipo de usuário
- **Middlewares**: Validação, autenticação e processamento de erros
- **Render**: Hospedagem e deploy

## Modelo de Dados

O sistema utiliza um banco de dados PostgreSQL com os seguintes modelos principais:

- **User**: Dados básicos de usuário (email, senha, função)
- **PreferenciasAluno**: Perfil detalhado do aluno
- **PreferenciasPersonal**: Perfil profissional do personal
- **Academia**: Perfil completo da academia
- **Treino**: Estrutura de treino por dia da semana
- **Exercicio**: Detalhes de cada exercício
- **Report**: Registros de métricas e progresso
- **Pagamento**: Controle financeiro
- **Evento**: Agenda de atividades
- **Task**: Sistema de tarefas e lembretes

## Endpoints Principais

A API está organizada em diferentes módulos:

### Autenticação (`/auth`)
- `POST /entrar` - Login
- `POST /aluno/cadastrar` - Cadastro de aluno
- `POST /personal/cadastrar` - Cadastro de personal
- `POST /academia/cadastrar` - Cadastro de academia

### Aluno
- `GET /aluno/profile` - Obter perfil do aluno
- `PUT /aluno/profile` - Atualizar perfil
- `GET /aluno/treinos` - Listar treinos
- `POST /aluno/treinos/adicionar` - Criar novo treino
- `GET /aluno/reports` - Obter relatórios de progresso
- `POST /aluno/reports/adicionar` - Registrar nova medida

### Personal
- `GET /personal/profile` - Obter perfil do personal
- `PUT /personal/profile` - Atualizar perfil
- `GET /personal/students` - Listar alunos vinculados
- `POST /personal/treino/adicionar` - Criar treino para aluno
- `POST /personal/reports/adicionar` - Registrar medida para aluno

### Academia
- `GET /academia/profile` - Obter perfil da academia
- `PUT /academia/profile` - Atualizar perfil
- `GET /academia/alunos` - Listar alunos
- `GET /academia/personais` - Listar personais
- `POST /academia/eventos/adicionar` - Criar evento
- `GET /academia/pagamentos` - Consultar pagamentos

### Geral
- `GET /eventos` - Listar eventos
- `POST /tasks/adicionar` - Criar tarefa
- `GET /users/search` - Buscar usuários
- `POST /upload` - Enviar arquivo

## Configuração do Projeto

1. **Clone o repositório**:
   ```bash
   git clone https://github.com/eltobrgs/BackEnd-UgymReact.git
   cd BackEnd-UgymReact
   ```

2. **Instale as dependências**:
   ```bash
   npm install
   # ou
   bun install
   ```

3. **Configure as variáveis de ambiente**:
   Crie um arquivo `.env` com as seguintes variáveis:
   ```
   DATABASE_URL="postgresql://usuario:senha@localhost:5432/ugym"
   DIRECT_URL="postgresql://usuario:senha@localhost:5432/ugym"
   JWT_SECRET="sua_chave_secreta"
   PORT=3000
   ```

4. **Configure o banco de dados**:
   ```bash
   npx prisma migrate dev
   ```

5. **Inicie o servidor**:
   ```bash
   npm run dev
   # ou
   bun run dev
   ```

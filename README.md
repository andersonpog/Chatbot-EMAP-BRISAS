# Chatbot EMAP Brisas

Sistema de atendimento via WhatsApp para a EMAP (Empresa Maranhense de Administração Portuária), desenvolvido durante o programa de residência **BRISAS** em parceria com a UEMA e a SOFTEX.

---

## 📐 Arquitetura

```
┌─────────────────────────────────────────────────────────┐
│                      Frontend (Next.js)                  │
│  /login  │  /admin (Dashboard, Usuários)  │  /atendimento│
└───────────────────────┬─────────────────────────────────┘
                        │ HTTP (proxy interno)
┌───────────────────────▼─────────────────────────────────┐
│                   Backend (NestJS)                       │
│       /auth    │   /atendimento   │   /webhook           │
└──────────┬────────────────────────────────┬─────────────┘
           │                                │
    ┌──────▼──────┐                 ┌───────▼───────┐
    │  PostgreSQL  │                 │ Evolution API │
    │  (Docker)   │                 │  (WhatsApp)   │
    └─────────────┘                 └───────────────┘
```

| Serviço | Porta | Descrição |
| :--- | :--- | :--- |
| Frontend (Next.js) | `3000` | Painel web de atendimento |
| Backend (NestJS) | `3001` | API REST + lógica do chatbot |
| Evolution API | `8080` | Gateway WhatsApp |
| PostgreSQL | `5432` | Banco de dados |

---

## ✅ Pré-requisitos

- [Node.js](https://nodejs.org) v18+
- [Docker](https://docker.com) e Docker Compose
- [Git](https://git-scm.com)

---

## 🚀 Instalação e Configuração

### 1. Clonar o repositório

```bash
git clone https://github.com/andersonpog/Chatbot-EMAP-BRISAS.git
cd Chatbot-EMAP-BRISAS
```
OBS:MUDAR AS AUTHENTICATION_API_KEY E A SENHA DO POSTGRES NO ARQUIVO .env da evolution

### 2. Subir os containers Docker

```bash
cd evolution
docker compose up -d
```

Isso inicia os serviços: **PostgreSQL**, **Evolution API** e **Redis**.
### 2.1. Configurando a evolution
1-Entre em http://localhost:8080/manager/ <br>
2-Clique em criar uma nova instancia no canto superior direito <br>
3-Na janela dê um nome da sua escolha para instância, deixe como Baileys. <br>
4-Clique em settings em cima da instancia criada <br>
5-Dentro da instancia clique em get QR CODE e conecte o whatsapp <br>
6-Assim que o whatsap estiver conectado, entre na aba eventos e depois em webhook no menu lateral esquerdo. <br>
7-Clicar em ativar o enabled <br>
8- http://host.docker.internal:3001/webhook colocar esse link na URL  <br>
9- ativar o MESSAGES_UPSERT,PRESENCE_UPDATE E CONNECTION_UPDATE em Events. No fim da página salve as alterações.

### 3. Configurar o Backend (NestJS)

```bash
cd nest
npm install
```

Crie o arquivo `.env` na pasta `nest/`:

```env
DATABASE_URL=postgresql://postgres:PASSWORD@localhost:5432/chatbot_db?schema=public
JWT_SECRET=sua-chave-secreta-forte-aqui
PORT=3001
```

> ⚠️ Nunca versione o arquivo `.env`. Gere um JWT_SECRET seguro com:
> ```bash
> node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
> ```


## 🐘 Gerenciamento do Banco de Dados (Docker)
Passos para criar a instância do banco de dados necessária para o funcionamento do bot.

### 1. Acesso ao Container
```bash
docker exec -it postgres psql -U postgres
```

### 2. Comandos SQL de Inicialização
| Ação | Comando SQL / Meta-comando |
| :--- | :--- |
| **Criar Banco** | `CREATE DATABASE chatbot_db;` |
| **Listar Bancos** | `\l` |
| **Sair** | `\q` |

---

Executar as migrations:

```bash
npx ts-node -r tsconfig-paths/register ./node_modules/typeorm/cli migration:run -d typeorm.config.ts
```

Iniciar o servidor:

```bash
npm run start:dev
```

### 4. Configurar o Frontend (Next.js)

```bash
cd frontend/whatsapp-atendimento
npm install
```

Crie o arquivo `.env.local` na pasta `frontend/whatsapp-atendimento/`:

```env
NESTJS_API_URL=http://localhost:3001
EVOLUTION_API_URL=http://localhost:8080
EVOLUTION_API_KEY=sua-chave-evolution
EVOLUTION_INSTANCE=nome-da-instancia
JWT_SECRET=sua-chave-secreta-forte-aqui
```

> O `JWT_SECRET` deve ser idêntico ao do backend.

Iniciar o servidor:

```bash
npm run dev
```

Acesse: [http://localhost:3000](http://localhost:3000)

---

## 🔐 Acesso inicial

Na primeira inicialização, o sistema verifica se existe algum administrador cadastrado. Caso não exista, **um administrador padrão é criado automaticamente com credenciais definidas no código**.

> ⚠️ **ATENÇÃO — Antes de ir para produção:**
> - Altere imediatamente as credenciais do administrador padrão pelo painel `/admin/usuarios`
> - Considere remover o seed automático em `nest/src/auth/auth.service.ts` e criar o primeiro admin manualmente via endpoint `POST /auth/registrar`
> - Nunca deixe credenciais padrão ativas em ambiente público

---

## 🖥️ Frontend — Funcionalidades

### Tela de Login (`/login`)

- Autenticação com e-mail e senha
- JWT armazenado em cookie `httpOnly` (seguro, não acessível por JavaScript)
- Redirecionamento automático conforme o perfil:
  - **ADMIN** → `/admin/dashboard`
  - **ATENDENTE** → `/atendimento`

---

### Painel Administrativo (`/admin`)

Acessível apenas para usuários com perfil **ADMIN**.

#### Dashboard (`/admin/dashboard`)

Visão geral do sistema com 4 cards de métricas:

| Card | Descrição |
| :--- | :--- |
| Total de usuários | Quantidade total de funcionários cadastrados |
| Usuários ativos | Funcionários com status `ativo = true` |
| Administradores | Usuários com perfil ADMIN |
| Atendentes | Usuários com perfil ATENDENTE |

---

#### Usuários (`/admin/usuarios`)

Gerenciamento completo de funcionários do sistema.

**Funcionalidades:**

- **Busca** em tempo real por nome ou e-mail
- **Criar usuário** via modal (nome, e-mail, senha, perfil)
- **Editar usuário** — altera nome e perfil (e-mail não editável)
- **Desativar / Reativar** — toggle de status com confirmação
- **Status visual** — badge "Ativo" (verde) ou "Inativo" (vermelho)
- Linhas de usuários inativos exibidas com opacidade reduzida

**Perfis disponíveis:**

| Perfil | Descrição |
| :--- | :--- |
| `ATENDENTE` | Acessa apenas a tela de atendimento |
| `ADMIN` | Acessa o painel administrativo completo |

---

### Tela de Atendimento (`/atendimento`)

Interface principal de atendimento ao cliente via WhatsApp.

**Funcionalidades:**

- Lista de conversas com busca por nome ou número
- Abas: **Abertos**, **Pendentes**, **Resolvidos**
- Histórico completo de mensagens por contato
- Envio de mensagens em tempo real (atualização otimista — aparece na tela antes da confirmação da API)
- Indicador de status de envio (relógio = enviando, duplo check = entregue)

**Fila de atendimento integrada:**

Quando um cliente é encaminhado pelo robô para atendimento humano, aparece automaticamente na tela:

| Status | Badge | Ação disponível |
| :--- | :--- | :--- |
| `AGUARDANDO` | Amarelo — "Aguardando" | Botão **Assumir** |
| `EM_ATENDIMENTO` | Azul — "Em atendimento" | Botão **Finalizar** |

- **Assumir** — marca o ticket como `EM_ATENDIMENTO` (robô silencia para aquele usuário)
- **Finalizar** — marca como `FINALIZADO` (robô volta a responder o usuário)
- A fila atualiza automaticamente a cada **8 segundos**

**Modo Observador (ADMIN):**

Administradores acessam a tela de atendimento em modo somente leitura:
- Visualizam todas as conversas e status da fila
- **Não** podem enviar mensagens
- **Não** podem assumir ou finalizar tickets
- Exibe mensagem: *"Modo observador — apenas visualização"*

---

## 🔌 API Backend — Referência

**Base URL:** `http://localhost:3001`
**Autenticação:** `Bearer Token` (JWT) no header `Authorization`

---

### 🔐 Autenticação (`/auth`)

| Método | Rota | Body | Descrição | Token? |
| :--- | :--- | :--- | :--- | :--- |
| `POST` | `/auth/login` | `{"email":"...","senha":"..."}` | Retorna o `access_token` JWT | Não |
| `POST` | `/auth/registrar` | `{"nome":"...","email":"...","senha":"...","role":"ATENDENTE"}` | Cria novo funcionário | **Sim** |
| `GET` | `/auth/funcionarios` | — | Lista todos os funcionários | **Sim** |
| `PATCH` | `/auth/funcionarios/:id` | `{"nome":"...","role":"...","active":true}` | Atualiza dados ou status do funcionário | **Sim** |
| `GET` | `/auth/perfil` | — | Retorna dados do usuário autenticado | **Sim** |

---

### 🚢 Fila de Atendimento (`/atendimento`)

| Método | Rota | Parâmetros | Descrição | Token? |
| :--- | :--- | :--- | :--- | :--- |
| `GET` | `/atendimento/fila` | — | Lista tickets com status `AGUARDANDO` ou `EM_ATENDIMENTO` | **Sim** |
| `PATCH` | `/atendimento/assumir/:id` | `:id` | Muda status para `EM_ATENDIMENTO` | **Sim** |
| `PATCH` | `/atendimento/finalizar/:id` | `:id` | Muda status para `FINALIZADO`, libera o robô | **Sim** |

---

### 🤖 Webhook Evolution API (`/webhook`)

| Método | Rota | Descrição | Token? |
| :--- | :--- | :--- | :--- |
| `POST` | `/webhook` | Recebe eventos do WhatsApp (mensagens recebidas) e executa a lógica do chatbot | Não |

---

## 🗄️ Banco de Dados

### Tabelas principais

| Tabela | Descrição |
| :--- | :--- |
| `Funcionarios` | Usuários do sistema (atendentes e admins) |
| `atendimentos` | Fila de atendimento humano |

### Estrutura — `Funcionarios`

| Coluna | Tipo | Descrição |
| :--- | :--- | :--- |
| `id` | UUID | Identificador único |
| `nome` | varchar | Nome do funcionário |
| `email` | varchar (unique) | E-mail de acesso |
| `senha` | varchar | Senha criptografada (bcrypt) |
| `role` | varchar | `ADMIN` ou `ATENDENTE` |
| `active` | boolean | Status ativo/inativo (padrão: `true`) |
| `createdAt` | timestamp | Data de criação |

### Estrutura — `atendimentos`

| Coluna | Tipo | Descrição |
| :--- | :--- | :--- |
| `id` | serial | Identificador único |
| `remoteJid` | varchar | ID do WhatsApp do cliente |
| `nome` | varchar | Nome do cliente |
| `status` | varchar | `AGUARDANDO`, `EM_ATENDIMENTO` ou `FINALIZADO` |
| `dataCriacao` | timestamp | Data de entrada na fila |

---

## 🏗️ Migrations (TypeORM)

Todos os comandos devem ser executados dentro da pasta `nest/`.

**Gerar nova migration** (após alterar entidades):

```bash
npx ts-node -r tsconfig-paths/register ./node_modules/typeorm/cli migration:generate src/database/migrations/NomeDaMigration -d typeorm.config.ts
```

**Aplicar migrations pendentes:**

```bash
npx ts-node -r tsconfig-paths/register ./node_modules/typeorm/cli migration:run -d typeorm.config.ts
```

> ⚠️ Certifique-se de que o container do PostgreSQL está rodando (`docker compose up -d`) antes de executar migrations.

---

## 🐘 Comandos Docker úteis

```bash
# Iniciar todos os serviços
docker compose up -d

# Verificar status dos containers
docker compose ps

# Acessar o banco de dados
docker compose exec postgres psql -U postgres -d evolution

# Ver logs da Evolution API
docker compose logs -f evolution_api

# Parar todos os serviços
docker compose down
```

---

## 📖 Documentação interativa da API (Swagger)

Com o backend rodando, acesse:

```
http://localhost:3001/api
```

---


## 🏛️ Sobre o Projeto

Desenvolvido durante o **Programa de Residência BRISAS**
Parceria: **UEMA × SOFTEX**
Cliente: **EMAP — Empresa Maranhense de Administração Portuária**

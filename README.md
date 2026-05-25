# Chatbot EMAP Brisas

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](LICENSE)

Sistema de atendimento via WhatsApp para a EMAP (Empresa Maranhense de Administração Portuária), desenvolvido durante o programa de residência **BRISAS** em parceria com a UEMA e a SOFTEX.

---

## 📐 Arquitetura

```
┌────────────────────────────────────────────────────────────────┐
│                     Frontend (Next.js)                          │
│ /login │ /admin/dashboard │ /admin/usuarios │ /admin/config     │
│ /atendimento │ API Routes (/api/*)                              │
└───────────────┬───────────────────────────────┬────────────────┘
                │ HTTP interno/proxy             │ WebSocket
                │                                │ evento nova_mensagem
┌───────────────▼────────────────────────────────▼────────────────┐
│                       Backend (NestJS)                           │
│ /auth │ /atendimento │ /configuracoes │ /webhook │ Socket.IO     │
│ Regras do bot, fila humana, autenticação, configs e Swagger      │
└───────────────┬───────────────────────────────┬────────────────┘
                │ TypeORM/PostgreSQL             │ HTTP
                │                                │ envio de mensagens
┌───────────────▼────────────────┐       ┌───────▼────────────────┐
│ PostgreSQL 15 (Docker)          │       │ Evolution API (Docker)  │
│ Funcionarios, atendimentos,     │       │ Gateway WhatsApp        │
│ configuracoes                   │       │ Webhook -> NestJS       │
└───────────────┬────────────────┘       └───────┬────────────────┘
                │                                │
                                         ┌───────▼────────┐
                                         │ Redis           │
                                         │ suporte/cache   │
                                         │ Evolution API   │
                                         └────────────────┘
```

| Serviço | Porta | Descrição |
| :--- | :--- | :--- |
| Frontend (Next.js) | `3000` | Painel web, páginas administrativas e rotas API internas (`/api/*`) |
| Backend (NestJS) | `3001` | API REST, Swagger, lógica do chatbot, autenticação, fila de atendimento, configurações e Socket.IO |
| Evolution API | `8080` | Gateway WhatsApp; envia webhooks para o backend e recebe comandos de envio de mensagem |
| PostgreSQL | `5432` | Banco de dados das tabelas `Funcionarios`, `atendimentos` e `configuracoes` |
| Redis | `6379` | Serviço de suporte/cache usado pela Evolution API |

Fluxo principal:

1. O usuário acessa o painel Next.js em `http://localhost:3000`.
2. As rotas internas do Next.js (`/api/*`) encaminham autenticação, usuários, fila e uptime para o NestJS; envio e leitura de mensagens também podem consultar a Evolution API.
3. A Evolution API recebe e envia mensagens do WhatsApp e dispara webhooks para o NestJS.
4. O NestJS processa o fluxo do bot, consulta configurações de horário, atualiza a fila de atendimento e persiste dados no PostgreSQL.
5. O backend emite eventos Socket.IO para o frontend atualizar conversas em tempo real.

---

## ✅ Pré-requisitos

- [Git](https://git-scm.com) 2.x ou superior, para clonar o repositório.
- [Node.js](https://nodejs.org) **20.9.0 ou superior**. O frontend usa **Next.js 16.1.6** e o backend usa **NestJS 11**, ambos com dependências que exigem Node 20+.
- `npm` 10+ ou a versão instalada junto com o Node 20+, para instalar as dependências de `nest/` e `frontend/whatsapp-atendimento/`.
- [Docker](https://docker.com) com Docker Compose v2. Em Windows, instale o **Docker Desktop** com backend **WSL 2** habilitado e uma distribuição Linux instalada no WSL. Recomenda-se **Ubuntu 22.04 LTS** pela estabilidade e compatibilidade com Docker Desktop; **Ubuntu 24.04 LTS** também é compatível.
- Acesso à internet na primeira instalação, pois `npm install` baixa pacotes do npm e `docker compose up -d` baixa as imagens Docker.
- Conta/sessão de WhatsApp disponível para conectar a instância da Evolution API via QR Code.
- Processador com arquitetura **64 bits**. Recomenda-se CPU **x86_64/amd64** ou **ARM64** compatível com Docker Desktop, Node.js 20+ e as imagens Docker utilizadas.

**Recursos recomendados para ambiente local:**

| Recurso | Mínimo funcional | Recomendado |
| :--- | :--- | :--- |
| Processador | 64 bits, 2 núcleos | 64 bits, 4 núcleos ou mais |
| Memória RAM | 8 GB | 16 GB |
| Armazenamento livre | 12 GB | 20 GB ou mais |

Para Windows com Docker Desktop e WSL 2, prefira processadores com suporte a virtualização por hardware habilitado na BIOS/UEFI, como Intel VT-x ou AMD-V. Em máquinas com apenas 2 núcleos, o sistema tende a funcionar, mas `npm install`, builds do Next.js e execução simultânea de frontend, backend e containers podem ficar lentos.

**Estimativa de armazenamento**

Para conseguir clonar, instalar dependências e executar o sistema localmente, reserve pelo menos **12 GB livres**. Para trabalhar com folga, builds, cache do Docker e crescimento do banco, o ideal é **20 GB ou mais**.

| Item | Estimativa |
| :--- | :--- |
| Repositório clonado, incluindo arquivos de documentação e imagens | ~1,5 GB |
| Dependências `node_modules` do backend NestJS | ~300 MB a 600 MB |
| Dependências `node_modules` do frontend Next.js | ~500 MB a 1 GB |
| Imagens Docker: Evolution API, PostgreSQL e Redis | ~1,5 GB a 3 GB |
| Volumes Docker iniciais: PostgreSQL, Redis e Evolution instances | ~500 MB a 2 GB |
| Cache de npm, cache de Docker e builds locais (`dist/`, `.next/`) | ~2 GB a 5 GB |

O uso de disco aumenta conforme o volume de mensagens, mídias recebidas pelo WhatsApp, logs, backups e histórico do PostgreSQL. Em ambiente de produção, dimensione o armazenamento pelo volume esperado de atendimentos e mantenha política de limpeza/backup para os volumes Docker.

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

Isso inicia os serviços utilizados pelo sistema: **PostgreSQL**, **Evolution API** e **Redis**.
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

- Usuário: `admin@admin.com`
- Senha: 123456

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
  - **OBSERVADOR** → `/atendimento`

---

### Painel Administrativo (`/admin`)

Acessível apenas para usuários com perfil **ADMIN**.

#### Dashboard (`/admin/dashboard`)

Visão geral do sistema com 6 cards de métricas:

![alt text](image.png)

| Card | Descrição |
| :--- | :--- |
| Total de usuários | Quantidade total de funcionários cadastrados |
| Usuários ativos | Funcionários com status `ativo = true` |
| Administradores | Usuários com perfil ADMIN |
| Atendentes | Usuários com perfil ATENDENTE |
| Observadores | Usuários com perfil OBSERVADOR |
| Uptime do sistema | Duração da sessão ativa |


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
| `ATENDENTE` | Acessa apenas a tela de atendimento e assume os atendimentos |
| `ADMIN` | Acessa o painel administrativo completo e pode encaminhar atendimentos para um atendente |
| `OBSERVADOR`| Acessa a tela de atendimento (igual ao ADMIN), mas sem permissões administrativas; pode encaminhar atendimentos para um atendente |


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

**Modo Observador (ADMIN/OBSERVADOR):**

Administradores e Observadores acessam a tela de atendimento em modo somente leitura:
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
| `POST`| `/auth/heartbeat` | — | Atualiza o campo lastSeen do funcionário, registrando o último momento em que esteve ativo no sistema | Não |
| `GET`| `/auth/uptime` | — | Retorna o tempo que o servidor está em execução contínua | Não|
| `GET` | `/auth/perfil` | — | Retorna dados do usuário autenticado | **Sim** |

---

### 🚢 Fila de Atendimento (`/atendimento`)

| Método | Rota | Parâmetros | Descrição | Token? |
| :--- | :--- | :--- | :--- | :--- |
| `GET` | `/atendimento/fila` | — | Lista tickets com status `AGUARDANDO` ou `EM_ATENDIMENTO` | **Sim** |
| `PATCH` | `/atendimento/assumir/:id` | `:id` | Muda status para `EM_ATENDIMENTO` | **Sim** |
| `PATCH` | `/atendimento/finalizar/:id` | `:id` | Muda status para `FINALIZADO`, libera o robô | **Sim** |
| `GET` | `/atendimento/atendentes/online `| — | Lista atendentes disponíveis para assumir atendimento | **Sim** |
| `POST`| `/atendimento/encaminhar ` | — |Encaminha um atendimento para um atendente específico | **Sim** | 


---

### ⚙️ Configurações (`/configuracoes`)

| Método | Rota | Body | Descrição | Token? |
| :--- | :--- | :--- | :--- | :--- |
| `GET` | `/configuracoes` | — | Retorna horários de funcionamento e mensagem de fora do horário | Não |
| `POST` | `/configuracoes` | `{"horarios":[...],"mensagemForaHorario":"..."}` | Atualiza horários e mensagem automática usada pelo robô | Não |

---

### 🤖 Webhook Evolution API (`/webhook`)

| Método | Rota | Descrição | Token? |
| :--- | :--- | :--- | :--- |
| `POST` | `/webhook` | Recebe eventos do WhatsApp, executa a lógica principal do chatbot e emite atualização via Socket.IO | Não |
| `POST` | `/webhook/evolution` | Rota alternativa/compatível para eventos da Evolution API | Não |

---

## 🗄️ Banco de Dados

### Tabelas principais

| Tabela | Descrição |
| :--- | :--- |
| `Funcionarios` | Usuários do sistema (atendentes, observadores e admins) |
| `atendimentos` | Fila de atendimento humano |
| `configuracoes` | Horários de funcionamento e mensagem automática de fora do expediente |

### Estrutura — `Funcionarios`

| Coluna | Tipo | Descrição |
| :--- | :--- | :--- |
| `id` | UUID | Identificador único |
| `nome` | varchar | Nome do funcionário |
| `email` | varchar (unique) | E-mail de acesso |
| `senha` | varchar | Senha criptografada (bcrypt) |
| `role` | varchar | `ADMIN`, `ATENDENTE` ou `OBSERVADOR` |
| `active` | boolean | Status ativo/inativo (padrão: `true`) |
| `createdAt` | timestamp | Data de criação |
| `lastSeen`| timestamp | Data e hora da última atividade do usuário no sistema |


### Estrutura — `atendimentos`

| Coluna | Tipo | Descrição |
| :--- | :--- | :--- |
| `id` | integer | Identificador único |
| `remoteJid` | varchar | ID do WhatsApp do cliente |
| `nome` | varchar | Nome do cliente |
| `status` | varchar | `BOT`, `AGUARDANDO`, `EM_ATENDIMENTO` ou `FINALIZADO` |
| `dataCriacao` | timestamp | Data de entrada na fila |
| `atendenteId` | text | Identificador do atendente responsável pelo atendimento |


### Estrutura — `configuracoes`

| Coluna | Tipo | Descrição |
| :--- | :--- | :--- |
| `id` | integer | Identificador único |
| `horarios` | jsonb | Lista de dias, status ativo/inativo e horários de início/fim |
| `mensagemForaHorario` | varchar | Mensagem enviada quando o cliente solicita atendimento humano fora do horário configurado |


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

## 🛡️ Segurança — Checklist para Produção

> ⚠️ **Não publique esta aplicação sem concluir os itens abaixo.**

**Credenciais e segredos:**
- [ ] Arquivos `.env` e `.env.local` estão no `.gitignore` e **fora do repositório**
- [ ] `JWT_SECRET` trocado por chave forte gerada aleatoriamente (mínimo 32 bytes)
- [ ] `EVOLUTION_API_KEY` substituída por chave segura (não usar valores óbvios)
- [ ] Credenciais do administrador padrão alteradas ou seed removido do código
- [ ] Senha do banco de dados alterada para algo seguro

**Configuração do servidor:**
- [ ] CORS restrito ao domínio de produção em `nest/src/main.ts` (remover `origin: true`)
- [ ] HTTPS habilitado no servidor (nunca expor em HTTP puro)
- [ ] Instalar `helmet` no NestJS para headers de segurança HTTP: `npm i helmet`
- [ ] Configurar rate limiting no login para evitar força bruta: `npm i @nestjs/throttler`

**Validação e autorização:**
- [ ] Substituir `@Body() body: any` por DTOs com `class-validator` nos controllers
- [ ] Restringir criação de usuários com role `ADMIN` apenas para admins autenticados
- [ ] Adicionar verificação de propriedade no `PATCH /auth/funcionarios/:id` (evitar IDOR)

**Dependências:**
- [ ] `npm audit` executado sem vulnerabilidades críticas em `nest/` e `frontend/`
- [ ] Considerar uso do [Snyk](https://snyk.io) para monitoramento contínuo de dependências

---

## 🏛️ Sobre o Projeto

Desenvolvido durante o **Programa de Residência BRISAS**
Parceria: **UEMA × SOFTEX**
Cliente: **EMAP — Empresa Maranhense de Administração Portuária**

---

## 📄 Licença

Este projeto está licenciado sob a [MIT License](LICENSE).

Copyright (c) 2026 UEMA / SOFTEX — Programa BRISAS

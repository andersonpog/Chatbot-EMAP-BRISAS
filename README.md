# Chatbot-EMAP-BRISAS
Projeto de chatbot para a EMAP criado durante o programa de residência BRISAS em parceria com a UEMA e a SOFTEX.

Ficou claro! Você quer manter o padrão visual de documentação técnica que já está usando no projeto da EMAP.

Aqui está o conteúdo organizado exatamente nesse formato:

---

# 🛠️ Guia de Instalação e Banco de Dados - Chatbot EMAP

Este documento descreve os passos técnicos para configurar o ambiente de dados, variáveis de sistema e a estrutura de tabelas via TypeORM para o ecossistema de atendimento.

## 📌 Configuração de Ambiente (`.env`)
Antes de iniciar o serviço, configure o arquivo de ambiente na raiz do projeto:

| Variável | Exemplo de Valor | Descrição |
| :--- | :--- | :--- |
| **DATABASE_URL** | `DATABASE_URL="postgresql://postgres:PASSWORD@localhost:5432/evolution?schema=public"` | String de conexão com o Postgres. |
| **JWT_SECRET** | `SUA_CHAVE_SECRETA_AQUI` | Chave para criptografia de tokens de acesso. |

---

## 🐘 Gerenciamento do Banco de Dados (Docker)
Passos para criar a instância do banco de dados necessária para o funcionamento do bot.

### 1. Acesso ao Container
```bash
docker exec -it postgres psql -U postgres -d Evolution
```

### 2. Comandos SQL de Inicialização
| Ação | Comando SQL / Meta-comando |
| :--- | :--- |
| **Criar Banco** | `CREATE DATABASE chatbot_db;` |
| **Listar Bancos** | `\l` |
| **Sair** | `\q` |

---

## 🏗️ Migrations e Persistência (TypeORM)
Comandos para sincronizar as entidades do NestJS com o banco de dados PostgreSQL.

### Gerar Nova Estrutura
Utilize este comando quando houver alterações nas entidades do código:
```bash
npx typeorm-ts-node-commonjs migration:generate src/database/migrations/CreateInitialTables -d typeorm.config.ts
```

### Aplicar Alterações (Run)
Utilize este comando para consolidar as tabelas no banco de produção/desenvolvimento:
```bash
npx typeorm-ts-node-commonjs migration:run -d typeorm.config.ts
```

---
> **Aviso:** Certifique-se de que o container do Postgres esteja em status `Up` antes de rodar as migrations.

# 🚀 Documentação da API - Chatbot EMAP (BRISA/UFMA)

Este documento descreve as rotas disponíveis no backend NestJS para a gestão do sistema de atendimento do Ferry Boat, integrando a **Evolution API** com o banco de dados **chatbot_db**.

## 📌 Configurações de Acesso
* **Base URL:** `http://localhost:3001`
* **Content-Type:** `application/json`
* **Autenticação:** `Bearer Token` (JWT)

---

## 🔐 Módulo de Autenticação (`/auth`)
Gerencia o acesso dos funcionários e administradores ao sistema de São Luís.

| Método | Rota | Body JSON (Exemplo) | Descrição | Requer Token? |
| :--- | :--- | :--- | :--- | :--- |
| **POST** | `/auth/login` | `{"email": "admin@email.com", "senha": "123"}` | Retorna o `access_token` para acesso às demais rotas. | Não |
| **POST** | `/auth/registrar` | `{"nome": "Anderson", "email": "anderson@email.com", "senha": "123", "role": "admin"}` | Cria um novo funcionário no banco. | **Sim** |
| **GET** | `/auth/perfil` | *Nenhum* | Retorna os dados do usuário autenticado no momento. | **Sim** |
| **GET** | `/auth/funcionarios` | *Nenhum* | Lista todos os funcionários cadastrados no sistema. | **Sim** |

---

## 🚢 Módulo de Atendimento e Fila (`/atendimento`)
Controla o fluxo de transbordo entre o Robô e o Atendimento Humano.

| Método | Rota | Parâmetros | Descrição | Requer Token? |
| :--- | :--- | :--- | :--- | :--- |
| **GET** | `/atendimento/fila` | *Nenhum* | Retorna a lista de passageiros com status `AGUARDANDO` ou `EM_ATENDIMENTO`. | **Sim** |
| **PATCH** | `/atendimento/assumir/:id` | `:id` (ID do banco) | Altera o status para `EM_ATENDIMENTO` (O robô continua em silêncio). | **Sim** |
| **PATCH** | `/atendimento/finalizar/:id` | `:id` (ID do banco) | Define como `FINALIZADO`. O robô volta a responder este usuário. | **Sim** |

---

## 🤖 Módulo de Webhook (`/webhook`)
Ponto de entrada para as mensagens vindas da Evolution API.

| Método | Rota | Body JSON (Simulação de Teste) | Descrição | Requer Token? |
| :--- | :--- | :--- | :--- | :--- |
| **POST** | `/webhook` | Ver exemplo abaixo | Processa a lógica de menus e insere usuários na fila de espera. | Não |

## 🛠 Instruções de Teste (Postman)
Obter Token: Execute a rota POST /auth/login. Copie o valor de access_token.

Autorizar: Nas rotas protegidas, vá na aba Auth, selecione Bearer Token e cole o valor copiado.

Verifique se o registro apareceu em GET /atendimento/fila.

Finalize o atendimento com o ID retornado para liberar o robô novamente.

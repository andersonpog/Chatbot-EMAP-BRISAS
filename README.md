# Chatbot-EMAP-BRISAS
Projeto de chatbot para a EMAP criado durante o programa de residência BRISAS em parceria com a UEMA e a SOFTEX.

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

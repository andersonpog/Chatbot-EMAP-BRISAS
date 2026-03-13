# Frontend — Painel de Atendimento WhatsApp (EMAP Brisas)

Interface web para visualização e organização das mensagens recebidas via WhatsApp, integrada com a [Evolution API](https://github.com/EvolutionAPI/evolution-api).

## Tecnologias

- [Next.js 16](https://nextjs.org) com App Router
- [Tailwind CSS v4](https://tailwindcss.com)
- [Evolution API v2](https://doc.evolution-api.com)

## Configuração

Crie o arquivo `.env.local` na raiz desta pasta com as seguintes variáveis:

```env
NEXT_PUBLIC_EVOLUTION_API_URL=http://localhost:8080
NEXT_PUBLIC_EVOLUTION_API_KEY=sua-api-key
NEXT_PUBLIC_EVOLUTION_INSTANCE=nome-da-instancia
```

> **Atenção:** nunca suba o `.env.local` para o repositório. Ele já está no `.gitignore`.

## Como rodar

```bash
npm install
npm run dev
```

Acesse [http://localhost:3000](http://localhost:3000) no navegador.

## Funcionalidades

- Listagem de conversas agrupadas por contato
- Exibição de mensagens em ordem cronológica
- Suporte ao formato de endereçamento LID do WhatsApp
- Atualização manual via botão de refresh
- Feedback de carregamento e erros

## Estrutura

```
whatsapp-atendimento/
├── app/
│   ├── api/messages/route.ts   # Proxy server-side para a Evolution API
│   ├── layout.tsx
│   └── page.tsx
├── AtendimentoWhatsapp.tsx     # Componente principal do painel
├── .env.local                  # Credenciais locais (não commitado)
└── .env.local.example          # Modelo de configuração
```

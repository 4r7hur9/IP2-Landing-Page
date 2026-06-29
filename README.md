# Projeto do Site IP2 Internet

## Visao geral

Projeto institucional da IP2 Internet com paginas publicas, integracao com Meta Conversions API e base em evolucao para dashboard administrativa, SEO tecnico, seguranca e arquitetura modular.

## Stack atual

- Node.js com Express
- Tailwind CLI local
- Prisma
- PostgreSQL
- EJS preparado para a fase de renderizacao no servidor

## Comandos principais

```bash
npm install
npm run dev
npm run build:styles
npm run prisma:generate
npm run prisma:migrate:dev
npm run generate:password-hash -- "sua-senha-forte"
```

## Variaveis de ambiente

Copie `.env.example` para `.env` e preencha os valores necessarios.

Campos principais nesta fase:

- `PORT`
- `TRUST_PROXY`
- `DATABASE_URL`
- `META_PIXEL_ID`
- `META_ACCESS_TOKEN`
- `META_API_VERSION`
- `META_TEST_EVENT_CODE`

Campos preparados para a fase de autenticacao:

- `ADMIN_DASHBOARD_USER`
- `ADMIN_DASHBOARD_PASSWORD_HASH`
- `JWT_ACCESS_SECRET`
- `JWT_REFRESH_SECRET`
- `JWT_ACCESS_TTL`
- `JWT_REFRESH_TTL`
- `ADMIN_LOGIN_RATE_LIMIT_MAX_ATTEMPTS`
- `ADMIN_LOGIN_RATE_LIMIT_WINDOW_MS`

## Gerar hash da senha administrativa

Use o comando abaixo para gerar o valor de `ADMIN_DASHBOARD_PASSWORD_HASH`:

```bash
npm run generate:password-hash -- "sua-senha-forte"
```

## Estrutura inicial

- `assets/`: estilos, scripts, icones, fontes e midias
- `docs/`: documentacao tecnica e operacional
- `prisma/`: schema e futuras migrations
- `server/`: aplicacao Express e servicos do backend
- `src/content/`: dados centralizados do conteudo do site
- `views/`: layouts, parciais e paginas com renderizacao no servidor

## Estado atual da migracao

Esta etapa prepara a fundacao tecnica sem alterar o comportamento visual do site publico. As paginas HTML atuais continuam como fonte principal enquanto a modularizacao completa ainda nao foi aplicada.

## Seguranca administrativa ja implementada

- login da dashboard em `/admin/login`
- rota protegida inicial em `/admin`
- API protegida em `/api/admin/session`
- JWT em cookies `httpOnly`
- `helmet` com endurecimento de headers
- rate limit global e rate limit dedicado ao login admin
- validacao de entrada com `zod`

## Persistencia e observabilidade

- Prisma configurado para PostgreSQL em `prisma/schema.prisma`
- migration inicial gerada em `prisma/migrations/20260626204500_phase3_persistence`
- sessoes administrativas agora sao planejadas para persistencia revogavel no banco
- trilha de auditoria preparada para:
  - login bem-sucedido
  - login falho
  - refresh de sessao
  - logout
  - acesso admin sem autenticacao
- logs de eventos da Meta preparados para persistencia por status e contexto

## Aplicar a migration quando o banco estiver pronto

1. Preencha `DATABASE_URL` no `.env`
2. Garanta que o PostgreSQL esteja acessivel
3. Execute:

```bash
npm run prisma:migrate:dev
```

Em deploy, o fluxo equivalente deve usar `prisma migrate deploy`.

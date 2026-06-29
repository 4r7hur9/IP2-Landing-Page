# Projeto do Site IP2 Internet

## Visão geral

Projeto institucional da IP2 Internet com páginas públicas, integração com Meta Conversions API e base em evolução para dashboard administrativa, SEO técnico, segurança e arquitetura modular.

## Stack atual

- Node.js com Express
- Tailwind CLI local
- Prisma
- PostgreSQL
- EJS preparado para a dashboard administrativa

## Comandos principais

```bash
npm install
npm run dev
npm run build
npm run build:styles
npm run prisma:generate
npm run prisma:migrate:dev
npm run generate:password-hash -- "sua-senha-forte"
```

## Variáveis de ambiente

Copie `.env.example` para `.env` e preencha os valores necessários.

Campos principais nesta fase:

- `PORT`
- `TRUST_PROXY`
- `DATABASE_URL`
- `META_PIXEL_ID`
- `META_ACCESS_TOKEN`
- `META_API_VERSION`
- `META_TEST_EVENT_CODE`

Campos preparados para a autenticação administrativa:

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

## Estrutura atual

- `assets/`: estilos, scripts, ícones, fontes e mídias
- `docs/`: documentação técnica e operacional
- `prisma/`: schema e migrations
- `server/`: aplicação Express e serviços do backend
- `views/`: páginas e layouts da dashboard administrativa

## Estado atual da migração pública

As páginas públicas continuam em HTML, mas agora já operam com assets locais e estrutura modular:

- `index.html`, `contato.html` e `politicadeprivacidade.html` carregam `assets/styles/site.css` como camada compartilhada
- cada página possui CSS próprio em `assets/styles/pages/`
- as interações públicas foram separadas em `assets/scripts/pages/`
- as fontes agora são locais em `assets/fonts/`
- os ícones públicos foram trocados para SVG local via `assets/scripts/ui-icons.js`
- o `npm start` executa `prestart` com build dos estilos e geração do Prisma Client antes de subir a aplicação

## Rotas públicas amigáveis

- `/`
- `/contato`
- `/politica-de-privacidade`

As rotas antigas com `.html` continuam acessíveis por compatibilidade.

## Segurança administrativa já implementada

- login da dashboard em `/admin/login`
- rota protegida inicial em `/admin`
- API protegida em `/api/admin/session`
- JWT em cookies `httpOnly`
- `helmet` com endurecimento de headers
- rate limit global e rate limit dedicado ao login admin
- validação de entrada com `zod`

## Persistência e observabilidade

- Prisma configurado para PostgreSQL em `prisma/schema.prisma`
- migration inicial gerada em `prisma/migrations/20260626204500_phase3_persistence`
- sessões administrativas planejadas para persistência revogável no banco
- trilha de auditoria preparada para:
  - login bem-sucedido
  - login falho
  - refresh de sessão
  - logout
  - acesso admin sem autenticação
- logs de eventos da Meta preparados para persistência por status e contexto

## Aplicar a migration quando o banco estiver pronto

1. Preencha `DATABASE_URL` no `.env`
2. Garanta que o PostgreSQL esteja acessível
3. Execute:

```bash
npm run prisma:migrate:dev
```

Em deploy, o fluxo equivalente deve usar `prisma migrate deploy`.

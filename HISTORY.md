# Historico do Projeto

## Baseline conhecido antes da reforma estrutural

- O site e servido por Node.js com Express.
- As paginas publicas principais sao `index.html`, `contato.html` e `politicadeprivacidade.html`.
- A integracao com Meta Conversions API ja existe no backend com:
  - `POST /api/meta/events`
  - `GET /api/meta/health`
- O front-end ja envia `PageView` e `Lead` para a integracao Meta.
- Os assets do site ja foram reorganizados em `assets/` com separacao de icones, imagens, scripts e estilos.

## 2026-06-26

### Fase 0 - Preparacao do fluxo

- Criada a branch `dev` para concentrar o desenvolvimento da reforma.
- Adicionado `.editorconfig` para padronizar formatacao.
- Adicionado `docs/ENGINEERING-STANDARDS.md` para formalizar convencoes de nomenclatura, idioma e organizacao.

### Fase 1 - Fundacao tecnica

- Instaladas as dependencias base para Tailwind CLI, Prisma, EJS e execucao concorrente no ambiente de desenvolvimento.
- Criados scripts iniciais de build de estilos e comandos do Prisma.
- Criada a estrutura base para estilos modulares, templates com renderizacao no servidor, conteudo centralizado, fontes locais e icones SVG.
- Adicionados `README.md` e `HISTORY.md` como documentos oficiais do projeto.

### Fase 2 - Seguranca e autenticacao inicial da dashboard

- Implementado login administrativo com JWT em cookies `httpOnly` e `SameSite=Strict`.
- Criadas rotas administrativas iniciais:
  - `/admin/login`
  - `/admin`
  - `/api/admin/session`
  - `/api/admin/security-status`
- Adicionados `helmet`, `express-rate-limit`, `cookie-parser`, `jsonwebtoken`, `bcryptjs` e `zod`.
- Configurado `trust proxy` de forma segura por padrao via `TRUST_PROXY=0`.
- Criado utilitario `npm run generate:password-hash -- "senha"` para preparar `ADMIN_DASHBOARD_PASSWORD_HASH`.
- Validado o fluxo de login, redirecionamento, protecao de rota e leitura da sessao autenticada.

### Fase 3 - Persistencia Prisma/PostgreSQL e observabilidade

- Expandido o `schema.prisma` com modelos para:
  - `AdminSession`
  - `SecurityAuditLog`
  - `MetaEventLog`
  - `MetaQualitySnapshot`
- Criado helper central de banco em `server/lib/database.js` com tratamento para banco nao configurado e falha de acesso.
- A autenticacao admin passou a usar sessao persistida e revogavel no banco.
- A dashboard agora distingue erro de autenticacao de erro de banco/migration ausente.
- Criado registro de auditoria para login bem-sucedido, login falho, refresh, logout e tentativa de acesso sem autenticacao.
- A integracao Meta ganhou base de persistencia para registrar status dos envios e contexto do evento.
- Gerada a migration inicial em `prisma/migrations/20260626204500_phase3_persistence/migration.sql`.
- Como `DATABASE_URL` ainda nao estava configurada no ambiente local, a migration foi preparada no repositório, mas nao aplicada automaticamente ao banco.

# Histórico do Projeto

## Baseline conhecido antes da reforma estrutural

- O site é servido por Node.js com Express.
- As páginas públicas principais são `index.html`, `contato.html` e `politicadeprivacidade.html`.
- A integração com Meta Conversions API já existe no backend com:
  - `POST /api/meta/events`
  - `GET /api/meta/health`
- O front-end já envia `PageView` e `Lead` para a integração Meta.
- Os assets do site já foram reorganizados em `assets/` com separação de ícones, imagens, scripts e estilos.

## 2026-06-26

### Fase 0 - Preparação do fluxo

- Criada a branch `dev` para concentrar o desenvolvimento da reforma.
- Adicionado `.editorconfig` para padronizar formatação.
- Adicionado `docs/ENGINEERING-STANDARDS.md` para formalizar convenções de nomenclatura, idioma e organização.

### Fase 1 - Fundação técnica

- Instaladas as dependências base para Tailwind CLI, Prisma, EJS e execução concorrente no ambiente de desenvolvimento.
- Criados scripts iniciais de build de estilos e comandos do Prisma.
- Criada a estrutura base para estilos modulares, templates com renderização no servidor, conteúdo centralizado, fontes locais e ícones SVG.
- Adicionados `README.md` e `HISTORY.md` como documentos oficiais do projeto.

### Fase 2 - Segurança e autenticação inicial da dashboard

- Implementado login administrativo com JWT em cookies `httpOnly` e `SameSite=Strict`.
- Criadas rotas administrativas iniciais:
  - `/admin/login`
  - `/admin`
  - `/api/admin/session`
  - `/api/admin/security-status`
- Adicionados `helmet`, `express-rate-limit`, `cookie-parser`, `jsonwebtoken`, `bcryptjs` e `zod`.
- Configurado `trust proxy` de forma segura por padrão via `TRUST_PROXY=0`.
- Criado utilitário `npm run generate:password-hash -- "senha"` para preparar `ADMIN_DASHBOARD_PASSWORD_HASH`.
- Validado o fluxo de login, redirecionamento, proteção de rota e leitura da sessão autenticada.

### Fase 3 - Persistência Prisma/PostgreSQL e observabilidade

- Expandido o `schema.prisma` com modelos para:
  - `AdminSession`
  - `SecurityAuditLog`
  - `MetaEventLog`
  - `MetaQualitySnapshot`
- Criado helper central de banco em `server/lib/database.js` com tratamento para banco não configurado e falha de acesso.
- A autenticação admin passou a usar sessão persistida e revogável no banco.
- A dashboard agora distingue erro de autenticação de erro de banco ou migration ausente.
- Criado registro de auditoria para login bem-sucedido, login falho, refresh, logout e tentativa de acesso sem autenticação.
- A integração Meta ganhou base de persistência para registrar status dos envios e contexto do evento.
- Gerada a migration inicial em `prisma/migrations/20260626204500_phase3_persistence/migration.sql`.
- Como `DATABASE_URL` ainda não estava configurada no ambiente local, a migration foi preparada no repositório, mas não aplicada automaticamente ao banco.

### Fase 4 - Modularização pública, SEO e assets locais

- Removidos os carregamentos de Tailwind via CDN e de Google Fonts nas páginas públicas.
- Criado `tailwind.config.js` local com o tema customizado do site para manter classes como `bg-background`, `px-gutter`, `text-display-lg` e variantes de superfície.
- As páginas públicas agora carregam:
  - `assets/styles/site.css` como camada compartilhada
  - CSS específico por página em `assets/styles/pages/`
  - scripts modulares em `assets/scripts/pages/`
- Adicionadas fontes locais em `assets/fonts/` para `Space Grotesk`, `Inter` e `JetBrains Mono`.
- Substituída a dependência de Material Symbols por ícones SVG locais processados em `assets/scripts/ui-icons.js`.
- Incluídos metadados de SEO, Open Graph e Twitter diretamente no `head` das páginas públicas.
- Adicionadas rotas públicas amigáveis no Express para:
  - `/contato`
  - `/politica-de-privacidade`
- O fluxo de `npm start` passou a executar `prestart`, garantindo build dos estilos e geração do Prisma Client antes da subida da aplicação.

### Fase 5 - Dashboard operacional e acompanhamento manual de qualidade

- Criado o serviço `server/services/admin-dashboard-overview.js` para consolidar métricas da Meta, auditoria administrativa, sessões ativas e snapshots de qualidade.
- A dashboard em `views/pages/admin-dashboard.ejs` deixou de ser estática e passou a exibir:
  - cards de resumo operacional
  - saúde da integração Meta
  - tendência diária da janela recente
  - tabelas com eventos Meta e auditoria administrativa
  - histórico de snapshots de Dataset Quality
- Adicionada rota protegida `GET /api/admin/dashboard-overview` para leitura estruturada do painel.
- Adicionado fluxo protegido `POST /admin/meta-quality-snapshots` para registrar snapshots manuais de Dataset Quality até a fase de automação.
- Validada a renderização do EJS e a consolidação do overview mesmo sem `DATABASE_URL`, com fallback seguro para ambiente sem banco configurado.

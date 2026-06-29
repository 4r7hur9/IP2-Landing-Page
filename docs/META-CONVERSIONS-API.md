# Integracao com a Meta Conversions API

## O que foi instalado

- Servidor Node em `server.js`
- Endpoint no servidor em `POST /api/meta/events`
- Healthcheck em `GET /api/meta/health`
- Integracao front-end em `assets/scripts/meta-capi.js`
- Tracking implementado para:
  - `PageView` nas paginas `index.html`, `contato.html` e `politicadeprivacidade.html`
  - `Lead` no formulario de contato

## Como configurar

1. Copie `.env.example` para `.env`
2. Preencha o token gerado no Gerenciador de Eventos:

```env
PORT=3000
META_PIXEL_ID=1955246271821508
META_ACCESS_TOKEN=COLE_AQUI_O_SEU_TOKEN
META_API_VERSION=v25.0
META_TEST_EVENT_CODE=
```

## Como rodar

```bash
npm install
npm start
```

Ou em desenvolvimento:

```bash
npm run dev
```

## Como testar

- Abra `http://localhost:3000/api/meta/health`
- Confirme que `access_token_configured` mudou para `true`
- Se quiser testar no Events Manager sem publicar, preencha `META_TEST_EVENT_CODE`

## Observacoes

- O token da Meta fica apenas no servidor, nunca no HTML
- Se a hospedagem final nao suportar Node, essa integracao nao vai funcionar apenas com arquivos estaticos
- O `Lead` usa deduplicacao entre Pixel e servidor por `eventID` no navegador e `event_id` no backend

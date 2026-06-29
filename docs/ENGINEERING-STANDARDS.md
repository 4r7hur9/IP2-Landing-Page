# Padroes de Engenharia

## Objetivo

Este documento define as convencoes tecnicas do projeto para manter o codigo claro, leve e facil de manter.

## Idioma

- Codigo tecnico em ingles.
- Documentacao operacional em portugues.
- Conteudo publico do site permanece em portugues.

## Nomenclatura

- Funcoes devem usar nomes claros e orientados a acao.
- Variaveis devem explicar o que armazenam sem abreviacoes vagas.
- Constantes devem indicar o dominio e a finalidade.
- Arquivos devem usar nomes previsiveis e alinhados ao modulo.

### Exemplos recomendados

- `createAccessToken`
- `validateLoginRequest`
- `fetchMetaQualitySnapshot`
- `dashboardSession`
- `recentEventLogs`

### Exemplos a evitar

- `doStuff`
- `handleIt`
- `cfg`
- `obj`
- `resp2`

## Estrutura de codigo

- Cada modulo deve ter uma responsabilidade principal.
- Regras de negocio nao devem ficar misturadas com configuracao de infraestrutura.
- Handlers de rota devem ser finos e delegar logica para services.
- Middlewares devem ter nomes que expliquem o criterio de protecao ou validacao.
- Funcoes longas devem ser quebradas em partes menores e testaveis.

## Front-end

- HTML semantico e com landmarks reais.
- CSS separado por base, componentes e paginas.
- JavaScript separado por modulos compartilhados e scripts de pagina.
- Assets externos so permanecem quando forem intencionais e justificados.

## Back-end

- Rotas, services, middlewares e utilitarios ficam separados por dominio.
- Validacao de entrada deve acontecer antes da regra de negocio.
- Erros retornados ao cliente nao devem expor detalhes internos sensiveis.
- Logs devem ser objetivos e uteis para auditoria.

## Testes

- Toda regra critica nova deve ter cobertura automatizada.
- Testes unitarios validam comportamento isolado.
- Testes E2E cobrem os fluxos criticos do usuario e da dashboard.

## Fluxo de trabalho

- O desenvolvimento acontece na branch `dev`.
- Mudancas estruturais devem ser feitas em etapas pequenas.
- Ao final de cada etapa, o progresso deve ser resumido antes da proxima fase.

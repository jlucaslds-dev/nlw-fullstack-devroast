# specs/ — Feature Specifications

Specs are written **before implementation** to research, decide, and document how a feature will be built.

## File format

- **Name:** `kebab-case.md` describing the feature (e.g. `drizzle.md`, `code-editor-syntax-highlight.md`)
- **Language:** Portuguese for prose, English for code

## Required sections

```markdown
# Spec: <Feature Name>

## Resumo
Uma ou duas frases descrevendo o que sera feito e por que.

## Pesquisa realizada
Tabelas comparativas de abordagens, bibliotecas ou ferramentas avaliadas.
Cada tabela deve ter coluna de **Veredicto** com a decisao.

## Decisao
Arquitetura escolhida com justificativa. Diagramas ASCII quando util.

## Especificacao de implementacao
- Componentes/arquivos a criar ou modificar
- APIs e assinaturas de funcoes (pseudocodigo TypeScript)
- Detalhes tecnicos relevantes (CSS, performance, etc.)

## Dependencias novas
Tabela com pacote, motivo e estimativa de bundle.
Omitir se nao houver dependencias novas.

## Riscos e consideracoes
Lista numerada de riscos com estrategias de mitigacao.

## TODOs de implementacao
Checklist com `- [ ]` de cada passo na ordem de execucao.
Marcar com `- [x]` conforme implementado.
```

## Guidelines

- Specs are **living documents** — update TODOs as implementation progresses
- Include **bundle size estimates** when adding client-side dependencies
- Use **tables** for comparing alternatives (keeps decisions traceable)
- Code blocks are **pseudocode** — enough detail to guide implementation, not final code

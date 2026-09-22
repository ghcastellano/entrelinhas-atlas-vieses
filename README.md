# Entrelinhas — Atlas dos vieses cognitivos

**Site em produção:** https://entrelinhas-atlas-vieses.vercel.app

**GitHub:** https://github.com/ghcastellano/entrelinhas-atlas-vieses (privado).

Atlas educativo em português brasileiro, adaptado da imagem **Cognitive Bias Codex, 2016** de John Manoogian III, com categorização de Buster Benson.

## Escopo conferido

- 188 nomes distintos, 189 posições na imagem (negatividade aparece em duas categorias).
- 4 categorias e todos os 20 subgrupos preservados.
- Explicação, exemplo de erro, alternativa responsável e ação prática para cada entrada.
- 376 questões: 188 situações com resposta comentada e 188 perguntas de transferência com referência para autoavaliação.
- Busca sem distinção de acentos, filtros, mapa por teclado, links diretos e progresso local.
- Sinônimos mantidos como na imagem. Efeito Delmore incluído, apesar da ausência em versões posteriores do SVG.

## Desenvolvimento

Node.js 22 (22.12 ou superior dentro dessa versão principal). Sem backend, credenciais ou variáveis de ambiente.

```sh
npm ci
npm run dev
```

```sh
node scripts/compile-content.mjs
npm test
npm run build
npx playwright install chromium
npm run dev -- --port 5173
# Em outro terminal:
npm run test:e2e
```

Para testar um deploy: `BASE_URL=https://SEU-DOMINIO npm run test:e2e`.

## Conteúdo e revisão

- `src/data/original.json`: dados originais do autor, sem alteração.
- `src/data/categories.json`: categorias e subgrupos traduzidos.
- `src/data/lessons.txt`: textos editoriais, uma linha por lição, 12 campos separados por `|`.
- `src/data/source-links.json`: referências explícitas por entrada.
- `scripts/compile-content.mjs`: gera os dados usados pela aplicação e o inventário público.
- `public/inventario.json`: inventário bilíngue, com todas as posições.
- `public/referencia-codex-2016.png`: imagem fornecida, conservada para conferência.
- `public/fontes.html`: fontes e notas epistemológicas.
- `evidence/`: relatório de conferência e verificações de interface.

Não editar `lessons.json` ou `inventario.json` manualmente. A integração contínua confirma que os arquivos gerados correspondem aos textos.

O teste estrutural garante cobertura, agrupamento e integridade; não substitui revisão acadêmica. Os exemplos são educativos e não testes psicológicos validados. A pergunta aberta exige autoavaliação: nenhuma IA julga a resposta.

## Arquitetura

React + TypeScript + Vite. Fontes locais (DM Sans e Newsreader), ícones Lucide. Sem rastreadores, chamadas de API ou envio de respostas. Progresso salvo em `localStorage`, validado na leitura e com tratamento para armazenamento indisponível. Estado de busca e filtros é temporário. Rotas de lições usam `?vies=slug` e a página sobre usa `?sobre=1`.

Vercel publica a branch `main` em produção pela integração nativa com GitHub. Projeto: `gustavo-s/entrelinhas-atlas-vieses`. O workflow verifica conteúdo, TypeScript, build, fluxos de estudo, navegação e acessibilidade automatizada. Testes também podem ser executados contra a URL pública após publicar.

## Licenças

Conteúdo adaptado, organização e imagem de referência: **CC BY-SA 4.0**, com créditos a John Manoogian III e Buster Benson. A versão vetorial complementar e os links originais são de TilmannR/Wikimedia Commons. Tradução, exemplos, exercícios e interface foram acrescentados nesta adaptação. Não há endosso dos autores originais.

Código da aplicação: MIT. Dependências e fontes mantêm suas respectivas licenças.

Fontes principais: [dados do autor](https://gist.github.com/jm3/32175bc006a2ce05abd067468e4fa26c), [categorização](https://betterhumans.pub/cognitive-bias-cheat-sheet-55a472476b18), [SVG e licença](https://commons.wikimedia.org/wiki/File:Cognitive_bias_codex_en.svg).

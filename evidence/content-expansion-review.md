# Revisão e ampliação das aulas — 23/09/2026

## Entrega editorial

- 188 aulas, 189 posições, 4 categorias e 20 subgrupos do inventário original.
- 62,277 palavras nos campos didáticos (exclui títulos, nomes alternativos, navegação e referências).
- Duas explicações adicionais, dois casos comentados, distinção conceitual, três passos e uma síntese em cada aula.
- 376 novos casos comentados; 376 questões existentes preservadas, com resposta comentada e transferência para outra situação.
- 46 títulos revisados. Sinônimos, nomes anteriores e originais participam da busca.
- 21 notas explicitam limitações de padronização da nomenclatura consultada.
- URLs originais e IDs do progresso preservados em todas as 188 entradas.

## Cuidados de interpretação

Diferenciamos vieses, efeitos de memória, princípios lógicos e rótulos populares. Mantidas as ressalvas sobre Delmore, Dunning–Kruger, mão quente, reações a correções, placebo, disfluência e sete mais ou menos dois. Sinônimos do mapa permanecem separados e identificados. Casos são ilustrações autorais, não reprodução de experimentos; testes estruturais não substituem revisão acadêmica independente.

As fontes da revisão estão em `src/data/editorial-notes.json`, nas aulas pertinentes e em `public/fontes.html`. Incluem publicações brasileiras para nomenclatura e estudos específicos para conceitos com limites importantes.

## Verificação local da versão para publicar

- Compilação determinística e 7 testes de conteúdo passaram.
- TypeScript, build e formatação passaram.
- 12 testes Chromium passaram, incluindo abertura e comparação dos campos de todas as 188 aulas, sinônimos, compatibilidade de links e progresso, navegação, exercícios e armazenamento indisponível.
- Verificação WCAG automatizada em 320, 390, 768 e 1440 px, nas páginas inicial, aula, sobre e fontes: nenhuma violação nos critérios executados.
- WebKit móvel: busca, aula, exercício, persistência, transbordamento e console passaram.
- Inspeção visual em desktop e celular; índice móvel convertido em seção expansível para não deslocar o título excessivamente.
- Ampliação de texto a 200% em uma aula móvel: sem transbordamento horizontal.

## Limites conhecidos

A busca e o conteúdo continuam locais e sem dependência de APIs. O pacote principal inclui todo o atlas: aproximadamente 237 kB comprimidos. O Vite emite aviso de tamanho por ultrapassar 500 kB sem compressão; a compilação não apresenta erro. Não foi adicionada uma arquitetura de carregamento remoto para esta revisão editorial.

A publicação usa a integração GitHub → Vercel. A verificação da URL pública é executada após o deploy, para testar a versão efetivamente publicada.

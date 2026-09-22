# Verificação do Entrelinhas

Data: 22 de setembro de 2026.

## Verificações locais aprovadas

- Integridade editorial: 5 testes aprovados, incluindo cobertura exata das 188 entradas/189 posições e 20 subgrupos; 376 enunciados distintos.
- TypeScript em modo estrito e build de produção aprovados.
- 11 testes Playwright/Chromium aprovados. Um deles percorre todas as 188 lições e confere explicação, exemplos, ação prática, perguntas e link de referência.
- Busca em português/inglês e sem acentos, filtros por categoria/subgrupo, visualização agrupada, ausência de resultados e recuperação dos filtros.
- Alternativa incorreta, feedback, nova tentativa, resposta correta, reflexão, referência, conclusão e persistência após recarregar.
- Links diretos, próximo viés, histórico do navegador, página sobre, bibliografia e entrada inexistente.
- Navegação do mapa por teclado e foco no título da lição.
- Armazenamento inválido ou indisponível não impede o estudo; falha de persistência é informada.
- Sem transbordamento horizontal em 320, 390, 768 e 1440 px. Verificação adicional com texto ampliado a 200% e movimento reduzido.
- Axe: nenhuma violação automática WCAG 2 A/AA e 2.1 AA nas páginas inicial, lição, sobre e bibliografia, nas quatro larguras.
- WebKit móvel (390 px): busca, abertura de lição, exercício, conclusão, persistência, ausência de transbordamento e ausência de erros JavaScript aprovados.
- Capturas de desktop, celular e lição examinadas visualmente. Evidências PNG são geradas localmente e anexadas pelo workflow; não entram no bundle público.
- Dependências auditadas: nenhuma vulnerabilidade reportada pelo npm nesta verificação.

## Limites do relatório

Checagens automáticas de acessibilidade e inspeção visual reduzem riscos, mas não certificam ausência de qualquer problema em todo navegador, dispositivo ou tecnologia assistiva. As perguntas abertas usam autoavaliação e resposta de referência. Os testes de conteúdo verificam integridade e cobertura, não validam psicometricamente o material.

## Reproduzir

Consulte os comandos no README. `scripts/smoke-webkit.mjs` aceita `BASE_URL` para verificar o mesmo fluxo em produção.

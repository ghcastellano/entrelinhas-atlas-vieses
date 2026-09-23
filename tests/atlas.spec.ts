import { test, expect } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";
import lessons from "../src/data/lessons.json" with { type: "json" };
import categories from "../src/data/categories.json" with { type: "json" };

test("search, accents, category filters, subgroup filters and empty state", async ({
  page,
}) => {
  const errors: string[] = [];
  page.on("pageerror", (e) => errors.push(e.message));
  await page.goto("/");
  await expect(page.locator(".bias-card")).toHaveCount(188);
  await page.getByRole("textbox", { name: "Buscar viés" }).fill("confirmacao");
  await expect(page.locator(".bias-card")).toHaveCount(1);
  await expect(page.locator(".bias-card h3")).toHaveText("Viés de confirmação");
  await page
    .getByRole("textbox", { name: "Buscar viés" })
    .fill("Dunning-Kruger");
  await expect(page.locator(".bias-card")).toHaveCount(1);
  await page.getByRole("button", { name: "Limpar busca" }).click();
  for (const [i, c] of categories.entries()) {
    await page.getByLabel("Filtrar categoria").selectOption(c.id);
    await expect(page.locator(".bias-card")).toHaveCount([42, 63, 53, 31][i]);
  }
  await page.getByLabel("Filtrar subgrupo").selectOption("3");
  await expect(page.locator(".bias-card")).toHaveCount(6);
  await page
    .getByRole("textbox", { name: "Buscar viés" })
    .fill("xyzqz-inexistente");
  await expect(page.getByText("Nenhum caminho por aqui.")).toBeVisible();
  await page.getByRole("button", { name: "Limpar filtros" }).click();
  await expect(page.locator(".bias-card")).toHaveCount(188);
  await page.getByRole("button", { name: "Ver subgrupos da imagem" }).click();
  await expect(page.locator(".subgroup")).toHaveCount(20);
  await expect(page.locator(".bias-card")).toHaveCount(189);
  expect(errors).toEqual([]);
});

test("every lesson opens with full teaching content and distinct exercises", async ({
  page,
}) => {
  await page.goto("/");
  for (const l of lessons) {
    await page.evaluate((id) => {
      history.pushState({}, "", `?vies=${id}`);
      dispatchEvent(new PopStateEvent("popstate"));
    }, l.id);
    await expect(page.locator("article h1")).toHaveText(l.name);
    await expect(page.locator(".explanation")).toHaveText(l.explanation);
    await expect(page.locator("#entender .lesson-prose p")).toHaveText(
      l.paragraphs,
    );
    await expect(page.locator(".worked-example p")).toHaveText(l.cases);
    await expect(page.locator("#limites > p")).toHaveText(l.distinction);
    await expect(page.locator(".practice-steps li")).toHaveText(l.steps);
    await expect(page.locator(".lesson-takeaway p")).toHaveText(l.takeaway);
    await expect(page.locator(".example.wrong p")).toHaveText(l.wrong);
    await expect(page.locator(".example.right p")).toHaveText(l.right);
    await expect(page.locator(".practice p")).toHaveText(l.practice);
    await expect(page.locator(".quiz legend")).toContainText(l.question);
    await expect(page.getByLabel(l.transfer, { exact: false })).toHaveCount(1);
    await expect(page.locator(".option")).toHaveCount(2);
    await expect(
      page.getByRole("link", { name: "Consultar referência" }),
    ).toHaveAttribute("href", l.sourceUrl);
  }
});

test("Brazilian terminology, old names and new reading navigation", async ({
  page,
}) => {
  await page.goto("/");
  const search = page.getByRole("textbox", { name: "Buscar viés" });
  for (const [query, title] of [
    ["vies de atencao", "Viés atencional"],
    ["custos afundados", "Falácia dos custos afundados"],
    ["custos irrecuperaveis", "Falácia dos custos afundados"],
    ["pratica de recuperacao", "Efeito de testagem"],
  ]) {
    await search.fill(query);
    await expect(page.locator(".bias-card")).toHaveCount(1);
    await expect(page.locator(".bias-card h3")).toHaveText(title);
  }
  const l = lessons.find((l) => l.originalName === "Attentional bias")!;
  await page.evaluate(
    (id) => localStorage.setItem("entrelinhas-learned", JSON.stringify([id])),
    l.id,
  );
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto(`/?vies=${l.id}`);
  await expect(page.locator("h1")).toHaveText("Viés atencional");
  await expect(
    page.getByText("Estudo concluído", { exact: true }),
  ).toBeVisible();
  await page.locator(".mobile-lesson-toc summary").click();
  await page.getByRole("link", { name: "03 / Veja no cotidiano" }).click();
  await expect(page.locator("#cotidiano h2")).toBeInViewport();
  const descriptive = lessons.find((l) => l.originalName === "Delmore effect")!;
  await page.goto(`/?vies=${descriptive.id}`);
  await page.getByText("Sobre o nome em português", { exact: true }).click();
  await expect(page.locator(".term-note p")).toBeVisible();
});

test("wrong answer, retry, reflection, completion and persistence", async ({
  page,
}) => {
  const l = lessons[0];
  await page.goto(`/?vies=${l.id}`);
  await expect(
    page.getByRole("button", { name: "Concluir este estudo" }),
  ).toBeDisabled();
  await page.getByRole("button", { name: l.incorrect, exact: false }).click();
  await expect(page.getByText("Vale ajustar o raciocínio.")).toBeVisible();
  await page.getByRole("button", { name: "Tentar novamente" }).click();
  await page.getByRole("button", { name: l.correct, exact: false }).click();
  await expect(page.getByText("Isso mesmo.")).toBeVisible();
  await expect(
    page.getByRole("button", { name: "Comparar minha resposta" }),
  ).toBeDisabled();
  await page
    .locator("#reflection")
    .fill("Vou ouvir uma amostra representativa e comparar proporções.");
  await page.getByRole("button", { name: "Comparar minha resposta" }).click();
  await expect(page.getByText(l.reference)).toBeVisible();
  await page.getByRole("button", { name: "Concluir este estudo" }).click();
  await expect(page.locator(".header-progress strong")).toHaveText("1");
  await page.reload();
  await expect(
    page.getByText("Estudo concluído", { exact: true }),
  ).toBeVisible();
  await expect(page.locator(".header-progress strong")).toHaveText("1");
  await page.getByRole("button", { name: "Voltar ao atlas" }).click();
  await page
    .getByRole("button", { name: "Ainda não explorei", exact: true })
    .click();
  await expect(page.locator(".bias-card")).toHaveCount(187);
});

test("direct links, browser navigation, about and missing entry", async ({
  page,
}) => {
  await page.goto(`/?vies=${lessons[80].id}`);
  await expect(page.locator("h1")).toHaveText(lessons[80].name);
  await page.getByRole("button", { name: "Próximo viés" }).click();
  await expect(page.locator("h1")).toHaveText(lessons[81].name);
  await page.goBack();
  await expect(page.locator("h1")).toHaveText(lessons[80].name);
  await page
    .getByRole("button", { name: "Sobre o projeto", exact: true })
    .click();
  await expect(page).toHaveURL(/sobre=1/);
  await page.reload();
  await expect(page.getByText("Fidelidade à imagem")).toBeVisible();
  await page
    .getByRole("link", { name: "Bibliografia e notas de interpretação" })
    .click();
  await expect(page.locator("h1")).toContainText("referências");
  await page.goto("/?vies=nao-existe");
  await expect(
    page.getByRole("heading", { name: "Este caminho não está no atlas." }),
  ).toBeVisible();
  await page.getByRole("button", { name: "Voltar ao atlas" }).click();
  await expect(page.locator(".bias-card")).toHaveCount(188);
});

test("map has keyboard navigation and opens a lesson", async ({ page }) => {
  await page.goto("/");
  const point = page.locator('[data-map-index="0"]');
  await point.focus();
  await page.keyboard.press("ArrowRight");
  await expect(page.locator('[data-map-index="1"]')).toBeFocused();
  await page.keyboard.press("Enter");
  await expect(page.locator("article h1")).toHaveText(lessons[1].name);
  await expect(page.locator("article h1")).toBeFocused();
});

test("bad or unavailable browser storage does not break study", async ({
  browser,
}) => {
  const context = await browser.newContext();
  await context.addInitScript(() => {
    localStorage.setItem("entrelinhas-learned", "not json");
  });
  const page = await context.newPage();
  await page.goto("/");
  await expect(page.locator(".header-progress strong")).toHaveText("0");
  await context.close();
  const blocked = await browser.newContext();
  await blocked.addInitScript(() => {
    Object.defineProperty(window, "localStorage", {
      get() {
        throw new Error("blocked");
      },
    });
  });
  const p = await blocked.newPage();
  const l = lessons[0];
  await p.goto(`/?vies=${l.id}`);
  await p.getByRole("button", { name: l.correct, exact: false }).click();
  await p.locator("#reflection").fill("Comparar dados representativos.");
  await p.getByRole("button", { name: "Comparar minha resposta" }).click();
  await p.getByRole("button", { name: "Concluir este estudo" }).click();
  await expect(
    p.getByText("Seu navegador não permitiu salvar o progresso.", {
      exact: false,
    }),
  ).toBeVisible();
  await blocked.close();
});

for (const width of [320, 390, 768, 1440])
  test(`responsive layout and accessibility at ${width}px`, async ({
    page,
  }) => {
    await page.setViewportSize({ width, height: 900 });
    await page.goto("/");
    await page.evaluate(() => document.fonts.ready);
    expect(
      await page.evaluate(
        () => document.documentElement.scrollWidth <= innerWidth,
      ),
    ).toBe(true);
    await page.screenshot({
      path: `evidence/atlas-${width}.png`,
      fullPage: false,
    });
    const home = await new AxeBuilder({ page })
      .withTags(["wcag2a", "wcag2aa", "wcag21aa"])
      .analyze();
    expect(home.violations).toEqual([]);
    await page.goto(`/?vies=${lessons[24].id}`);
    await page.evaluate(() => document.fonts.ready);
    expect(
      await page.evaluate(
        () => document.documentElement.scrollWidth <= innerWidth,
      ),
    ).toBe(true);
    await page.screenshot({
      path: `evidence/lesson-${width}.png`,
      fullPage: true,
    });
    const detail = await new AxeBuilder({ page })
      .withTags(["wcag2a", "wcag2aa", "wcag21aa"])
      .analyze();
    expect(detail.violations).toEqual([]);
    await page.goto("/?sobre=1");
    const about = await new AxeBuilder({ page })
      .withTags(["wcag2a", "wcag2aa", "wcag21aa"])
      .analyze();
    expect(about.violations).toEqual([]);
    await page.goto("/fontes.html");
    const sources = await new AxeBuilder({ page })
      .withTags(["wcag2a", "wcag2aa", "wcag21aa"])
      .analyze();
    expect(sources.violations).toEqual([]);
  });

test("200% text enlargement and reduced motion", async ({ page }) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.setViewportSize({ width: 1280, height: 900 });
  await page.goto("/");
  await page.evaluate(() => {
    document.documentElement.style.fontSize = "200%";
  });
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= innerWidth,
    ),
  ).toBe(true);
  await expect(page.locator("html")).toHaveCSS("scroll-behavior", "auto");
});

import { webkit } from "@playwright/test";
import assert from "node:assert/strict";
import fs from "node:fs";
const lessons = JSON.parse(fs.readFileSync("src/data/lessons.json", "utf8"));
const browser = await webkit.launch();
try {
  const context = await browser.newContext({
    viewport: { width: 390, height: 844 },
    isMobile: true,
    hasTouch: true,
  });
  const page = await context.newPage();
  const errors = [];
  page.on("pageerror", (e) => errors.push(e.message));
  const base = process.env.BASE_URL || "http://localhost:5173";
  await page.goto(base);
  await page.waitForLoadState("networkidle");
  assert.equal(await page.locator(".bias-card").count(), 188);
  await page.getByRole("textbox", { name: "Buscar viés" }).fill("confirmacao");
  await page.waitForFunction(
    () => document.querySelectorAll(".bias-card").length === 1,
  );
  await page.locator(".bias-card").click();
  const lesson = lessons.find((l) => l.originalName === "Confirmation bias");
  await page.getByRole("heading", { name: lesson.name, exact: true }).waitFor();
  assert.equal(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= innerWidth,
    ),
    true,
  );
  await page
    .getByRole("button", { name: lesson.correct, exact: false })
    .click();
  await page
    .locator("#reflection")
    .fill("Buscar casos contrários à hipótese e comparar explicações.");
  await page.getByRole("button", { name: "Comparar minha resposta" }).click();
  await page.getByRole("button", { name: "Concluir este estudo" }).click();
  await page.reload();
  await page.getByText("Estudo concluído", { exact: true }).waitFor();
  assert.equal(
    await page.locator(".header-progress strong").textContent(),
    "1",
  );
  await page.screenshot({ path: "evidence/webkit-mobile.png", fullPage: true });
  assert.deepEqual(errors, []);
  console.log(
    "WebKit mobile: search, study, exercise, persistence, overflow and console passed.",
  );
} finally {
  await browser.close();
}

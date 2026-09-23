import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
const read = (f) => JSON.parse(fs.readFileSync(f, "utf8"));
const lessons = read("src/data/lessons.json"),
  original = read("src/data/original.json"),
  categories = read("src/data/categories.json");
const flat = original.children.flatMap((c) =>
  c.children.flatMap((g) => g.children.map((b) => b.name)),
);
test("Exact coverage of the 2016 image: 188 unique names, 189 occurrences, 20 subgroups", () => {
  assert.equal(lessons.length, 188);
  assert.equal(flat.length, 189);
  assert.equal(new Set(flat).size, 188);
  assert.deepEqual(new Set(lessons.map((l) => l.originalName)), new Set(flat));
  assert.equal(
    categories.reduce((n, c) => n + c.groups.length, 0),
    20,
  );
  assert.deepEqual(
    categories.map(
      (c) =>
        lessons.filter((l) => l.placements.some((p) => p.category === c.id))
          .length,
    ),
    [42, 63, 53, 31],
  );
});
test("Every original occurrence retains its category and subgroup", () => {
  original.children.forEach((c, ci) =>
    c.children.forEach((g, gi) =>
      g.children.forEach((b) => {
        const l = lessons.find((l) => l.originalName === b.name);
        assert.ok(
          l.placements.some(
            (p) => p.category === categories[ci].id && p.group === gi,
          ),
          b.name,
        );
      }),
    ),
  );
  assert.equal(
    lessons.reduce((n, l) => n + l.placements.length, 0),
    189,
  );
  assert.equal(
    lessons.find((l) => l.originalName === "Negativity bias").placements.length,
    2,
  );
});
test("All lessons have substantive Portuguese content, distinct examples and two new questions", () => {
  const fields = [
    "name",
    "explanation",
    "wrong",
    "right",
    "practice",
    "question",
    "correct",
    "incorrect",
    "feedback",
    "transfer",
    "reference",
  ];
  const questions = [];
  for (const l of lessons) {
    for (const field of fields)
      assert.ok(
        typeof l[field] === "string" && l[field].trim().length > 8,
        `${l.id}.${field}`,
      );
    assert.ok(l.explanation.length > 65, l.id);
    assert.notEqual(l.wrong, l.right);
    assert.notEqual(l.correct, l.incorrect);
    assert.ok(l.question.endsWith("?"), l.id);
    assert.ok(l.transfer.endsWith("?"), l.id);
    for (const q of [l.question, l.transfer]) {
      assert.notEqual(q, l.wrong);
      assert.notEqual(q, l.right);
      questions.push(q);
    }
    assert.ok(!/TODO|Lorem ipsum|placeholder/.test(JSON.stringify(l)), l.id);
    assert.ok(/^https:\/\//.test(l.sourceUrl), l.id);
  }
  assert.equal(new Set(questions).size, 376);
  assert.equal(new Set(lessons.map((l) => l.id)).size, 188);
});
test("Public inventory is a complete, human-auditable mirror", () => {
  const inventory = read("public/inventario.json");
  assert.equal(inventory.length, 4);
  const entries = inventory.flatMap((c) => c.groups.flatMap((g) => g.entries));
  assert.equal(entries.length, 189);
  assert.deepEqual(
    new Set(entries.map((e) => e.id)),
    new Set(lessons.map((l) => l.id)),
  );
  assert.ok(entries.every((e) => e.original && e.name && e.id));
});
test("Source text compiles reproducibly and all source links are explicit", () => {
  const rows = fs
    .readFileSync("src/data/lessons.txt", "utf8")
    .trim()
    .split("\n");
  assert.equal(rows.length, 188);
  assert.ok(rows.every((r) => r.split("|").length === 12));
  const sourceLinks = read("src/data/source-links.json");
  assert.deepEqual(
    new Set(Object.keys(sourceLinks)),
    new Set(lessons.map((l) => l.originalName)),
  );
  for (const l of lessons)
    assert.equal(l.sourceUrl, sourceLinks[l.originalName]);
});

test("Every original entry has a complete lesson, original cases and actionable steps", () => {
  const expanded = read("src/data/deep-lessons.json");
  assert.deepEqual(new Set(Object.keys(expanded)), new Set(flat));
  const paragraphs = [],
    cases = [];
  for (const l of lessons) {
    assert.equal(l.paragraphs.length, 2, l.id);
    assert.equal(l.cases.length, 2, l.id);
    assert.equal(l.steps.length, 3, l.id);
    for (const p of [...l.paragraphs, ...l.cases, l.distinction])
      assert.ok(
        p.trim().split(/\s+/).length >= 25,
        `${l.id}: incomplete teaching section`,
      );
    assert.ok(
      l.steps.every((s) => s.length > 25),
      l.id,
    );
    assert.ok(l.takeaway.length > 35, l.id);
    assert.ok(l.wordCount >= 290, l.id);
    assert.ok(l.readingMinutes >= 3, l.id);
    assert.notEqual(l.cases[0], l.cases[1], l.id);
    paragraphs.push(...l.paragraphs);
    cases.push(...l.cases);
    assert.equal(new Set(l.aliases).size, l.aliases.length, l.id);
    assert.ok(!l.aliases.includes(l.name), l.id);
    assert.ok(
      l.references.every((r) => r.title && /^https:\/\//.test(r.url)),
      l.id,
    );
  }
  assert.equal(
    new Set(paragraphs).size,
    376,
    "Explanations must not be generic repeated filler",
  );
  assert.equal(
    new Set(cases).size,
    376,
    "Worked examples must be independently authored",
  );
});

test("Brazilian title revisions preserve all previously published links and saved-progress IDs", () => {
  const previous = read("scripts/fixtures/original-links.json");
  for (const l of lessons)
    assert.equal(l.id, previous[l.originalName], l.originalName);
  const expected = {
    "Attentional bias": ["Viés atencional", "Viés de atenção"],
    "Sunk cost fallacy": [
      "Falácia dos custos afundados",
      "Falácia dos custos irrecuperáveis",
    ],
    "Self-serving bias": ["Viés de autosserviço", "Viés de autoatribuição"],
    "Testing effect": ["Efeito de testagem", "Prática de recuperação"],
  };
  for (const [originalName, [title, alias]] of Object.entries(expected)) {
    const l = lessons.find((l) => l.originalName === originalName);
    assert.equal(l.name, title);
    assert.ok(l.aliases.includes(alias));
  }
});

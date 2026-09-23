import fs from "node:fs";
const original = JSON.parse(fs.readFileSync("src/data/original.json", "utf8"));
const categories = JSON.parse(
  fs.readFileSync("src/data/categories.json", "utf8"),
);
const sourceLinks = JSON.parse(
  fs.readFileSync("src/data/source-links.json", "utf8"),
);
const rows = fs.readFileSync("src/data/lessons.txt", "utf8").trim().split("\n");
const expanded = JSON.parse(
  fs.readFileSync("src/data/deep-lessons.json", "utf8"),
);
const editorial = JSON.parse(
  fs.readFileSync("src/data/editorial-notes.json", "utf8"),
);
const slug = (s) =>
  s
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
const seen = new Set();
const lessons = rows.map((row, i) => {
  const fields = row.split("|");
  if (fields.length !== 12)
    throw new Error(`Line ${i + 1}: expected 12 fields, got ${fields.length}`);
  const [
    originalName,
    name,
    explanation,
    wrong,
    right,
    practice,
    question,
    correct,
    incorrect,
    feedback,
    transfer,
    reference,
  ] = fields;
  if (seen.has(originalName)) throw new Error(`Duplicate ${originalName}`);
  seen.add(originalName);
  const placements = [];
  original.children.forEach((c, ci) =>
    c.children.forEach((g, gi) => {
      if (g.children.some((b) => b.name === originalName))
        placements.push({ category: categories[ci].id, group: gi });
    }),
  );
  if (!placements.length)
    throw new Error(`Not in image inventory: ${originalName}`);
  const deep = expanded[originalName];
  if (!deep) throw new Error(`Missing complete lesson: ${originalName}`);
  const aliases = [...new Set([name, ...deep.aliases])].filter(
    (n) => n !== deep.name,
  );
  const words = [
    explanation,
    wrong,
    right,
    practice,
    question,
    correct,
    incorrect,
    feedback,
    transfer,
    reference,
    ...deep.paragraphs,
    ...deep.cases,
    deep.distinction,
    ...deep.steps,
    deep.takeaway,
  ]
    .join(" ")
    .split(/\s+/).length;
  return {
    // Keep the original slug so shared links and saved progress survive title revisions.
    id: slug(name),
    sourceUrl: sourceLinks[originalName],
    originalName,
    name: deep.name,
    aliases,
    termNote: editorial[originalName]?.termNote || "",
    references: editorial[originalName]?.references || [],
    paragraphs: deep.paragraphs,
    cases: deep.cases,
    distinction: deep.distinction,
    steps: deep.steps,
    takeaway: deep.takeaway,
    wordCount: words,
    readingMinutes: Math.max(3, Math.ceil(words / 180)),
    explanation,
    wrong,
    right,
    practice,
    question,
    correct,
    incorrect,
    feedback,
    transfer,
    reference,
    placements,
  };
});
if (Object.keys(expanded).some((key) => !seen.has(key)))
  throw new Error(
    "Expanded content has an entry outside the original inventory",
  );
fs.writeFileSync(
  "src/data/lessons.json",
  JSON.stringify(lessons, null, 2) + "\n",
);
console.log(
  `${lessons.length} lessons, ${lessons.reduce((a, b) => a + b.placements.length, 0)} placements`,
);

const inventory = categories.map((c, ci) => ({
  ...c,
  groups: c.groups.map((title, gi) => ({
    title,
    original: original.children[ci].children[gi].name,
    entries: original.children[ci].children[gi].children.map((b) => {
      const l = lessons.find((l) => l.originalName === b.name);
      return { original: b.name, name: l?.name, id: l?.id };
    }),
  })),
}));
fs.writeFileSync(
  "public/inventario.json",
  JSON.stringify(inventory, null, 2) + "\n",
);

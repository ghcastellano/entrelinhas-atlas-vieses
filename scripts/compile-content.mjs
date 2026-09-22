import fs from "node:fs";
const original = JSON.parse(fs.readFileSync("src/data/original.json", "utf8"));
const categories = JSON.parse(
  fs.readFileSync("src/data/categories.json", "utf8"),
);
const sourceLinks = JSON.parse(
  fs.readFileSync("src/data/source-links.json", "utf8"),
);
const rows = fs.readFileSync("src/data/lessons.txt", "utf8").trim().split("\n");
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
  return {
    id: slug(name),
    sourceUrl: sourceLinks[originalName],
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
    placements,
  };
});
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

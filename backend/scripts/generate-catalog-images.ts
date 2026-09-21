import { mkdirSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { seedCategories, seedProducts } from "../prisma/seed-data";

const OUT_DIR = join(__dirname, "../../frontend/public/catalog");

const CATEGORY_COLORS: Record<string, [string, string]> = {
  Laptops: ["#312e81", "#818cf8"],
  Smartphones: ["#164e63", "#22d3ee"],
  Audio: ["#4c1d95", "#c084fc"],
  Accessories: ["#1e3a5f", "#38bdf8"],
};

function slugify(name: string) {
  return name
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}

function svgFor(title: string, subtitle: string, colors: [string, string]) {
  const [from, to] = colors;
  const safeTitle = title.replace(/[<>&]/g, "");
  const safeSub = subtitle.replace(/[<>&]/g, "");
  return `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" width="900" height="675" viewBox="0 0 900 675" role="img" aria-label="${safeTitle}">
  <defs>
    <linearGradient id="g" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0%" stop-color="${from}"/>
      <stop offset="100%" stop-color="${to}"/>
    </linearGradient>
  </defs>
  <rect width="900" height="675" fill="url(#g)"/>
  <circle cx="720" cy="120" r="160" fill="rgba(255,255,255,0.08)"/>
  <circle cx="140" cy="560" r="200" fill="rgba(0,0,0,0.12)"/>
  <rect x="64" y="420" width="772" height="2" fill="rgba(255,255,255,0.25)"/>
  <text x="64" y="480" fill="#fff" font-family="Segoe UI, Arial, sans-serif" font-size="42" font-weight="700">${safeTitle}</text>
  <text x="64" y="530" fill="rgba(255,255,255,0.85)" font-family="Segoe UI, Arial, sans-serif" font-size="24">${safeSub}</text>
  <text x="64" y="620" fill="rgba(255,255,255,0.55)" font-family="Segoe UI, Arial, sans-serif" font-size="18">ShopAI</text>
</svg>
`;
}

function main() {
  mkdirSync(OUT_DIR, { recursive: true });

  writeFileSync(
    join(OUT_DIR, "hero.svg"),
    svgFor("ShopAI Catalog", "Laptops · Phones · Audio · Accessories", ["#1e1b4b", "#6366f1"]),
  );

  for (const category of seedCategories) {
    const slug = `category-${slugify(category.name)}`;
    const colors = CATEGORY_COLORS[category.name] ?? ["#1e293b", "#64748b"];
    writeFileSync(join(OUT_DIR, `${slug}.svg`), svgFor(category.name, category.description, colors));
  }

  for (const product of seedProducts) {
    const slug = slugify(product.name);
    const colors = CATEGORY_COLORS[product.category] ?? ["#1e293b", "#64748b"];
    writeFileSync(
      join(OUT_DIR, `${slug}.svg`),
      svgFor(product.name, `${product.brand} · ${product.category}`, colors),
    );
  }

  console.log(`Wrote catalog assets to ${OUT_DIR}`);
  console.log(`Products: ${seedProducts.length}, categories: ${seedCategories.length}, + hero.svg`);
}

main();

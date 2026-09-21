import type { Category, Product } from "../generated/prisma/client";

type ProductForDocument = Pick<
  Product,
  "name" | "description" | "brand" | "price" | "rating" | "reviewCount" | "attributes"
> & {
  category: Pick<Category, "name" | "slug">;
};

function formatAttributes(attributes: Product["attributes"]): string {
  if (!attributes || typeof attributes !== "object" || Array.isArray(attributes)) {
    return "";
  }

  const record = attributes as Record<string, unknown>;
  const parts = Object.entries(record)
    .map(([key, value]) => `${key}: ${String(value)}`)
    .join(", ");

  return parts ? `Specifications: ${parts}.` : "";
}

export function buildProductDocument(product: ProductForDocument): string {
  const priceInr = Number(product.price);
  const brand = product.brand ? `Brand: ${product.brand}.` : "";
  const attrs = formatAttributes(product.attributes);

  return [
    `Product: ${product.name}.`,
    `Category: ${product.category.name} (${product.category.slug}).`,
    brand,
    `Price: ₹${priceInr.toLocaleString("en-IN")}.`,
    `Rating: ${product.rating} stars from ${product.reviewCount} reviews.`,
    attrs,
    product.description.trim(),
  ]
    .filter(Boolean)
    .join(" ");
}

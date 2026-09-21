import { CategoryProductSection } from "@/components/home/category-product-section";
import { CategoryShowcaseCard } from "@/components/home/category-showcase-card";
import { HomeHero } from "@/components/home/home-hero";
import { ProductGrid } from "@/components/products/product-grid";
import { SectionHeading } from "@/components/ui/section-heading";
import { serverApi } from "@/lib/server-api";
import type { HomeCatalog } from "@/types/shop";

export const dynamic = "force-dynamic";

async function getHomeCatalog() {
  return serverApi<HomeCatalog>("/api/catalog/home", { cache: "no-store" });
}

export default async function HomePage() {
  const { featured, categories } = await getHomeCatalog();

  return (
    <div className="pb-4">
      <HomeHero />

      <section className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
        <SectionHeading
          title="Shop by category"
          description="Jump into a curated aisle—each category has eight highlighted products on the home page."
          href="/products"
        />
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {categories.map((category) => (
            <CategoryShowcaseCard key={category.id} category={category} />
          ))}
        </div>
      </section>

      <section className="border-y border-border bg-muted/25 py-12 sm:py-14">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <SectionHeading
            title="Featured picks"
            description="Top-rated and editor-selected products across the store."
            href="/products?sort=rating"
            linkLabel="Top rated"
          />
          <ProductGrid products={featured} />
        </div>
      </section>

      {categories.map((category, index) => (
        <CategoryProductSection key={category.id} category={category} alternate={index % 2 === 1} />
      ))}
    </div>
  );
}

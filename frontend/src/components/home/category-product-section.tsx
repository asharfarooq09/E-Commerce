import { ProductCard } from "@/components/products/product-card";
import { SectionHeading } from "@/components/ui/section-heading";
import type { HomeCategory } from "@/types/shop";

type CategoryProductSectionProps = {
  category: HomeCategory;
  alternate?: boolean;
};

export function CategoryProductSection({ category, alternate }: CategoryProductSectionProps) {
  return (
    <section
      id={`category-${category.slug}`}
      className={alternate ? "bg-muted/35 py-12 sm:py-14" : "py-12 sm:py-14"}
    >
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <SectionHeading
          title={category.name}
          description={category.description ?? undefined}
          href={`/products?category=${category.slug}`}
          linkLabel={`Shop ${category.name.toLowerCase()}`}
        />

        {/* Mobile: horizontal snap rail. Desktop: 2-row grid (4 cols × 2 rows). */}
        <div className="flex gap-4 overflow-x-auto pb-2 [-ms-overflow-style:none] [scrollbar-width:none] sm:gap-5 lg:grid lg:grid-cols-4 lg:gap-5 lg:overflow-visible lg:pb-0 [&::-webkit-scrollbar]:hidden">
          {category.products.map((product) => (
            <div
              key={product.id}
              className="w-[72vw] max-w-[320px] shrink-0 snap-start sm:w-[44vw] lg:w-auto lg:max-w-none"
            >
              <ProductCard product={product} />
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

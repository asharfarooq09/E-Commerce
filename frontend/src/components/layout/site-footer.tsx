import Link from "next/link";

export function SiteFooter() {
  return (
    <footer className="mt-auto border-t border-border bg-muted/30">
      <div className="mx-auto grid w-full max-w-7xl gap-8 px-4 py-12 sm:px-6 md:grid-cols-3 lg:px-8">
        <div>
          <p className="text-lg font-semibold text-primary">ShopAI</p>
          <p className="mt-2 max-w-sm text-sm text-muted-foreground">
            A modern e-commerce foundation built for product discovery, checkout, and future AI features.
          </p>
        </div>
        <div>
          <p className="text-sm font-semibold">Shop</p>
          <ul className="mt-3 space-y-2 text-sm text-muted-foreground">
            <li>
              <Link href="/products">All products</Link>
            </li>
            <li>
              <Link href="/products?category=laptops">Laptops</Link>
            </li>
            <li>
              <Link href="/products?category=smartphones">Smartphones</Link>
            </li>
          </ul>
        </div>
        <div>
          <p className="text-sm font-semibold">Account</p>
          <ul className="mt-3 space-y-2 text-sm text-muted-foreground">
            <li>
              <Link href="/orders">Order history</Link>
            </li>
            <li>
              <Link href="/wishlist">Wishlist</Link>
            </li>
            <li>
              <Link href="/cart">Cart</Link>
            </li>
          </ul>
        </div>
      </div>
      <div className="border-t border-border py-4 text-center text-xs text-muted-foreground">
        © {new Date().getFullYear()} ShopAI. Phase 1 e-commerce foundation.
      </div>
    </footer>
  );
}

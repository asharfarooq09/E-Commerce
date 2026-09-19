import Image from "next/image";
import Link from "next/link";
import { ArrowRight, ShieldCheck, Sparkles, Truck } from "lucide-react";
import { Button } from "@/components/ui/button";

export function HomeHero() {
  return (
    <section className="relative overflow-hidden border-b border-border">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,_rgba(79,70,229,0.12),_transparent_45%),radial-gradient(circle_at_bottom_left,_rgba(139,92,246,0.1),_transparent_40%)]" />
      <div className="relative mx-auto grid max-w-7xl gap-10 px-4 py-14 sm:px-6 lg:grid-cols-[1.05fr_0.95fr] lg:items-center lg:px-8 lg:py-20">
        <div className="space-y-7">
          <div className="inline-flex items-center gap-2 rounded-full border border-primary/15 bg-white/80 px-3 py-1 text-xs font-medium text-primary shadow-sm backdrop-blur">
            <Sparkles className="h-3.5 w-3.5" />
            Curated tech catalog · 32+ products
          </div>
          <div className="space-y-4">
            <h1 className="text-4xl font-bold leading-tight tracking-tight sm:text-5xl lg:text-6xl">
              Premium gadgets, organized the way you actually shop.
            </h1>
            <p className="max-w-xl text-base leading-relaxed text-muted-foreground sm:text-lg">
              Browse laptops, phones, audio, and accessories by category. Fast filters, real inventory,
              and a checkout flow built on a proper backend—not demo APIs.
            </p>
          </div>
          <div className="flex flex-wrap gap-3">
            <Button asChild size="lg" className="rounded-full px-6">
              <Link href="/products">
                Explore catalog
                <ArrowRight className="h-4 w-4" />
              </Link>
            </Button>
            <Button asChild variant="outline" size="lg" className="rounded-full px-6">
              <Link href="#category-laptops">Shop laptops</Link>
            </Button>
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            <div className="rounded-2xl border border-border/80 bg-white/80 p-4 shadow-sm backdrop-blur">
              <Truck className="mb-2 h-5 w-5 text-primary" />
              <p className="font-medium">Free shipping ₹50k+</p>
              <p className="text-sm text-muted-foreground">Flat ₹99 shipping on smaller baskets.</p>
            </div>
            <div className="rounded-2xl border border-border/80 bg-white/80 p-4 shadow-sm backdrop-blur">
              <ShieldCheck className="mb-2 h-5 w-5 text-primary" />
              <p className="font-medium">Secure authenticated checkout</p>
              <p className="text-sm text-muted-foreground">Orders and stock come from your database.</p>
            </div>
          </div>
        </div>

        <div className="relative">
          <div className="relative aspect-[5/4] overflow-hidden rounded-3xl border border-border bg-white shadow-xl shadow-indigo-100/50">
            <Image
              src="https://images.unsplash.com/photo-1556742049-0cfed4f6a45d?w=1400&q=80"
              alt="ShopAI storefront preview"
              fill
              className="object-cover"
              priority
              sizes="(max-width: 1024px) 100vw, 50vw"
            />
          </div>
          <div className="absolute -bottom-4 -left-2 hidden rounded-2xl border border-border bg-white p-4 shadow-lg sm:block">
            <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Categories</p>
            <p className="text-lg font-bold">4 · 32 products</p>
          </div>
        </div>
      </div>
    </section>
  );
}

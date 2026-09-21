"use client";

import Link from "next/link";
import { Heart, Menu, Search, ShoppingCart, Sparkles, User } from "lucide-react";
import { useState } from "react";
import { NavIconLink } from "@/components/layout/nav-icon-link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useShopCounts } from "@/hooks/use-shop-counts";
import { useAuth } from "@/providers/auth-provider";

export function SiteHeader() {
  const { user, logout, loading } = useAuth();
  const { cartCount, wishlistCount } = useShopCounts(Boolean(user));
  const [mobileOpen, setMobileOpen] = useState(false);
  const [search, setSearch] = useState("");

  return (
    <header className="sticky top-0 z-50 border-b border-border/80 bg-background/95 backdrop-blur">
      <div className="mx-auto flex w-full max-w-7xl items-center gap-4 px-4 py-4 sm:px-6 lg:px-8">
        <Link href="/" className="shrink-0 text-xl font-bold tracking-tight text-primary">
          ShopAI
        </Link>

        <form
          className="hidden flex-1 md:block"
          onSubmit={(event) => {
            event.preventDefault();
            const query = search.trim();
            window.location.href = query
              ? `/products?search=${encodeURIComponent(query)}`
              : "/products";
          }}
        >
          <div className="relative mx-auto max-w-xl">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Search products, brands, categories..."
              className="pl-10"
            />
          </div>
        </form>

        <Button variant="ghost" size="sm" asChild className="hidden lg:inline-flex">
          <Link href="/ai-search" className="gap-1.5">
            <Sparkles className="h-4 w-4 text-primary" />
            AI Search
          </Link>
        </Button>

        <div className="ml-auto flex items-center gap-1 sm:gap-2">
          {!loading && user ? (
            <>
              <NavIconLink href="/wishlist" label="Wishlist" count={wishlistCount}>
                <Heart className="h-5 w-5" />
              </NavIconLink>
              <NavIconLink href="/cart" label="Cart" count={cartCount}>
                <ShoppingCart className="h-5 w-5" />
              </NavIconLink>
              <Button variant="ghost" size="sm" asChild className="hidden sm:inline-flex">
                <Link href="/orders">Orders</Link>
              </Button>
              {user.role === "ADMIN" ? (
                <Button variant="outline" size="sm" asChild className="hidden md:inline-flex">
                  <Link href="/admin">Admin</Link>
                </Button>
              ) : null}
              <Button variant="outline" size="sm" onClick={() => void logout()} className="hidden sm:inline-flex">
                Logout
              </Button>
            </>
          ) : !loading ? (
            <>
              <Button variant="ghost" size="sm" asChild>
                <Link href="/login">Login</Link>
              </Button>
              <Button size="sm" asChild>
                <Link href="/register">Register</Link>
              </Button>
            </>
          ) : null}

          <Button
            variant="ghost"
            size="icon"
            className="md:hidden"
            onClick={() => setMobileOpen((open) => !open)}
            aria-label="Toggle menu"
          >
            <Menu className="h-5 w-5" />
          </Button>
        </div>
      </div>

      {mobileOpen ? (
        <div className="border-t border-border px-4 py-4 md:hidden">
          <nav className="flex flex-col gap-3">
            <Link href="/products" className="text-sm font-medium">
              Shop
            </Link>
            <Link href="/ai-search" className="text-sm font-medium">
              AI Search
            </Link>
            <Link href="/wishlist" className="text-sm font-medium">
              Wishlist {wishlistCount > 0 ? `(${wishlistCount})` : ""}
            </Link>
            <Link href="/cart" className="text-sm font-medium">
              Cart {cartCount > 0 ? `(${cartCount})` : ""}
            </Link>
            <Link href="/orders" className="text-sm font-medium">
              Orders
            </Link>
            {user ? (
              <button className="flex items-center gap-2 text-left text-sm font-medium" onClick={() => void logout()}>
                <User className="h-4 w-4" />
                Logout
              </button>
            ) : (
              <Link href="/login" className="text-sm font-medium">
                Login
              </Link>
            )}
          </nav>
        </div>
      ) : null}
    </header>
  );
}

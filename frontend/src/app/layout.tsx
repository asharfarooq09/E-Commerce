import type { Metadata } from "next";
import { Geist } from "next/font/google";
import { AppToaster } from "@/components/ui/app-toaster";
import { CategoryNav } from "@/components/layout/category-nav";
import { SiteFooter } from "@/components/layout/site-footer";
import { SiteHeader } from "@/components/layout/site-header";
import { AuthProvider } from "@/providers/auth-provider";
import { QueryProvider } from "@/providers/query-provider";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: {
    default: "ShopAI | Modern E-commerce",
    template: "%s | ShopAI",
  },
  description: "ShopAI e-commerce foundation with product discovery, cart, checkout, and admin tools.",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en" className={`${geistSans.variable} h-full`}>
      <body className="min-h-full antialiased">
        <QueryProvider>
          <AuthProvider>
            <SiteHeader />
            <CategoryNav />
            <main className="flex-1">{children}</main>
            <SiteFooter />
            <AppToaster />
          </AuthProvider>
        </QueryProvider>
      </body>
    </html>
  );
}

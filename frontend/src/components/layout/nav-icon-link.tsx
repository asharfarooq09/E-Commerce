import Link from "next/link";
import { cn } from "@/lib/utils";

type NavIconLinkProps = {
  href: string;
  label: string;
  count?: number;
  children: React.ReactNode;
};

export function NavIconLink({ href, label, count = 0, children }: NavIconLinkProps) {
  const showBadge = count > 0;

  return (
    <Link
      href={href}
      aria-label={showBadge ? `${label}, ${count} items` : label}
      className={cn(
        "relative inline-flex h-10 w-10 items-center justify-center rounded-lg",
        "text-foreground transition-colors hover:bg-muted",
      )}
    >
      {children}
      {showBadge ? (
        <span className="absolute -right-0.5 -top-0.5 flex h-5 min-w-5 items-center justify-center rounded-full bg-primary px-1 text-[10px] font-bold leading-none text-primary-foreground ring-2 ring-background">
          {count > 99 ? "99+" : count}
        </span>
      ) : null}
    </Link>
  );
}

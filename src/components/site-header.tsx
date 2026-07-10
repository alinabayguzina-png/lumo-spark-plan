import { Link } from "@tanstack/react-router";
import { useSession } from "@/lib/auth-hooks";
import { Button } from "@/components/ui/button";

export function SiteHeader() {
  const { user, loading } = useSession();
  return (
    <header className="sticky top-0 z-40 border-b border-border/60 bg-background/70 backdrop-blur-xl">
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4 sm:px-6">
        <Link to="/" className="flex items-center gap-2">
          <span className="grid h-8 w-8 place-items-center rounded-md bg-primary text-primary-foreground font-display text-lg font-bold">
            L
          </span>
          <span className="font-display text-xl font-semibold tracking-tight">Lumo AI</span>
        </Link>
        <nav className="hidden items-center gap-8 text-sm text-muted-foreground md:flex">
          <a href="/#how" className="hover:text-foreground">How it works</a>
          <Link to="/pricing" className="hover:text-foreground">Pricing</Link>
          <a href="/#faq" className="hover:text-foreground">FAQ</a>
        </nav>
        <div className="flex items-center gap-2">
          {!loading && user ? (
            <Button asChild size="sm">
              <Link to="/dashboard">Open app</Link>
            </Button>
          ) : (
            <>
              <Button asChild variant="ghost" size="sm" className="hidden sm:inline-flex">
                <Link to="/auth">Sign in</Link>
              </Button>
              <Button asChild size="sm">
                <Link to="/auth">Start free</Link>
              </Button>
            </>
          )}
        </div>
      </div>
    </header>
  );
}
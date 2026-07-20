import { Link, useRouter, useRouterState } from "@tanstack/react-router";
import { supabase } from "@/integrations/supabase/client";
import { useSession } from "@/lib/auth-hooks";
import { Button } from "@/components/ui/button";
import { LayoutDashboard, Building2, Wand2, History, LogOut, Menu, Crown, Heart } from "lucide-react";
import { useQueryClient } from "@tanstack/react-query";
import { useState, type ReactNode } from "react";
import { UsageBadge } from "@/components/usage-badge";

const NAV = [
  { to: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { to: "/business", label: "Business info", icon: Building2 },
  { to: "/generate", label: "Generate", icon: Wand2 },
  { to: "/favorites", label: "Favorites", icon: Heart },
  { to: "/history", label: "History", icon: History },
] as const;

export function AppShell({ children }: { children: ReactNode }) {
  const { user } = useSession();
  const router = useRouter();
  const qc = useQueryClient();
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const [open, setOpen] = useState(false);

  async function signOut() {
    await qc.cancelQueries();
    qc.clear();
    await supabase.auth.signOut();
    router.navigate({ to: "/auth", replace: true });
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Sidebar */}
      <aside
        className={
          "fixed inset-y-0 left-0 z-30 w-64 border-r border-border bg-sidebar text-sidebar-foreground transition-transform md:translate-x-0 " +
          (open ? "translate-x-0" : "-translate-x-full")
        }
      >
        <div className="flex h-16 items-center gap-2 border-b border-sidebar-border px-6">
          <span className="grid h-8 w-8 place-items-center rounded-md bg-primary text-primary-foreground font-display font-bold">
            L
          </span>
          <span className="font-display text-lg font-semibold">Luzo AI</span>
        </div>
        <nav className="flex flex-col gap-1 p-3">
          {NAV.map((item) => {
            const active = pathname === item.to || pathname.startsWith(item.to + "/");
            const Icon = item.icon;
            return (
              <Link
                key={item.to}
                to={item.to}
                onClick={() => setOpen(false)}
                className={
                  "flex items-center gap-3 rounded-md px-3 py-2 text-sm transition-colors " +
                  (active
                    ? "bg-primary text-primary-foreground"
                    : "text-sidebar-foreground/80 hover:bg-sidebar-accent hover:text-sidebar-foreground")
                }
              >
                <Icon className="h-4 w-4" />
                {item.label}
              </Link>
            );
          })}
          <Link
            to="/pricing"
            onClick={() => setOpen(false)}
            className="mt-2 flex items-center gap-3 rounded-md border border-primary/40 bg-primary/10 px-3 py-2 text-sm text-primary hover:bg-primary/15"
          >
            <Crown className="h-4 w-4" />
            Switch Plan
          </Link>
        </nav>
        <div className="absolute inset-x-0 bottom-0 border-t border-sidebar-border p-3">
          <div className="mb-2 truncate rounded-md px-3 py-1 text-xs text-muted-foreground">
            {user?.email}
          </div>
          <a
            href="mailto:luzoaisupport@gmail.com"
            className="mb-2 block truncate rounded-md px-3 py-1 text-xs text-muted-foreground hover:text-foreground"
            title="Contact support"
          >
            Support: luzoaisupport@gmail.com
          </a>
          <Button onClick={signOut} variant="ghost" size="sm" className="w-full justify-start gap-2">
            <LogOut className="h-4 w-4" /> Sign out
          </Button>
        </div>
      </aside>

      {/* Content */}
      <div className="md:pl-64">
        <header className="sticky top-0 z-20 flex h-16 items-center justify-between border-b border-border bg-background/80 px-4 backdrop-blur-xl md:px-8">
          <button
            onClick={() => setOpen(!open)}
            className="grid h-9 w-9 place-items-center rounded-md border border-border md:hidden"
            aria-label="Menu"
          >
            <Menu className="h-4 w-4" />
          </button>
          <div className="ml-3 flex-1 md:ml-0">
            <UsageBadge />
          </div>
          <Button asChild size="sm">
            <Link to="/generate">New plan</Link>
          </Button>
        </header>
        <main className="mx-auto max-w-6xl px-4 py-8 md:px-8">{children}</main>
      </div>
    </div>
  );
}
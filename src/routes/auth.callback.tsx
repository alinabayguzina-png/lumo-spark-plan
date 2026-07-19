import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/auth/callback")({
  head: () => ({ meta: [{ title: "Signing in — Luzo AI" }] }),
  component: AuthCallbackPage,
});

function AuthCallbackPage() {
  const navigate = useNavigate();

  useEffect(() => {
    supabase.auth
      .exchangeCodeForSession(window.location.href)
      .then(({ error }) => {
        if (error) {
          navigate({ to: "/auth", search: { error: "google" } });
          return;
        }
        navigate({ to: "/dashboard" });
      });
  }, [navigate]);

  return (
    <div className="flex min-h-screen items-center justify-center bg-background">
      <p className="text-sm text-muted-foreground">Finishing sign-in…</p>
    </div>
  );
}

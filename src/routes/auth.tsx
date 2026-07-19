import { createFileRoute, useNavigate, useRouter } from "@tanstack/react-router";
import { Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { z } from "zod";
import { Sparkles } from "lucide-react";

export const Route = createFileRoute("/auth")({
  validateSearch: z.object({ error: z.string().optional() }),
  head: () => ({
    meta: [
      { title: "Sign in — Luzo AI" },
      { name: "description", content: "Sign in or create your Luzo AI account." },
    ],
  }),
  component: AuthPage,
});

const emailSchema = z.string().trim().email().max(255);
const passwordSchema = z.string().min(6).max(72);

function AuthPage() {
  const [mode, setMode] = useState<"signin" | "signup">("signin");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [busy, setBusy] = useState(false);
  const [forgotOpen, setForgotOpen] = useState(false);
  const navigate = useNavigate();
  const router = useRouter();
  const search = Route.useSearch();

  useEffect(() => {
    if (search.error) toast.error("Google sign-in failed. Please try again.");
    supabase.auth.getSession().then(({ data }) => {
      if (data.session) navigate({ to: "/dashboard" });
    });
  }, [navigate, search.error]);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    const emailRes = emailSchema.safeParse(email);
    const pwRes = passwordSchema.safeParse(password);
    if (!emailRes.success) return toast.error("Enter a valid email.");
    if (!pwRes.success) return toast.error("Password must be at least 6 characters.");
    setBusy(true);
    try {
      if (mode === "signup") {
        const { error } = await supabase.auth.signUp({
          email: emailRes.data,
          password: pwRes.data,
          options: {
            emailRedirectTo: `${window.location.origin}/dashboard`,
            data: { display_name: name.trim() || undefined },
          },
        });
        if (error) throw error;
        toast.success("Check your email to confirm your account.");
        setBusy(false);
        return;
      } else {
        const { error } = await supabase.auth.signInWithPassword({
          email: emailRes.data,
          password: pwRes.data,
        });
        if (error) throw error;
      }
      await router.invalidate();
      navigate({ to: "/dashboard" });
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Something went wrong.");
    } finally {
      setBusy(false);
    }
  }

  async function google() {
    setBusy(true);
    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: "google",
        options: {
          redirectTo: `${window.location.origin}/auth/callback`,
        },
      });
      if (error) throw error;
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Google sign-in failed.");
    } finally {
      setBusy(false);
    }
  }

  async function sendReset() {
    const emailRes = emailSchema.safeParse(email);
    if (!emailRes.success) return toast.error("Enter your account email above first.");
    setBusy(true);
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(emailRes.data, {
        redirectTo: `${window.location.origin}/reset-password`,
      });
      if (error) throw error;
      toast.success("Password reset email sent. Check your inbox.");
      setForgotOpen(false);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Could not send reset email.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="relative min-h-screen bg-background">
      <div className="absolute inset-0 bg-grid opacity-30" aria-hidden />
      <div className="relative mx-auto flex min-h-screen max-w-md flex-col justify-center px-4 py-16">
        <Link to="/" className="mb-10 flex items-center gap-2 self-start text-sm text-muted-foreground hover:text-foreground">
          <Sparkles className="h-4 w-4 text-primary" /> Luzo AI
        </Link>
        <div className="rounded-2xl border border-border bg-card p-8 shadow-2xl shadow-black/40">
          <h1 className="text-display text-3xl font-semibold">
            {mode === "signin" ? "Welcome back." : "Create your account."}
          </h1>
          <p className="mt-2 text-sm text-muted-foreground">
            {mode === "signin"
              ? "Sign in to generate your next month of content."
              : "Start free. Your first plan is 60 seconds away."}
          </p>

          <Button onClick={google} disabled={busy} variant="secondary" className="mt-6 w-full">
            Continue with Google
          </Button>
          <div className="my-6 flex items-center gap-3 text-xs uppercase tracking-widest text-muted-foreground">
            <span className="h-px flex-1 bg-border" /> or email <span className="h-px flex-1 bg-border" />
          </div>

          <form onSubmit={submit} className="space-y-4">
            {mode === "signup" && (
              <div className="space-y-1.5">
                <Label htmlFor="name">Your name</Label>
                <Input id="name" value={name} onChange={(e) => setName(e.target.value)} maxLength={80} />
              </div>
            )}
            <div className="space-y-1.5">
              <Label htmlFor="email">Email</Label>
              <Input id="email" type="email" required value={email} onChange={(e) => setEmail(e.target.value)} />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="password">Password</Label>
              <Input id="password" type="password" required value={password} onChange={(e) => setPassword(e.target.value)} />
            </div>
            <Button type="submit" disabled={busy} className="w-full">
              {busy ? "Please wait…" : mode === "signin" ? "Sign in" : "Create account"}
            </Button>
          </form>

          {mode === "signin" && (
            <button
              type="button"
              onClick={forgotOpen ? sendReset : () => setForgotOpen(true)}
              className="mt-4 w-full text-center text-xs text-primary hover:underline"
              disabled={busy}
            >
              {forgotOpen ? "Send reset link to email above" : "Forgot password?"}
            </button>
          )}

          <button
            type="button"
            onClick={() => setMode(mode === "signin" ? "signup" : "signin")}
            className="mt-6 w-full text-center text-sm text-muted-foreground hover:text-foreground"
          >
            {mode === "signin" ? "No account? Create one" : "Have an account? Sign in"}
          </button>
        </div>
      </div>
    </div>
  );
}
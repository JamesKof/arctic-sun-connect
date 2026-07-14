import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { lovable } from "@/integrations/lovable";
import { PageShell } from "@/components/site/PageShell";
import { toast } from "sonner";

export const Route = createFileRoute("/auth")({
  head: () => ({ meta: [{ title: "Sign in — Afro Polar Institute" }, { name: "description", content: "Sign in or create an account for the Afro Polar Institute." }] }),
  component: AuthPage,
});

function AuthPage() {
  const navigate = useNavigate();
  const [mode, setMode] = useState<"signin" | "signup" | "forgot">("signin");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => { if (data.user) navigate({ to: "/" }); });
  }, [navigate]);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    try {
      if (mode === "signin") {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
        toast.success("Welcome back.");
        navigate({ to: "/" });
      } else if (mode === "signup") {
        const { error } = await supabase.auth.signUp({
          email, password,
          options: { data: { display_name: name }, emailRedirectTo: window.location.origin },
        });
        if (error) throw error;
        toast.success("Check your email to confirm.");
      } else {
        const { error } = await supabase.auth.resetPasswordForEmail(email, { redirectTo: `${window.location.origin}/reset-password` });
        if (error) throw error;
        toast.success("Password reset email sent.");
      }
    } catch (err: any) {
      toast.error(err.message ?? "Something went wrong");
    } finally { setBusy(false); }
  }

  async function google() {
    setBusy(true);
    const res = await lovable.auth.signInWithOAuth("google", { redirect_uri: window.location.origin });
    if (res.error) { toast.error(String(res.error)); setBusy(false); return; }
    if (!res.redirected) navigate({ to: "/" });
  }

  return (
    <PageShell>
      <section className="mx-auto max-w-md px-6 py-32">
        <h1 className="font-display text-4xl font-bold text-arctic-deep">
          {mode === "signup" ? "Create account" : mode === "forgot" ? "Reset password" : "Sign in"}
        </h1>
        <p className="mt-2 text-sm text-arctic-deep/60">Afro Polar Institute member area.</p>

        <button onClick={google} disabled={busy} className="mt-8 w-full rounded-full border border-arctic-deep/15 bg-white px-5 py-3 text-sm font-semibold text-arctic-deep transition hover:border-aurora hover:text-aurora">
          Continue with Google
        </button>
        <div className="my-6 flex items-center gap-3 text-[10px] uppercase tracking-[0.28em] text-arctic-deep/40">
          <span className="h-px flex-1 bg-arctic-deep/10" />or<span className="h-px flex-1 bg-arctic-deep/10" />
        </div>

        <form onSubmit={onSubmit} className="space-y-4">
          {mode === "signup" && (
            <input value={name} onChange={(e) => setName(e.target.value)} placeholder="Display name" className="w-full rounded-lg border border-arctic-deep/15 px-4 py-3 text-sm" />
          )}
          <input type="email" required value={email} onChange={(e) => setEmail(e.target.value)} placeholder="Email" className="w-full rounded-lg border border-arctic-deep/15 px-4 py-3 text-sm" />
          {mode !== "forgot" && (
            <input type="password" required minLength={8} value={password} onChange={(e) => setPassword(e.target.value)} placeholder="Password" className="w-full rounded-lg border border-arctic-deep/15 px-4 py-3 text-sm" />
          )}
          <button type="submit" disabled={busy} className="w-full rounded-full bg-arctic-deep px-5 py-3 text-sm font-semibold text-white transition hover:bg-aurora hover:text-arctic-deep">
            {busy ? "Please wait…" : mode === "signup" ? "Create account" : mode === "forgot" ? "Send reset link" : "Sign in"}
          </button>
        </form>

        <div className="mt-6 flex flex-wrap justify-between gap-3 text-xs text-arctic-deep/60">
          {mode !== "signin" ? (
            <button onClick={() => setMode("signin")} className="hover:text-aurora">Have an account? Sign in</button>
          ) : (
            <button onClick={() => setMode("signup")} className="hover:text-aurora">New here? Create account</button>
          )}
          {mode !== "forgot" && (
            <button onClick={() => setMode("forgot")} className="hover:text-aurora">Forgot password?</button>
          )}
        </div>
        <p className="mt-8 text-xs text-arctic-deep/40">
          <Link to="/" className="hover:text-aurora">← Back home</Link>
        </p>
      </section>
    </PageShell>
  );
}

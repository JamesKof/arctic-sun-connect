import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { PageShell } from "@/components/site/PageShell";
import { toast } from "sonner";

export const Route = createFileRoute("/reset-password")({
  head: () => ({ meta: [{ title: "Reset password — Afro Polar Institute" }] }),
  component: ResetPassword,
});

function ResetPassword() {
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const navigate = useNavigate();

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    const { error } = await supabase.auth.updateUser({ password });
    setBusy(false);
    if (error) { toast.error(error.message); return; }
    toast.success("Password updated.");
    navigate({ to: "/" });
  }

  return (
    <PageShell>
      <section className="mx-auto max-w-md px-6 py-32">
        <h1 className="font-display text-4xl font-bold text-arctic-deep">Set a new password</h1>
        <form onSubmit={onSubmit} className="mt-8 space-y-4">
          <input type="password" required minLength={8} value={password} onChange={(e) => setPassword(e.target.value)} placeholder="New password" className="w-full rounded-lg border border-arctic-deep/15 px-4 py-3 text-sm" />
          <button disabled={busy} className="w-full rounded-full bg-arctic-deep px-5 py-3 text-sm font-semibold text-white hover:bg-aurora hover:text-arctic-deep">Update password</button>
        </form>
      </section>
    </PageShell>
  );
}

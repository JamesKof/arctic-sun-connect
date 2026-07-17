import { useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { subscribeNewsletter } from "@/lib/newsletter.functions";
import { toast } from "sonner";

export function NewsletterForm({ variant = "footer" }: { variant?: "footer" | "inline" }) {
  const subscribe = useServerFn(subscribeNewsletter);
  const [email, setEmail] = useState("");
  const [name, setName] = useState("");
  const [busy, setBusy] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    try {
      await subscribe({ data: { email, name: name || undefined, origin: typeof window !== "undefined" ? window.location.origin : undefined } });
      toast.success("Almost there — check your inbox to confirm.");
      setEmail(""); setName("");
    } catch (err: any) {
      toast.error(err.message ?? "Could not subscribe");
    } finally { setBusy(false); }
  }

  if (variant === "inline") {
    return (
      <form onSubmit={onSubmit} className="rounded-3xl border border-arctic-deep/10 bg-arctic-ice/30 p-8">
        <p className="text-[10px] font-bold uppercase tracking-[0.28em] text-aurora">The Latitude Brief</p>
        <h3 className="font-display mt-2 text-2xl font-bold text-arctic-deep">Monthly, from the tropics to the poles.</h3>
        <div className="mt-6 flex flex-col gap-3 sm:flex-row">
          <input type="email" required value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@institute.org" className="flex-1 rounded-full border border-arctic-deep/15 bg-white px-5 py-3 text-sm" />
          <button disabled={busy} className="rounded-full bg-arctic-deep px-6 py-3 text-xs font-bold uppercase tracking-widest text-white hover:bg-aurora hover:text-arctic-deep">Subscribe</button>
        </div>
      </form>
    );
  }

  return (
    <form onSubmit={onSubmit} className="space-y-2">
      <div className="flex gap-2">
        <input type="email" required value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@institute.org" className="w-full rounded-full border border-white/15 bg-white/5 px-4 py-2 text-sm placeholder:text-white/30 focus:border-aurora focus:outline-none" />
        <button disabled={busy} className="rounded-full bg-aurora px-4 py-2 text-xs font-bold uppercase tracking-widest text-arctic-deep hover:bg-white">Join</button>
      </div>
      <p className="text-[10px] uppercase tracking-[0.24em] text-white/30">Connecting Latitudes Monthly · double opt-in</p>
    </form>
  );
}

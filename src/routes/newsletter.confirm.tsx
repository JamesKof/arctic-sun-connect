import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { PageShell, PageHero } from "@/components/site/PageShell";
import { confirmNewsletter } from "@/lib/newsletter.functions";
import { z } from "zod";

export const Route = createFileRoute("/newsletter/confirm")({
  validateSearch: (s) => z.object({ token: z.string().default("") }).parse(s),
  head: () => ({ meta: [{ title: "Confirm subscription — Afro Polar Institute" }] }),
  component: Confirm,
});

function Confirm() {
  const { token } = Route.useSearch();
  const confirm = useServerFn(confirmNewsletter);
  const [state, setState] = useState<"loading" | "ok" | "invalid">("loading");

  useEffect(() => {
    if (!token) { setState("invalid"); return; }
    confirm({ data: { token } }).then((r) => setState(r.ok ? "ok" : "invalid")).catch(() => setState("invalid"));
  }, [confirm, token]);

  return (
    <PageShell>
      <PageHero eyebrow="Newsletter" title={state === "ok" ? "You're in." : state === "invalid" ? "Link expired." : "Confirming…"}
        intro={state === "ok" ? "Thanks for confirming. The next Latitude Brief will land in your inbox." : state === "invalid" ? "That confirmation link is no longer valid. Try subscribing again." : "One moment."} />
    </PageShell>
  );
}

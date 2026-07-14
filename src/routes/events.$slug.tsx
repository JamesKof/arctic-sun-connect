import { createFileRoute, notFound } from "@tanstack/react-router";
import { useMutation } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { useState } from "react";
import { PageShell } from "@/components/site/PageShell";
import { getPublicEvent } from "@/lib/cms.functions";
import { registerForEvent } from "@/lib/event-registration.functions";
import { toast } from "sonner";

export const Route = createFileRoute("/events/$slug")({
  loader: async ({ params, context }) => {
    const data = await context.queryClient.ensureQueryData({
      queryKey: ["event", params.slug],
      queryFn: () => getPublicEvent({ data: { slug: params.slug } }),
    });
    if (!data.event) throw notFound();
    return data;
  },
  head: ({ loaderData }) => {
    const e = loaderData?.event as any;
    return { meta: [
      { title: e ? `${e.title} — Afro Polar Institute` : "Event" },
      { name: "description", content: e?.description ?? "" },
      { property: "og:title", content: e?.title ?? "" },
      ...(e?.cover_url ? [{ property: "og:image", content: e.cover_url }] : []),
    ]};
  },
  errorComponent: ({ error }) => <PageShell><div className="p-16 text-center">{error.message}</div></PageShell>,
  notFoundComponent: () => <PageShell><div className="p-16 text-center">Event not found.</div></PageShell>,
  component: EventPage,
});

function EventPage() {
  const { event, speakers, sponsors } = Route.useLoaderData() as any;
  return (
    <PageShell>
      <article className="mx-auto max-w-4xl px-6 py-24">
        {event.tag && <p className="text-[10px] font-bold uppercase tracking-[0.28em] text-aurora">{event.tag}</p>}
        <h1 className="font-display mt-3 text-5xl font-bold text-arctic-deep">{event.title}</h1>
        <p className="mt-4 text-arctic-deep/70">
          {new Date(event.starts_at).toLocaleString("en", { dateStyle: "full", timeStyle: "short" })}
          {event.venue && <> · {event.venue.name}, {event.venue.city}</>}
        </p>
        {event.cover_url && <img src={event.cover_url} alt="" className="mt-8 w-full rounded-3xl object-cover" />}
        <p className="mt-8 whitespace-pre-wrap text-lg text-arctic-deep/80">{event.description}</p>

        {speakers.length > 0 && (
          <section className="mt-12">
            <h2 className="font-display text-2xl font-bold text-arctic-deep">Speakers</h2>
            <ul className="mt-6 grid gap-4 sm:grid-cols-2">
              {speakers.map((s: any, i: number) => (
                <li key={i} className="rounded-2xl border border-arctic-deep/10 p-5">
                  <p className="font-semibold text-arctic-deep">{s.speaker?.name}</p>
                  {s.speaker?.title && <p className="text-sm text-arctic-deep/60">{s.speaker.title}</p>}
                  {s.speaker?.bio && <p className="mt-2 text-sm text-arctic-deep/70">{s.speaker.bio}</p>}
                </li>
              ))}
            </ul>
          </section>
        )}

        {sponsors.length > 0 && (
          <section className="mt-12">
            <h2 className="font-display text-2xl font-bold text-arctic-deep">Sponsors</h2>
            <div className="mt-6 flex flex-wrap gap-4">
              {sponsors.map((s: any, i: number) => (
                <span key={i} className="rounded-full border border-arctic-deep/10 px-4 py-2 text-sm">{s.sponsor?.name}</span>
              ))}
            </div>
          </section>
        )}

        <section className="mt-16 rounded-3xl bg-arctic-ice/40 p-8">
          <h2 className="font-display text-2xl font-bold text-arctic-deep">Register</h2>
          <RegisterForm eventId={event.id} />
        </section>
      </article>
    </PageShell>
  );
}

function RegisterForm({ eventId }: { eventId: string }) {
  const [f, setF] = useState({ name: "", email: "", organization: "", notes: "" });
  const [done, setDone] = useState(false);
  const fn = useServerFn(registerForEvent);
  const m = useMutation({
    mutationFn: () => fn({ data: { event_id: eventId, ...f, organization: f.organization || undefined, notes: f.notes || undefined } }),
    onSuccess: () => { setDone(true); toast.success("You're registered."); },
    onError: (e: any) => toast.error(e.message ?? "Could not register"),
  });
  if (done) return <p className="mt-4 text-arctic-deep/70">Thank you. Confirmation will be sent to {f.email}.</p>;
  return (
    <form onSubmit={(e) => { e.preventDefault(); m.mutate(); }} className="mt-6 grid gap-3 sm:grid-cols-2">
      <input required placeholder="Your name" value={f.name} onChange={(e) => setF({ ...f, name: e.target.value })} className="rounded-lg border border-arctic-deep/15 bg-white px-3 py-2 text-sm" />
      <input required type="email" placeholder="Email" value={f.email} onChange={(e) => setF({ ...f, email: e.target.value })} className="rounded-lg border border-arctic-deep/15 bg-white px-3 py-2 text-sm" />
      <input placeholder="Organization (optional)" value={f.organization} onChange={(e) => setF({ ...f, organization: e.target.value })} className="rounded-lg border border-arctic-deep/15 bg-white px-3 py-2 text-sm sm:col-span-2" />
      <textarea rows={3} placeholder="Notes (optional)" value={f.notes} onChange={(e) => setF({ ...f, notes: e.target.value })} className="rounded-lg border border-arctic-deep/15 bg-white px-3 py-2 text-sm sm:col-span-2" />
      <button disabled={m.isPending} className="rounded-full bg-arctic-deep px-6 py-3 text-xs font-bold uppercase tracking-widest text-white hover:bg-aurora hover:text-arctic-deep sm:col-span-2">
        {m.isPending ? "Registering…" : "Confirm registration"}
      </button>
    </form>
  );
}

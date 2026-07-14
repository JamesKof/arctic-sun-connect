import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { PageShell, PageHero } from "@/components/site/PageShell";
import { listPublicEvents } from "@/lib/cms.functions";

export const Route = createFileRoute("/events")({
  head: () => ({
    meta: [
      { title: "Events — Afro Polar Institute" },
      { name: "description", content: "Upcoming symposia, forums and field workshops from the Afro Polar Institute." },
    ],
  }),
  component: Events,
});

function Events() {
  const fn = useServerFn(listPublicEvents);
  const { data, isLoading } = useQuery({ queryKey: ["events-public"], queryFn: () => fn() });

  return (
    <PageShell>
      <PageHero eyebrow="Convenings" title="Events across the latitudes."
        intro="Symposia, forums and field workshops connecting research and policy communities." />
      <section className="px-6 py-24 lg:px-10">
        <div className="mx-auto max-w-5xl">
          {isLoading && <p>Loading…</p>}
          <ul className="divide-y divide-arctic-deep/10 border-y border-arctic-deep/10">
            {data?.map((e: any) => (
              <li key={e.id} className="group grid grid-cols-1 gap-4 py-8 md:grid-cols-[160px_1fr_auto] md:items-center">
                <div className="font-mono text-sm text-arctic-deep/60">{new Date(e.starts_at).toLocaleDateString("en", { day: "2-digit", month: "short", year: "numeric" })}</div>
                <div>
                  {e.tag && <div className="text-[10px] font-bold uppercase tracking-[0.28em] text-aurora">{e.tag}</div>}
                  <h3 className="font-display mt-1 text-2xl font-bold text-arctic-deep group-hover:text-aurora">
                    <Link to="/events/$slug" params={{ slug: e.slug }}>{e.title}</Link>
                  </h3>
                  <p className="text-sm text-arctic-deep/60">{e.venue?.city}{e.venue?.country ? `, ${e.venue.country}` : ""}</p>
                </div>
                <Link to="/events/$slug" params={{ slug: e.slug }} className="justify-self-start rounded-full border border-arctic-deep/15 px-5 py-2 text-[11px] font-bold uppercase tracking-[0.2em] text-arctic-deep hover:border-aurora hover:text-aurora md:justify-self-end">Register</Link>
              </li>
            ))}
          </ul>
        </div>
      </section>
    </PageShell>
  );
}

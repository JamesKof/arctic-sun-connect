import { createFileRoute } from "@tanstack/react-router";
import { PageShell, PageHero } from "@/components/site/PageShell";

const events = [
  { date: "12 Mar 2026", city: "Tromsø, Norway", title: "Arctic Frontiers Africa Dialogue", tag: "Symposium" },
  { date: "24 Apr 2026", city: "Accra, Ghana", title: "Tropics-to-Poles Fellowship Convening", tag: "Convening" },
  { date: "05 Jun 2026", city: "Cape Town, South Africa", title: "Ocean Governance & Polar Commons Forum", tag: "Forum" },
  { date: "18 Sep 2026", city: "Longyearbyen, Svalbard", title: "Permafrost & the Sahel Field Workshop", tag: "Field" },
  { date: "02 Nov 2026", city: "Nairobi, Kenya", title: "Indigenous Knowledge Assembly", tag: "Assembly" },
];

export const Route = createFileRoute("/events")({
  head: () => ({
    meta: [
      { title: "Events — Afro Polar Institute" },
      { name: "description", content: "Upcoming symposia, forums and field workshops from the Afro Polar Institute." },
      { property: "og:title", content: "Events — Afro Polar Institute" },
      { property: "og:description", content: "Convenings across Africa and the Polar regions." },
    ],
  }),
  component: Events,
});

function Events() {
  return (
    <PageShell>
      <PageHero
        eyebrow="Convenings"
        title="Events across the latitudes."
        intro="Symposia, forums and field workshops connecting research and policy communities."
      />
      <section className="px-6 py-24 lg:px-10">
        <ul className="mx-auto max-w-5xl divide-y divide-arctic-deep/10 border-y border-arctic-deep/10">
          {events.map((e) => (
            <li key={e.title} className="group grid grid-cols-1 gap-4 py-8 md:grid-cols-[160px_1fr_auto] md:items-center">
              <div className="font-mono text-sm text-arctic-deep/60">{e.date}</div>
              <div>
                <div className="text-[10px] font-bold uppercase tracking-[0.28em] text-aurora">{e.tag}</div>
                <h3 className="font-display mt-1 text-2xl font-bold text-arctic-deep transition-colors group-hover:text-aurora">
                  {e.title}
                </h3>
                <p className="text-sm text-arctic-deep/60">{e.city}</p>
              </div>
              <button
                type="button"
                className="justify-self-start rounded-full border border-arctic-deep/15 px-5 py-2 text-[11px] font-bold uppercase tracking-[0.2em] text-arctic-deep transition-colors hover:border-aurora hover:text-aurora md:justify-self-end"
              >
                Register
              </button>
            </li>
          ))}
        </ul>
      </section>
    </PageShell>
  );
}

import { createFileRoute } from "@tanstack/react-router";
import { PageShell, PageHero } from "@/components/site/PageShell";

const pillars = [
  { title: "Arctic Science & Oceanography", body: "Studying the thermal bridge between the Benguela current and Polar meltwater." },
  { title: "Indigenous Knowledge", body: "Bridging oral histories of climate adaptation from the Sahel to the Sámi regions." },
  { title: "Polar Diplomacy", body: "African representation in the governance of the high seas and polar commons." },
  { title: "Climate Justice", body: "Shared vulnerabilities of global south and polar frontline communities." },
  { title: "Resource Governance", body: "Deep-sea mining, mineral supply chains and equitable extraction frameworks." },
  { title: "Education & Fellowship", body: "Cross-continental research training and early-career support." },
];

export const Route = createFileRoute("/research")({
  head: () => ({
    meta: [
      { title: "Research — Afro Polar Institute" },
      { name: "description", content: "Research pillars spanning Arctic science, Indigenous knowledge, polar diplomacy, climate justice and ocean governance." },
      { property: "og:title", content: "Research — Afro Polar Institute" },
      { property: "og:description", content: "The Afro Polar Institute's research pillars." },
    ],
  }),
  component: Research,
});

function Research() {
  return (
    <PageShell>
      <PageHero
        eyebrow="Our Work"
        title="Research pillars."
        intro="Six interconnected programs advancing scientific, policy and cultural collaboration across latitudes."
      />
      <section className="px-6 py-24 lg:px-10">
        <div className="mx-auto grid max-w-7xl gap-6 md:grid-cols-2 lg:grid-cols-3">
          {pillars.map((p, i) => (
            <article
              key={p.title}
              className="rounded-3xl border border-arctic-deep/10 bg-white p-8 transition-all hover:-translate-y-1 hover:border-aurora/40 hover:shadow-xl"
            >
              <div className="mb-6 font-mono text-[10px] uppercase tracking-[0.28em] text-aurora">
                Pillar {String(i + 1).padStart(2, "0")}
              </div>
              <h3 className="font-display text-2xl font-bold text-arctic-deep">{p.title}</h3>
              <p className="mt-4 text-arctic-deep/60">{p.body}</p>
            </article>
          ))}
        </div>
      </section>
    </PageShell>
  );
}

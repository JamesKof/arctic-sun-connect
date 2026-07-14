import { createFileRoute } from "@tanstack/react-router";
import { PageShell, PageHero } from "@/components/site/PageShell";

const fellows = [
  { name: "Dr. Amara Okoro", role: "Climate Geochemistry", region: "Lagos ↔ Nuuk" },
  { name: "Prof. Sindre Aalborg", role: "Polar Oceanography", region: "Bergen ↔ Cape Town" },
  { name: "Naledi Molefe", role: "Indigenous Knowledge", region: "Gaborone ↔ Tromsø" },
  { name: "Kwame Asante", role: "Environmental Law", region: "Accra ↔ Reykjavík" },
  { name: "Dr. Ingrid Solberg", role: "Glaciology", region: "Oslo ↔ Nairobi" },
  { name: "Fatoumata Diallo", role: "Ocean Governance", region: "Dakar ↔ Longyearbyen" },
];

export const Route = createFileRoute("/fellows")({
  head: () => ({
    meta: [
      { title: "Fellows — Afro Polar Institute" },
      { name: "description", content: "Meet the API fellows: scientists, diplomats, artists and Indigenous knowledge holders working across Africa and the Polar regions." },
      { property: "og:title", content: "Fellows — Afro Polar Institute" },
      { property: "og:description", content: "A cross-latitude collective advancing science, policy and culture." },
    ],
  }),
  component: Fellows,
});

function Fellows() {
  return (
    <PageShell>
      <PageHero
        eyebrow="Community"
        title="Fellows."
        intro="A cross-latitude collective of scientists, policymakers, artists and diplomats bridging African and Polar research communities."
      />
      <section className="px-6 py-24 lg:px-10">
        <div className="mx-auto grid max-w-7xl gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {fellows.map((f) => (
            <article key={f.name} className="rounded-3xl border border-arctic-deep/10 bg-white p-8 transition-all hover:border-aurora/40 hover:shadow-lg">
              <div className="mb-6 h-14 w-14 rounded-full bg-gradient-to-tr from-arctic-deep to-aurora" />
              <h3 className="font-display text-xl font-bold text-arctic-deep">{f.name}</h3>
              <p className="mt-1 text-sm text-arctic-deep/60">{f.role}</p>
              <p className="mt-6 text-[10px] font-bold uppercase tracking-[0.22em] text-aurora">
                {f.region}
              </p>
            </article>
          ))}
        </div>
      </section>
    </PageShell>
  );
}

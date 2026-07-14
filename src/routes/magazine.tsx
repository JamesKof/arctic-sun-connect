import { createFileRoute } from "@tanstack/react-router";
import { PageShell, PageHero } from "@/components/site/PageShell";

const articles = [
  { issue: "Issue 04", title: "Dust and Glaciers: how the Sahara feeds the Greenland ice sheet", author: "Dr. Amara Okoro" },
  { issue: "Issue 04", title: "The Cold Coast Narrative", author: "Larry Ibrahim Mohammed" },
  { issue: "Issue 03", title: "Sea ice, sea salt: fisheries diplomacy at 66° North", author: "Prof. Sindre Aalborg" },
  { issue: "Issue 03", title: "Voices from the Sahel: adaptation as inheritance", author: "Naledi Molefe" },
];

export const Route = createFileRoute("/magazine")({
  head: () => ({
    meta: [
      { title: "The Latitude Review — Afro Polar Institute" },
      { name: "description", content: "The Latitude Review is the Afro Polar Institute's magazine of long-form research, policy essays and field reporting from the tropics to the poles." },
      { property: "og:title", content: "The Latitude Review — Afro Polar Institute" },
      { property: "og:description", content: "Long-form essays and reporting bridging Africa and the Polar regions." },
    ],
  }),
  component: Magazine,
});

function Magazine() {
  return (
    <PageShell>
      <PageHero
        eyebrow="The Latitude Review"
        title="Essays across the latitudes."
        intro="Long-form research, policy dispatches and field reporting from the tropics to the poles."
      />
      <section className="px-6 py-24 lg:px-10">
        <div className="mx-auto max-w-5xl divide-y divide-arctic-deep/10 border-y border-arctic-deep/10">
          {articles.map((a) => (
            <article key={a.title} className="group grid grid-cols-1 gap-3 py-10 md:grid-cols-[140px_1fr]">
              <div className="font-mono text-[11px] uppercase tracking-[0.22em] text-aurora">{a.issue}</div>
              <div>
                <h3 className="font-display text-2xl font-bold text-arctic-deep transition-colors group-hover:text-aurora md:text-3xl">
                  {a.title}
                </h3>
                <p className="mt-2 text-sm text-arctic-deep/60">By {a.author}</p>
              </div>
            </article>
          ))}
        </div>
      </section>
    </PageShell>
  );
}

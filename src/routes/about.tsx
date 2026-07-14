import { createFileRoute } from "@tanstack/react-router";
import { PageShell, PageHero } from "@/components/site/PageShell";

export const Route = createFileRoute("/about")({
  head: () => ({
    meta: [
      { title: "About — Afro Polar Institute" },
      { name: "description", content: "About the Afro Polar Institute — an international hub bridging Africa and the Polar regions through science, policy and culture." },
      { property: "og:title", content: "About — Afro Polar Institute" },
      { property: "og:description", content: "Our mission, leadership and vision for Africa–Polar collaboration." },
    ],
  }),
  component: About,
});

function About() {
  return (
    <PageShell>
      <PageHero
        eyebrow="About the Institute"
        title="An institutional bridge between Africa and the Poles."
        intro="API is an independent research body committed to scientific excellence and international policy dialogue spanning the tropics to the poles."
      />
      <section className="px-6 py-24 lg:px-10">
        <div className="mx-auto grid max-w-6xl gap-14 lg:grid-cols-2">
          <div>
            <h2 className="font-display text-3xl font-bold text-arctic-deep">Our mission</h2>
            <p className="mt-6 text-lg leading-relaxed text-arctic-deep/70">
              The Afro Polar Institute connects African and Polar communities to address
              climate change, environmental justice, resource governance and cultural
              exchange. We convene scientists, diplomats, artists and Indigenous knowledge
              holders across latitudes.
            </p>
          </div>
          <div>
            <h2 className="font-display text-3xl font-bold text-arctic-deep">Leadership</h2>
            <div className="mt-6 space-y-4 text-arctic-deep/70">
              <p>
                <span className="text-[11px] font-bold uppercase tracking-[0.22em] text-aurora">Director</span>
                <br />
                <span className="font-semibold text-arctic-deep">Larry Ibrahim Mohammed</span>
              </p>
              <p className="text-sm">+47 48 62 66 55 · afropolarinitiative@gmail.com</p>
            </div>
          </div>
        </div>
      </section>
    </PageShell>
  );
}

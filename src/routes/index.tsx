import { createFileRoute, Link } from "@tanstack/react-router";
import { PageShell } from "@/components/site/PageShell";
import { Reveal } from "@/components/site/Reveal";
import heroImg from "@/assets/hero-latitudes.jpg";
import researchImg from "@/assets/research-station.jpg";
import oceanImg from "@/assets/ocean-currents.jpg";
import fellowshipImg from "@/assets/fellowship.jpg";
import portraitImg from "@/assets/feature-portrait.jpg";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Afro Polar Institute — Connecting People and Latitudes" },
      {
        name: "description",
        content:
          "The world's first institutional hub bridging Africa and the Polar regions for scientific, cultural and geopolitical collaboration.",
      },
      { property: "og:title", content: "Afro Polar Institute — Connecting People and Latitudes" },
      {
        property: "og:description",
        content:
          "The world's first institutional hub bridging Africa and the Polar regions for scientific, cultural and geopolitical collaboration.",
      },
    ],
  }),
  component: Home,
});

function Home() {
  return (
    <PageShell>
      <Hero />
      <Reveal><Stats /></Reveal>
      <Reveal><ResearchFocus /></Reveal>
      <Reveal><FeatureStory /></Reveal>
      <Reveal><Events /></Reveal>
      <Reveal><Fellows /></Reveal>
      <Reveal><Partners /></Reveal>
      <Reveal><Newsletter /></Reveal>
    </PageShell>
  );
}


function Hero() {
  return (
    <section className="aurora-gradient relative -mt-20 flex min-h-[92vh] flex-col items-center justify-center px-6 pt-32 pb-16 text-center lg:px-10">
      <div
        aria-hidden
        className="pointer-events-none absolute inset-x-0 top-0 h-[70vh] opacity-25 [mask-image:linear-gradient(to_bottom,black,transparent)]"
      >
        <img
          src={heroImg}
          alt=""
          width={1920}
          height={1080}
          className="animate-aurora h-full w-full object-cover"
        />
      </div>

      <div className="relative z-10 max-w-5xl animate-fade-up">
        <span className="mb-5 inline-block rounded-full border border-aurora/30 bg-white/60 px-4 py-1 text-[11px] font-bold uppercase tracking-[0.22em] text-aurora backdrop-blur">
          Science · Diplomacy · Culture
        </span>
        <h1 className="font-display text-5xl font-bold tracking-tight text-arctic-deep md:text-7xl lg:text-8xl lg:leading-[1.02]">
          Connecting People
          <br />
          <span className="text-gradient-brand">and Latitudes</span>
        </h1>
        <p className="mx-auto mt-8 max-w-2xl text-lg leading-relaxed text-arctic-deep/70 md:text-xl">
          The world's first institutional hub bridging Africa and the Polar regions for
          scientific, cultural and geopolitical collaboration.
        </p>
        <div className="mt-10 flex flex-wrap justify-center gap-3">
          <Link
            to="/research"
            className="rounded-full bg-arctic-deep px-7 py-3.5 text-sm font-bold uppercase tracking-[0.14em] text-white transition-transform hover:-translate-y-0.5 hover:bg-aurora hover:text-arctic-deep"
          >
            Explore Research
          </Link>
          <Link
            to="/magazine"
            className="rounded-full border border-arctic-deep/15 bg-white/70 px-7 py-3.5 text-sm font-bold uppercase tracking-[0.14em] text-arctic-deep backdrop-blur transition-colors hover:bg-white"
          >
            Latest Publications
          </Link>
        </div>
      </div>

      <div className="relative z-10 mt-20 grid w-full max-w-6xl grid-cols-2 gap-6 md:grid-cols-4">
        {[
          { v: "45+", label: "Member States", c: "text-sunrise" },
          { v: "120", label: "Active Fellows", c: "text-aurora" },
          { v: "14k", label: "Research Papers", c: "text-arctic-deep" },
          { v: "$2M", label: "Project Funding", c: "text-arctic-deep" },
        ].map((s) => (
          <div key={s.label} className="border-l border-arctic-deep/10 pl-5 text-left">
            <div className={`font-display text-3xl font-bold ${s.c}`}>{s.v}</div>
            <div className="mt-1 text-[10px] font-bold uppercase tracking-[0.22em] text-arctic-deep/60">
              {s.label}
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}

function Stats() {
  return (
    <section className="border-y border-arctic-deep/10 bg-white px-6 py-24 lg:px-10">
      <div className="mx-auto grid max-w-7xl gap-12 lg:grid-cols-12">
        <div className="lg:col-span-7">
          <span className="mb-4 block text-[11px] font-bold uppercase tracking-[0.22em] text-sunrise">
            Mission & Impact
          </span>
          <p className="font-display text-3xl leading-tight text-arctic-deep md:text-[2.4rem] md:leading-[1.2]">
            API examines the shared future of the African continent and the Polar regions
            through the lens of Indigenous knowledge, climate justice, ocean governance and
            scientific collaboration.
          </p>
        </div>
        <div className="lg:col-span-5 lg:border-l lg:border-arctic-deep/10 lg:pl-10">
          <ul className="space-y-6 text-arctic-deep/70">
            {[
              "Bridging Arctic, Antarctic and African research communities",
              "Advancing polar diplomacy and equitable resource governance",
              "Publishing peer-reviewed work in The Latitude Review",
              "Convening the next generation of scientific leaders",
            ].map((t) => (
              <li key={t} className="flex gap-4">
                <span className="mt-2 h-[1px] w-8 shrink-0 bg-aurora" />
                <span>{t}</span>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </section>
  );
}

function ResearchFocus() {
  return (
    <section className="bg-white px-6 py-24 lg:px-10">
      <div className="mx-auto max-w-7xl">
        <div className="mb-14 flex flex-wrap items-end justify-between gap-6">
          <div className="max-w-xl">
            <span className="mb-3 block text-[11px] font-bold uppercase tracking-[0.22em] text-aurora">
              Research
            </span>
            <h2 className="font-display text-4xl font-bold tracking-tight text-arctic-deep md:text-5xl">
              Research Focus
            </h2>
            <p className="mt-4 text-arctic-deep/60">
              Addressing shared global challenges from tropical coastlines to the frozen frontiers.
            </p>
          </div>
          <Link
            to="/research"
            className="text-[12px] font-bold uppercase tracking-[0.22em] text-aurora hover:underline"
          >
            View all programs →
          </Link>
        </div>

        <div className="grid grid-cols-1 gap-6 md:grid-cols-12">
          <article className="group overflow-hidden rounded-3xl bg-ice-glace/40 p-1 md:col-span-8">
            <img
              src={researchImg}
              alt="Polar research station under aurora borealis"
              width={1600}
              height={900}
              loading="lazy"
              className="aspect-[21/9] w-full rounded-[22px] object-cover transition-transform duration-700 group-hover:scale-[1.02]"
            />
            <div className="p-8">
              <h3 className="font-display text-2xl font-bold text-arctic-deep">
                Arctic–Africa Climate Dynamics
              </h3>
              <p className="mt-2 text-arctic-deep/60">
                Analysing the meteorological connection between Sahel droughts and Arctic ice loss.
              </p>
            </div>
          </article>

          <article className="group flex flex-col justify-between rounded-3xl bg-arctic-deep p-8 text-white md:col-span-4">
            <div>
              <span className="text-[11px] font-bold uppercase tracking-[0.22em] text-aurora">
                Policy Hub
              </span>
              <h3 className="font-display mt-5 text-3xl font-bold leading-tight">
                Diplomacy & Indigenous Knowledge
              </h3>
              <p className="mt-4 text-sm text-white/60">
                Convening ancestral wisdom and modern policy across the African Union and Arctic Council.
              </p>
            </div>
            <button
              type="button"
              aria-label="Explore policy hub"
              className="mt-8 flex h-12 w-12 items-center justify-center rounded-full bg-aurora text-arctic-deep transition-transform group-hover:scale-110"
            >
              →
            </button>
          </article>

          <article className="group rounded-3xl border border-arctic-deep/5 bg-white p-6 shadow-sm transition-all hover:-translate-y-1 hover:shadow-xl md:col-span-4">
            <img
              src={oceanImg}
              alt="Aerial view of ocean currents"
              width={1024}
              height={768}
              loading="lazy"
              className="mb-6 aspect-video w-full rounded-xl object-cover"
            />
            <h4 className="font-display text-xl font-bold text-arctic-deep">Ocean Stewardship</h4>
            <p className="mt-2 text-sm text-arctic-deep/60">
              Protecting marine biodiversity across the Atlantic corridor and polar seas.
            </p>
          </article>

          <article className="group rounded-3xl border border-arctic-deep/5 bg-white p-6 shadow-sm transition-all hover:-translate-y-1 hover:shadow-xl md:col-span-4">
            <img
              src={fellowshipImg}
              alt="African university at sunrise"
              width={1024}
              height={768}
              loading="lazy"
              className="mb-6 aspect-video w-full rounded-xl object-cover"
            />
            <h4 className="font-display text-xl font-bold text-arctic-deep">Fellowship Programs</h4>
            <p className="mt-2 text-sm text-arctic-deep/60">
              Fostering the next generation of global scientific and policy leaders.
            </p>
          </article>

          <article className="rounded-3xl bg-sunrise/10 p-8 md:col-span-4">
            <div className="flex h-full flex-col justify-center text-center">
              <div className="font-display text-5xl font-bold text-sunrise">90%</div>
              <p className="mt-2 text-[11px] font-bold uppercase tracking-[0.22em] text-sunrise">
                Research Completion Rate
              </p>
              <p className="mt-4 text-sm text-arctic-deep/70">
                Peer-reviewed publications across 14 international journals.
              </p>
            </div>
          </article>
        </div>
      </div>
    </section>
  );
}

function FeatureStory() {
  return (
    <section className="bg-ice-glace/30 px-6 py-24 lg:px-10">
      <div className="mx-auto grid max-w-6xl items-center gap-14 lg:grid-cols-2">
        <div className="overflow-hidden rounded-3xl">
          <img
            src={portraitImg}
            alt="Portrait of Dr. Amara Okoro, senior research fellow"
            width={1200}
            height={1600}
            loading="lazy"
            className="aspect-[4/5] w-full object-cover"
          />
        </div>
        <div>
          <span className="text-[11px] font-bold uppercase tracking-[0.22em] text-aurora">
            The Latitude Review · Issue 04
          </span>
          <h2 className="font-display mt-5 text-4xl font-bold leading-tight text-arctic-deep md:text-5xl">
            Dust and Glaciers: how the Sahara feeds the Greenland ice sheet
          </h2>
          <p className="mt-6 text-lg text-arctic-deep/70">
            Dr. Amara Okoro explores the geochemical link between sub-Saharan dust storms and the
            melting rates of the far north — and what it means for Africa's climate future.
          </p>
          <div className="mt-8 flex items-center gap-4">
            <div className="h-12 w-12 rounded-full bg-arctic-deep/10" />
            <div>
              <p className="text-sm font-semibold text-arctic-deep">Dr. Amara Okoro</p>
              <p className="text-xs text-arctic-deep/50">Senior Research Fellow</p>
            </div>
          </div>
          <Link
            to="/magazine"
            className="mt-10 inline-flex rounded-full bg-arctic-deep px-7 py-3 text-sm font-bold uppercase tracking-[0.14em] text-white hover:bg-aurora hover:text-arctic-deep"
          >
            Read Essay
          </Link>
        </div>
      </div>
    </section>
  );
}

function Events() {
  const items = [
    {
      date: "12 Mar 2026",
      city: "Tromsø, Norway",
      title: "Arctic Frontiers Africa Dialogue",
      tag: "Symposium",
    },
    {
      date: "24 Apr 2026",
      city: "Accra, Ghana",
      title: "Tropics-to-Poles Fellowship Convening",
      tag: "Convening",
    },
    {
      date: "05 Jun 2026",
      city: "Cape Town, South Africa",
      title: "Ocean Governance & Polar Commons Forum",
      tag: "Forum",
    },
  ];
  return (
    <section className="bg-white px-6 py-24 lg:px-10">
      <div className="mx-auto max-w-7xl">
        <div className="mb-12 flex flex-wrap items-end justify-between gap-4">
          <div>
            <span className="mb-3 block text-[11px] font-bold uppercase tracking-[0.22em] text-aurora">
              Convenings
            </span>
            <h2 className="font-display text-4xl font-bold tracking-tight text-arctic-deep md:text-5xl">
              Upcoming Events
            </h2>
          </div>
          <Link to="/events" className="text-[12px] font-bold uppercase tracking-[0.22em] text-aurora hover:underline">
            Full calendar →
          </Link>
        </div>
        <ul className="divide-y divide-arctic-deep/10 border-y border-arctic-deep/10">
          {items.map((e) => (
            <li key={e.title} className="group grid grid-cols-1 gap-4 py-8 md:grid-cols-[160px_1fr_auto] md:items-center">
              <div className="font-mono text-sm text-arctic-deep/60">{e.date}</div>
              <div>
                <div className="text-[10px] font-bold uppercase tracking-[0.28em] text-aurora">{e.tag}</div>
                <h3 className="font-display mt-1 text-2xl font-bold text-arctic-deep transition-colors group-hover:text-aurora">
                  {e.title}
                </h3>
                <p className="text-sm text-arctic-deep/60">{e.city}</p>
              </div>
              <Link
                to="/events"
                className="justify-self-start rounded-full border border-arctic-deep/15 px-5 py-2 text-[11px] font-bold uppercase tracking-[0.2em] text-arctic-deep transition-colors hover:border-aurora hover:text-aurora md:justify-self-end"
              >
                Register
              </Link>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}

function Fellows() {
  const fellows = [
    { name: "Dr. Amara Okoro", role: "Climate Geochemistry", region: "Lagos ↔ Nuuk" },
    { name: "Prof. Sindre Aalborg", role: "Polar Oceanography", region: "Bergen ↔ Cape Town" },
    { name: "Naledi Molefe", role: "Indigenous Knowledge", region: "Gaborone ↔ Tromsø" },
    { name: "Kwame Asante", role: "Environmental Law", region: "Accra ↔ Reykjavík" },
  ];
  return (
    <section className="bg-arctic-deep px-6 py-24 text-white lg:px-10">
      <div className="mx-auto max-w-7xl">
        <div className="mb-14 flex flex-wrap items-end justify-between gap-4">
          <div>
            <span className="mb-3 block text-[11px] font-bold uppercase tracking-[0.22em] text-aurora">
              Community
            </span>
            <h2 className="font-display text-4xl font-bold tracking-tight md:text-5xl">Fellows</h2>
            <p className="mt-4 max-w-xl text-white/60">
              A cross-latitude collective of scientists, policymakers, artists and diplomats.
            </p>
          </div>
          <Link to="/fellows" className="text-[12px] font-bold uppercase tracking-[0.22em] text-aurora hover:underline">
            Meet the fellows →
          </Link>
        </div>
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {fellows.map((f) => (
            <div key={f.name} className="rounded-2xl border border-white/10 bg-white/5 p-6 backdrop-blur transition-colors hover:border-aurora/60">
              <div className="mb-6 h-12 w-12 rounded-full bg-gradient-to-tr from-aurora to-sunrise" />
              <h3 className="font-display text-lg font-bold">{f.name}</h3>
              <p className="mt-1 text-sm text-white/60">{f.role}</p>
              <p className="mt-4 text-[10px] font-bold uppercase tracking-[0.22em] text-aurora">
                {f.region}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

function Partners() {
  const partners = [
    "Arctic Council",
    "Norsk Polarinstitutt",
    "African Union",
    "UN Environment",
    "IPCC",
    "UiT",
  ];
  return (
    <section className="border-y border-arctic-deep/10 bg-white px-6 py-16 lg:px-10">
      <div className="mx-auto max-w-7xl">
        <p className="mb-10 text-center text-[10px] font-bold uppercase tracking-[0.32em] text-arctic-deep/50">
          In partnership with
        </p>
        <div className="grid grid-cols-2 gap-8 md:grid-cols-3 lg:grid-cols-6">
          {partners.map((p) => (
            <div
              key={p}
              className="flex h-14 items-center justify-center rounded-lg border border-arctic-deep/10 text-center font-display text-sm font-semibold text-arctic-deep/50 transition-colors hover:text-arctic-deep"
            >
              {p}
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

function Newsletter() {
  return (
    <section className="aurora-gradient px-6 py-24 lg:px-10">
      <div className="mx-auto max-w-3xl text-center">
        <span className="mb-4 inline-block text-[11px] font-bold uppercase tracking-[0.22em] text-aurora">
          Stay informed
        </span>
        <h2 className="font-display text-4xl font-bold tracking-tight text-arctic-deep md:text-5xl">
          A monthly briefing across the latitudes.
        </h2>
        <p className="mt-4 text-arctic-deep/70">
          Research briefs, policy dispatches and stories from the field — no noise.
        </p>
        <form
          className="mx-auto mt-10 flex max-w-md gap-2"
          onSubmit={(e) => e.preventDefault()}
        >
          <label htmlFor="hero-email" className="sr-only">Email</label>
          <input
            id="hero-email"
            type="email"
            required
            placeholder="you@institute.org"
            className="w-full rounded-full border border-arctic-deep/15 bg-white px-5 py-3 text-sm focus:border-aurora focus:outline-none"
          />
          <button
            type="submit"
            className="rounded-full bg-arctic-deep px-6 py-3 text-sm font-bold uppercase tracking-[0.14em] text-white hover:bg-aurora hover:text-arctic-deep"
          >
            Subscribe
          </button>
        </form>
      </div>
    </section>
  );
}

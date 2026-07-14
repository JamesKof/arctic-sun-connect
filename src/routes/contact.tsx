import { createFileRoute } from "@tanstack/react-router";
import { PageShell, PageHero } from "@/components/site/PageShell";
import { useState } from "react";

export const Route = createFileRoute("/contact")({
  head: () => ({
    meta: [
      { title: "Contact — Afro Polar Institute" },
      { name: "description", content: "Get in touch with the Afro Polar Institute — Director Larry Ibrahim Mohammed and the API team." },
      { property: "og:title", content: "Contact — Afro Polar Institute" },
      { property: "og:description", content: "Contact the Afro Polar Institute." },
    ],
  }),
  component: Contact,
});

function Contact() {
  const [sent, setSent] = useState(false);
  return (
    <PageShell>
      <PageHero
        eyebrow="Contact"
        title="Let's collaborate across latitudes."
        intro="For research partnerships, policy dialogue, media enquiries and fellowship applications."
      />
      <section className="px-6 py-24 lg:px-10">
        <div className="mx-auto grid max-w-6xl gap-14 lg:grid-cols-2">
          <div>
            <h2 className="font-display text-2xl font-bold text-arctic-deep">Director</h2>
            <p className="mt-4 text-lg text-arctic-deep/80">Larry Ibrahim Mohammed</p>
            <dl className="mt-8 space-y-4 text-arctic-deep/70">
              <div>
                <dt className="text-[10px] font-bold uppercase tracking-[0.28em] text-aurora">Phone</dt>
                <dd className="mt-1">
                  <a href="tel:+4748626655" className="hover:text-aurora">+47 48 62 66 55</a>
                </dd>
              </div>
              <div>
                <dt className="text-[10px] font-bold uppercase tracking-[0.28em] text-aurora">Email</dt>
                <dd className="mt-1">
                  <a href="mailto:afropolarinitiative@gmail.com" className="hover:text-aurora">
                    afropolarinitiative@gmail.com
                  </a>
                </dd>
              </div>
            </dl>
          </div>

          <form
            className="space-y-4 rounded-3xl border border-arctic-deep/10 bg-white p-8 shadow-sm"
            onSubmit={(e) => {
              e.preventDefault();
              setSent(true);
            }}
          >
            {sent ? (
              <div className="py-16 text-center">
                <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-aurora/20 text-2xl text-aurora">✓</div>
                <p className="font-display text-xl font-bold text-arctic-deep">Message received.</p>
                <p className="mt-2 text-sm text-arctic-deep/60">We'll be in touch soon.</p>
              </div>
            ) : (
              <>
                <div>
                  <label htmlFor="name" className="text-[11px] font-bold uppercase tracking-[0.22em] text-arctic-deep/70">Name</label>
                  <input id="name" required className="mt-2 w-full rounded-lg border border-arctic-deep/15 bg-white px-4 py-3 text-sm focus:border-aurora focus:outline-none" />
                </div>
                <div>
                  <label htmlFor="email" className="text-[11px] font-bold uppercase tracking-[0.22em] text-arctic-deep/70">Email</label>
                  <input id="email" type="email" required className="mt-2 w-full rounded-lg border border-arctic-deep/15 bg-white px-4 py-3 text-sm focus:border-aurora focus:outline-none" />
                </div>
                <div>
                  <label htmlFor="message" className="text-[11px] font-bold uppercase tracking-[0.22em] text-arctic-deep/70">Message</label>
                  <textarea id="message" rows={5} required className="mt-2 w-full rounded-lg border border-arctic-deep/15 bg-white px-4 py-3 text-sm focus:border-aurora focus:outline-none" />
                </div>
                <button
                  type="submit"
                  className="w-full rounded-full bg-arctic-deep px-6 py-3 text-sm font-bold uppercase tracking-[0.14em] text-white hover:bg-aurora hover:text-arctic-deep"
                >
                  Send message
                </button>
              </>
            )}
          </form>
        </div>
      </section>
    </PageShell>
  );
}

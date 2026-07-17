import type { ReactNode } from "react";
import { Header } from "./Header";
import { Footer } from "./Footer";

export function PageShell({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-screen bg-background text-foreground">
      <Header />
      <main className="pt-20">{children}</main>
      <Footer />
    </div>
  );
}

export function PageHero({
  eyebrow,
  title,
  intro,
}: {
  eyebrow: string;
  title: string;
  intro?: string;
}) {
  return (
    <section className="aurora-gradient animate-gradient border-b border-arctic-deep/5 px-6 py-24 lg:px-10 lg:py-32">
      <div className="mx-auto max-w-5xl animate-fade-up">
        <span className="mb-6 inline-block rounded-full border border-aurora/30 bg-aurora/5 px-4 py-1 text-[11px] font-bold uppercase tracking-[0.2em] text-aurora">
          {eyebrow}
        </span>
        <h1 className="font-display text-4xl font-bold tracking-tight text-arctic-deep md:text-6xl">
          {title}
        </h1>
        {intro && <p className="mt-6 max-w-2xl text-lg leading-relaxed text-arctic-deep/70">{intro}</p>}
      </div>
    </section>
  );
}

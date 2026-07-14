import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { listMyBookmarks } from "@/lib/cms.functions";
import { PageShell, PageHero } from "@/components/site/PageShell";

export const Route = createFileRoute("/_authenticated/bookmarks")({
  head: () => ({ meta: [{ title: "My bookmarks — Afro Polar Institute" }] }),
  component: Bookmarks,
});

function Bookmarks() {
  const fn = useServerFn(listMyBookmarks);
  const { data, isLoading } = useQuery({ queryKey: ["my-bookmarks"], queryFn: () => fn() });
  return (
    <PageShell>
      <PageHero eyebrow="Reading list" title="Your bookmarks." intro="Articles you've saved from The Latitude Review." />
      <section className="mx-auto max-w-4xl px-6 pb-24">
        {isLoading && <p className="text-arctic-deep/60">Loading…</p>}
        {!isLoading && (data?.length ?? 0) === 0 && <p className="text-arctic-deep/60">No bookmarks yet.</p>}
        <ul className="divide-y divide-arctic-deep/10 border-y border-arctic-deep/10">
          {data?.map((p: any) => (
            <li key={p.id} className="py-6">
              <Link to="/magazine/$slug" params={{ slug: p.slug }} className="font-display text-2xl font-bold text-arctic-deep hover:text-aurora">{p.title}</Link>
              <p className="mt-1 text-sm text-arctic-deep/60">{p.excerpt}</p>
            </li>
          ))}
        </ul>
      </section>
    </PageShell>
  );
}

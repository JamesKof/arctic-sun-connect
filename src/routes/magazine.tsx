import { createFileRoute, Link } from "@tanstack/react-router";
import { useInfiniteQuery, useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { useEffect, useRef, useState } from "react";
import { z } from "zod";
import { PageShell, PageHero } from "@/components/site/PageShell";
import { NewsletterForm } from "@/components/site/NewsletterForm";
import { listCategories, listPublicPosts } from "@/lib/cms.functions";

const searchSchema = z.object({
  q: z.string().optional().default(""),
  category: z.string().optional().default(""),
});

export const Route = createFileRoute("/magazine")({
  validateSearch: (s) => searchSchema.parse(s),
  head: () => ({
    meta: [
      { title: "The Latitude Review — Afro Polar Institute" },
      { name: "description", content: "The Afro Polar Institute's magazine of long-form research and reporting from the tropics to the poles." },
      { property: "og:title", content: "The Latitude Review" },
      { property: "og:description", content: "Essays across the latitudes." },
    ],
  }),
  component: Magazine,
});

function Magazine() {
  const { q, category } = Route.useSearch();
  const navigate = Route.useNavigate();
  const [term, setTerm] = useState(q);
  useEffect(() => { setTerm(q); }, [q]);

  const catsFn = useServerFn(listCategories);
  const listFn = useServerFn(listPublicPosts);

  const { data: cats } = useQuery({ queryKey: ["cats"], queryFn: () => catsFn() });

  const posts = useInfiniteQuery({
    queryKey: ["posts", q, category],
    queryFn: ({ pageParam }) => listFn({ data: { cursor: pageParam ?? null, category: category || null, q: q || null } }),
    initialPageParam: null as string | null,
    getNextPageParam: (last) => last.nextCursor,
  });

  const sentinel = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const el = sentinel.current;
    if (!el) return;
    const io = new IntersectionObserver((es) => {
      if (es[0].isIntersecting && posts.hasNextPage && !posts.isFetchingNextPage) posts.fetchNextPage();
    });
    io.observe(el);
    return () => io.disconnect();
  }, [posts]);

  return (
    <PageShell>
      <PageHero eyebrow="The Latitude Review" title="Essays across the latitudes."
        intro="Long-form research, policy dispatches and field reporting from the tropics to the poles." />

      <section className="px-6 pb-6 lg:px-10">
        <div className="mx-auto max-w-5xl">
          <form
            onSubmit={(e) => { e.preventDefault(); navigate({ search: (s: any) => ({ ...s, q: term }) }); }}
            className="flex flex-col gap-3 sm:flex-row"
          >
            <input value={term} onChange={(e) => setTerm(e.target.value)} placeholder="Search essays…"
              className="flex-1 rounded-full border border-arctic-deep/15 bg-white px-5 py-3 text-sm" />
            <button className="rounded-full bg-arctic-deep px-6 py-3 text-xs font-bold uppercase tracking-widest text-white hover:bg-aurora hover:text-arctic-deep">Search</button>
          </form>
          <div className="mt-4 flex flex-wrap gap-2">
            <button onClick={() => navigate({ search: (s: any) => ({ ...s, category: "" }) })}
              className={`rounded-full px-4 py-1.5 text-xs font-bold uppercase tracking-[0.16em] transition ${!category ? "bg-arctic-deep text-white" : "border border-arctic-deep/15 text-arctic-deep hover:border-aurora"}`}>All</button>
            {cats?.map((c: any) => (
              <button key={c.id} onClick={() => navigate({ search: (s: any) => ({ ...s, category: c.slug }) })}
                className={`rounded-full px-4 py-1.5 text-xs font-bold uppercase tracking-[0.16em] transition ${category === c.slug ? "bg-arctic-deep text-white" : "border border-arctic-deep/15 text-arctic-deep hover:border-aurora"}`}>
                {c.name}
              </button>
            ))}
          </div>
        </div>
      </section>

      <section className="px-6 pb-24 lg:px-10">
        <div className="mx-auto max-w-5xl">
          <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-3">
            {posts.data?.pages.flatMap((p) => p.items).map((post: any) => (
              <article key={post.id} className="group rounded-3xl border border-arctic-deep/10 bg-white p-6 transition hover:border-aurora/40 hover:shadow-lg">
                {post.cover_url && <img src={post.cover_url} alt="" className="mb-4 h-40 w-full rounded-2xl object-cover" />}
                <p className="text-[10px] font-bold uppercase tracking-[0.22em] text-aurora">{post.categories?.name ?? post.issue_label ?? "Essay"}</p>
                <h3 className="font-display mt-2 text-xl font-bold text-arctic-deep transition-colors group-hover:text-aurora">
                  <Link to="/magazine/$slug" params={{ slug: post.slug }}>{post.title}</Link>
                </h3>
                <p className="mt-2 text-sm text-arctic-deep/60 line-clamp-3">{post.excerpt}</p>
                <p className="mt-4 text-[10px] uppercase tracking-[0.24em] text-arctic-deep/40">{post.reading_time} min · {post.author_name}</p>
              </article>
            ))}
          </div>
          {posts.isLoading && <p className="mt-8 text-arctic-deep/60">Loading…</p>}
          {(posts.data?.pages.flatMap((p) => p.items).length ?? 0) === 0 && !posts.isLoading && (
            <p className="mt-8 text-arctic-deep/60">No essays match that search.</p>
          )}
          <div ref={sentinel} className="h-10" />
          {posts.isFetchingNextPage && <p className="text-center text-arctic-deep/50">Loading more…</p>}

          <div className="mt-16">
            <NewsletterForm variant="inline" />
          </div>
        </div>
      </section>
    </PageShell>
  );
}

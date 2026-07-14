import { createFileRoute, Link, notFound } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { useEffect, useState } from "react";
import { PageShell } from "@/components/site/PageShell";
import { NewsletterForm } from "@/components/site/NewsletterForm";
import { getPublicPost, toggleBookmark, isBookmarked } from "@/lib/cms.functions";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export const Route = createFileRoute("/magazine/$slug")({
  loader: async ({ params, context }) => {
    const data = await context.queryClient.ensureQueryData({
      queryKey: ["post", params.slug],
      queryFn: () => getPublicPost({ data: { slug: params.slug } }),
    });
    if (!data.post) throw notFound();
    return data;
  },
  head: ({ loaderData }) => {
    const p = loaderData?.post as any;
    return {
      meta: [
        { title: p ? `${p.title} — The Latitude Review` : "Essay — The Latitude Review" },
        { name: "description", content: p?.excerpt ?? "" },
        { property: "og:title", content: p?.title ?? "" },
        { property: "og:description", content: p?.excerpt ?? "" },
        ...(p?.cover_url ? [{ property: "og:image", content: p.cover_url }] : []),
      ],
    };
  },
  errorComponent: ({ error }) => <PageShell><div className="p-16 text-center">{error.message}</div></PageShell>,
  notFoundComponent: () => <PageShell><div className="p-16 text-center">Essay not found.</div></PageShell>,
  component: Article,
});

function Article() {
  const { post, related } = Route.useLoaderData() as any;
  const [signedIn, setSignedIn] = useState(false);
  useEffect(() => { supabase.auth.getUser().then(({ data }) => setSignedIn(!!data.user)); }, []);

  return (
    <PageShell>
      <article className="mx-auto max-w-3xl px-6 py-24">
        <p className="text-[10px] font-bold uppercase tracking-[0.28em] text-aurora">{post.categories?.name ?? post.issue_label}</p>
        <h1 className="font-display mt-4 text-4xl font-bold leading-tight text-arctic-deep md:text-6xl">{post.title}</h1>
        <p className="mt-4 text-sm text-arctic-deep/60">By {post.author_name} · {post.reading_time} min read · {(post.published_at ?? "").slice(0, 10)}</p>
        {post.cover_url && <img src={post.cover_url} alt="" className="mt-8 w-full rounded-3xl object-cover" />}
        <div className="prose prose-lg mt-10 max-w-none whitespace-pre-wrap text-arctic-deep/80">{post.body}</div>

        {signedIn && <BookmarkButton postId={post.id} />}

        <div className="my-16"><NewsletterForm variant="inline" /></div>

        {related.length > 0 && (
          <aside className="mt-16 border-t border-arctic-deep/10 pt-10">
            <h2 className="font-display text-2xl font-bold text-arctic-deep">Related essays</h2>
            <ul className="mt-6 space-y-4">
              {related.map((r: any) => (
                <li key={r.id}>
                  <Link to="/magazine/$slug" params={{ slug: r.slug }} className="font-display text-xl font-semibold text-arctic-deep hover:text-aurora">{r.title}</Link>
                  <p className="text-sm text-arctic-deep/60">{r.excerpt}</p>
                </li>
              ))}
            </ul>
          </aside>
        )}
      </article>
    </PageShell>
  );
}

function BookmarkButton({ postId }: { postId: string }) {
  const isFn = useServerFn(isBookmarked);
  const toggleFn = useServerFn(toggleBookmark);
  const qc = useQueryClient();
  const { data } = useQuery({ queryKey: ["bookmarked", postId], queryFn: () => isFn({ data: { postId } }) });
  const m = useMutation({
    mutationFn: () => toggleFn({ data: { postId } }),
    onSuccess: (r) => { qc.setQueryData(["bookmarked", postId], r); toast.success(r.bookmarked ? "Bookmarked" : "Removed"); },
  });
  return (
    <button onClick={() => m.mutate()} className="mt-10 rounded-full border border-arctic-deep/20 px-5 py-2 text-xs font-bold uppercase tracking-widest text-arctic-deep hover:border-aurora hover:text-aurora">
      {data?.bookmarked ? "★ Bookmarked" : "☆ Bookmark"}
    </button>
  );
}

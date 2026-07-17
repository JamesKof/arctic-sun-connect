import { createServerFn } from "@tanstack/react-start";
import { createClient } from "@supabase/supabase-js";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import type { Database } from "@/integrations/supabase/types";
import { toSlug, readingTime } from "./slug";

// ---------- Public reads (no auth) ----------
function publicClient() {
  const key = process.env.SUPABASE_PUBLISHABLE_KEY!;
  return createClient<Database>(process.env.SUPABASE_URL!, key, {
    auth: { persistSession: false, autoRefreshToken: false, storage: undefined },
    global: {
      fetch: (input, init) => {
        const h = new Headers(init?.headers);
        if (key.startsWith("sb_") && h.get("Authorization") === `Bearer ${key}`) h.delete("Authorization");
        h.set("apikey", key);
        return fetch(input, { ...init, headers: h });
      },
    },
  });
}

export const listPublicPosts = createServerFn({ method: "GET" })
  .inputValidator((d: { cursor?: string | null; limit?: number; category?: string | null; q?: string | null }) => ({
    cursor: d.cursor ?? null,
    limit: Math.min(Math.max(d.limit ?? 9, 1), 24),
    category: d.category ?? null,
    q: (d.q ?? "").trim() || null,
  }))
  .handler(async ({ data }) => {
    const sb = publicClient();
    let q = sb
      .from("posts")
      .select("id, slug, title, excerpt, cover_url, reading_time, author_name, tags, issue_label, published_at, category_id, categories(name, slug)")
      .eq("status", "published")
      .order("published_at", { ascending: false })
      .limit(data.limit + 1);
    if (data.cursor) q = q.lt("published_at", data.cursor);
    if (data.category) {
      const { data: cat } = await sb.from("categories").select("id").eq("slug", data.category).maybeSingle();
      if (cat) q = q.eq("category_id", cat.id);
    }
    if (data.q) q = q.textSearch("search", data.q, { type: "websearch", config: "english" });
    const { data: rows, error } = await q;
    if (error) throw error;
    const hasMore = (rows?.length ?? 0) > data.limit;
    const items = hasMore ? rows!.slice(0, data.limit) : (rows ?? []);
    const nextCursor = hasMore ? items[items.length - 1].published_at : null;
    return { items, nextCursor };
  });

export const getPublicPost = createServerFn({ method: "GET" })
  .inputValidator((d: { slug: string }) => ({ slug: d.slug }))
  .handler(async ({ data }) => {
    const sb = publicClient();
    const { data: post, error } = await sb
      .from("posts")
      .select("id, slug, title, excerpt, body, cover_url, reading_time, author_name, tags, issue_label, published_at, category_id, categories(name, slug)")
      .eq("slug", data.slug)
      .eq("status", "published")
      .maybeSingle();
    if (error) throw error;
    if (!post) return { post: null, related: [] as any[] };
    const { data: related } = await sb
      .from("posts")
      .select("id, slug, title, excerpt, reading_time, published_at")
      .eq("status", "published")
      .eq("category_id", post.category_id ?? "")
      .neq("id", post.id)
      .order("published_at", { ascending: false })
      .limit(3);
    return { post, related: related ?? [] };
  });

export const listCategories = createServerFn({ method: "GET" }).handler(async () => {
  const { data } = await publicClient().from("categories").select("*").order("name");
  return data ?? [];
});

export const listPublicEvents = createServerFn({ method: "GET" }).handler(async () => {
  const { data } = await publicClient()
    .from("events")
    .select("id, slug, title, tag, starts_at, description, cover_url, venue:venues(name, city, country)")
    .eq("status", "published")
    .order("starts_at", { ascending: true });
  return data ?? [];
});

export const getPublicEvent = createServerFn({ method: "GET" })
  .inputValidator((d: { slug: string }) => ({ slug: d.slug }))
  .handler(async ({ data }) => {
    const sb = publicClient();
    const { data: event } = await sb
      .from("events")
      .select("id, slug, title, tag, description, cover_url, starts_at, ends_at, capacity, venue:venues(name, city, country, address)")
      .eq("slug", data.slug)
      .eq("status", "published")
      .maybeSingle();
    if (!event) return { event: null, speakers: [], sponsors: [] };
    const [{ data: speakers }, { data: sponsors }] = await Promise.all([
      sb.from("event_speakers").select("role, speaker:speakers(name, title, bio, photo_url)").eq("event_id", event.id),
      sb.from("event_sponsors").select("tier, sponsor:sponsors(name, logo_url, website)").eq("event_id", event.id),
    ]);
    return { event, speakers: speakers ?? [], sponsors: sponsors ?? [] };
  });

export const listPublicFellows = createServerFn({ method: "GET" }).handler(async () => {
  const { data } = await publicClient()
    .from("fellows")
    .select("*")
    .eq("status", "published")
    .order("sort_order");
  return data ?? [];
});

export const listPublicResources = createServerFn({ method: "GET" }).handler(async () => {
  const { data } = await publicClient()
    .from("resources")
    .select("*")
    .eq("status", "published")
    .order("created_at", { ascending: false });
  return data ?? [];
});

// ---------- Authenticated: bookmarks ----------
export const listMyBookmarks = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { data } = await context.supabase
      .from("bookmarks")
      .select("post:posts(id, slug, title, excerpt, reading_time, published_at)")
      .order("created_at", { ascending: false });
    return (data ?? []).map((r) => r.post).filter(Boolean);
  });

export const toggleBookmark = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: { postId: string }) => ({ postId: d.postId }))
  .handler(async ({ data, context }) => {
    const { data: existing } = await context.supabase
      .from("bookmarks")
      .select("post_id")
      .eq("user_id", context.userId)
      .eq("post_id", data.postId)
      .maybeSingle();
    if (existing) {
      await context.supabase.from("bookmarks").delete().eq("user_id", context.userId).eq("post_id", data.postId);
      return { bookmarked: false };
    }
    await context.supabase.from("bookmarks").insert({ user_id: context.userId, post_id: data.postId });
    return { bookmarked: true };
  });

export const isBookmarked = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: { postId: string }) => ({ postId: d.postId }))
  .handler(async ({ data, context }) => {
    const { data: row } = await context.supabase
      .from("bookmarks")
      .select("post_id")
      .eq("user_id", context.userId)
      .eq("post_id", data.postId)
      .maybeSingle();
    return { bookmarked: !!row };
  });

// ---------- Admin CRUD ----------
async function ensureStaff(supabase: ReturnType<typeof publicClient>, userId: string) {
  const { data } = await supabase.from("user_roles").select("role").eq("user_id", userId).in("role", ["admin", "editor"]);
  if (!data || data.length === 0) throw new Error("Forbidden: editor or admin role required");
}

// Generic list for admin (staff sees all)
export const adminList = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: { table: "posts" | "pages" | "fellows" | "events" | "resources" | "categories" | "newsletter_subscribers" | "event_registrations" }) => ({ table: d.table }))
  .handler(async ({ data, context }): Promise<Array<Record<string, any>>> => {
    await ensureStaff(context.supabase as any, context.userId);
    const cols =
      data.table === "posts"
        ? "id, slug, title, excerpt, status, category_id, author_name, tags, reading_time, issue_label, published_at, created_at, updated_at"
        : "*";
    const { data: rows, error } = await context.supabase
      .from(data.table)
      .select(cols)
      .order("created_at", { ascending: false })
      .limit(200);
    if (error) throw error;
    return (rows ?? []) as any[];
  });

export const adminUpsertPost = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: {
    id?: string; slug?: string; title: string; excerpt?: string; body: string;
    cover_url?: string; category_id?: string | null; author_name?: string; tags?: string[];
    status?: "draft" | "review" | "published" | "archived"; issue_label?: string;
  }) => d)
  .handler(async ({ data, context }) => {
    await ensureStaff(context.supabase as any, context.userId);
    const slug = data.slug || toSlug(data.title);
    const status = data.status ?? "draft";
    let publishedAt: string | null = null;
    if (status === "published") {
      let existing: { published_at: string | null } | null = null;
      if (data.id) {
        const { data: row } = await context.supabase.from("posts").select("published_at").eq("id", data.id).maybeSingle();
        existing = row ?? null;
      }
      publishedAt = existing?.published_at ?? new Date().toISOString();
    }
    const payload: any = {
      slug, title: data.title, excerpt: data.excerpt ?? null, body: data.body,
      cover_url: data.cover_url ?? null, category_id: data.category_id ?? null,
      author_id: context.userId, author_name: data.author_name ?? null,
      tags: data.tags ?? [], reading_time: readingTime(data.body),
      status, issue_label: data.issue_label ?? null,
      published_at: publishedAt,
    };
    if (data.id) {
      const { error } = await context.supabase.from("posts").update(payload).eq("id", data.id);
      if (error) throw error;
      return { id: data.id };
    }
    const { data: row, error } = await context.supabase.from("posts").insert(payload).select("id").single();
    if (error) throw error;
    return { id: row.id };
  });

export const adminUpsertFellow = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: { id?: string; slug?: string; name: string; role?: string; region?: string; bio?: string; photo_url?: string; status?: string; sort_order?: number }) => d)
  .handler(async ({ data, context }) => {
    await ensureStaff(context.supabase as any, context.userId);
    const payload = { slug: data.slug || toSlug(data.name), name: data.name, role: data.role ?? null, region: data.region ?? null, bio: data.bio ?? null, photo_url: data.photo_url ?? null, status: (data.status ?? "published") as any, sort_order: data.sort_order ?? 0 };
    if (data.id) {
      const { error } = await context.supabase.from("fellows").update(payload).eq("id", data.id);
      if (error) throw error; return { id: data.id };
    }
    const { data: row, error } = await context.supabase.from("fellows").insert(payload).select("id").single();
    if (error) throw error; return { id: row.id };
  });

export const adminUpsertEvent = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: { id?: string; slug?: string; title: string; tag?: string; description?: string; cover_url?: string; starts_at: string; ends_at?: string; venue_id?: string | null; capacity?: number; status?: string }) => d)
  .handler(async ({ data, context }) => {
    await ensureStaff(context.supabase as any, context.userId);
    const payload: any = {
      slug: data.slug || toSlug(data.title), title: data.title, tag: data.tag ?? null,
      description: data.description ?? null, cover_url: data.cover_url ?? null,
      starts_at: data.starts_at, ends_at: data.ends_at ?? null,
      venue_id: data.venue_id ?? null, capacity: data.capacity ?? null, status: data.status ?? "draft",
    };
    if (data.id) { const { error } = await context.supabase.from("events").update(payload).eq("id", data.id); if (error) throw error; return { id: data.id }; }
    const { data: row, error } = await context.supabase.from("events").insert(payload).select("id").single();
    if (error) throw error; return { id: row.id };
  });

export const adminUpsertPage = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: { id?: string; slug?: string; title: string; body: string; meta_description?: string; status?: string }) => d)
  .handler(async ({ data, context }) => {
    await ensureStaff(context.supabase as any, context.userId);
    const payload: any = { slug: data.slug || toSlug(data.title), title: data.title, body: data.body, meta_description: data.meta_description ?? null, status: data.status ?? "draft" };
    if (data.id) { const { error } = await context.supabase.from("pages").update(payload).eq("id", data.id); if (error) throw error; return { id: data.id }; }
    const { data: row, error } = await context.supabase.from("pages").insert(payload).select("id").single();
    if (error) throw error; return { id: row.id };
  });

export const adminUpsertResource = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: { id?: string; slug?: string; title: string; description?: string; resource_type?: string; url?: string; status?: string }) => d)
  .handler(async ({ data, context }) => {
    await ensureStaff(context.supabase as any, context.userId);
    const payload: any = { slug: data.slug || toSlug(data.title), title: data.title, description: data.description ?? null, resource_type: (data.resource_type ?? "report") as any, url: data.url ?? null, status: (data.status ?? "published") as any };
    if (data.id) { const { error } = await context.supabase.from("resources").update(payload).eq("id", data.id); if (error) throw error; return { id: data.id }; }
    const { data: row, error } = await context.supabase.from("resources").insert(payload).select("id").single();
    if (error) throw error; return { id: row.id };
  });

export const adminUpsertCategory = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: { id?: string; slug?: string; name: string; description?: string }) => d)
  .handler(async ({ data, context }) => {
    await ensureStaff(context.supabase as any, context.userId);
    const payload: any = { slug: data.slug || toSlug(data.name), name: data.name, description: data.description ?? null };
    if (data.id) { const { error } = await context.supabase.from("categories").update(payload).eq("id", data.id); if (error) throw error; return { id: data.id }; }
    const { data: row, error } = await context.supabase.from("categories").insert(payload).select("id").single();
    if (error) throw error; return { id: row.id };
  });

export const adminDelete = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: { table: "posts" | "pages" | "fellows" | "events" | "resources" | "categories"; id: string }) => d)
  .handler(async ({ data, context }) => {
    await ensureStaff(context.supabase as any, context.userId);
    const { error } = await context.supabase.from(data.table).delete().eq("id", data.id);
    if (error) throw error;
    return { ok: true };
  });

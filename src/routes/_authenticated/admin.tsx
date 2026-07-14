import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { PageShell } from "@/components/site/PageShell";
import { toast } from "sonner";
import {
  adminList, adminDelete,
  adminUpsertPost, adminUpsertFellow, adminUpsertEvent, adminUpsertPage, adminUpsertResource, adminUpsertCategory,
} from "@/lib/cms.functions";
import { getMyRoles } from "@/lib/roles.functions";

export const Route = createFileRoute("/_authenticated/admin")({
  head: () => ({ meta: [{ title: "Admin — Afro Polar Institute" }] }),
  component: Admin,
});

type Tab = "posts" | "pages" | "fellows" | "events" | "resources" | "categories" | "subscribers" | "registrations";
const TABS: { id: Tab; label: string }[] = [
  { id: "posts", label: "Posts" },
  { id: "pages", label: "Pages" },
  { id: "fellows", label: "Fellows" },
  { id: "events", label: "Events" },
  { id: "resources", label: "Resources" },
  { id: "categories", label: "Categories" },
  { id: "subscribers", label: "Subscribers" },
  { id: "registrations", label: "Registrations" },
];

function Admin() {
  const rolesFn = useServerFn(getMyRoles);
  const { data: rolesData, isLoading: rolesLoading } = useQuery({ queryKey: ["my-roles"], queryFn: () => rolesFn() });
  const [tab, setTab] = useState<Tab>("posts");

  const isStaff = rolesData?.roles.some((r) => r === "admin" || r === "editor");

  if (rolesLoading) return <PageShell><div className="mx-auto max-w-6xl px-6 py-32">Loading…</div></PageShell>;
  if (!isStaff) {
    return (
      <PageShell>
        <div className="mx-auto max-w-2xl px-6 py-32 text-center">
          <h1 className="font-display text-4xl font-bold text-arctic-deep">Not authorized</h1>
          <p className="mt-4 text-arctic-deep/60">You need an editor or admin role to access this dashboard. Your user id:</p>
          <code className="mt-4 block break-all rounded bg-arctic-ice/40 p-3 text-xs">{rolesData?.userId}</code>
          <p className="mt-4 text-xs text-arctic-deep/50">Ask an admin to grant you the role, or run in the SQL editor:<br />
            <code className="text-arctic-deep/80">insert into user_roles(user_id, role) values ('{rolesData?.userId}', 'admin');</code>
          </p>
        </div>
      </PageShell>
    );
  }

  return (
    <PageShell>
      <section className="mx-auto max-w-7xl px-6 py-16">
        <header className="flex flex-col justify-between gap-6 border-b border-arctic-deep/10 pb-6 sm:flex-row sm:items-end">
          <div>
            <p className="text-[10px] font-bold uppercase tracking-[0.28em] text-aurora">Admin</p>
            <h1 className="font-display mt-2 text-4xl font-bold text-arctic-deep">Content dashboard</h1>
          </div>
          <div className="text-xs text-arctic-deep/50">Signed in as {rolesData?.userId.slice(0, 8)}…</div>
        </header>
        <nav className="mt-6 flex flex-wrap gap-2">
          {TABS.map((t) => (
            <button
              key={t.id}
              onClick={() => setTab(t.id)}
              className={`rounded-full px-4 py-2 text-xs font-bold uppercase tracking-[0.18em] transition ${
                tab === t.id ? "bg-arctic-deep text-white" : "border border-arctic-deep/15 text-arctic-deep hover:border-aurora hover:text-aurora"
              }`}
            >
              {t.label}
            </button>
          ))}
        </nav>
        <div className="mt-10">
          <ResourcePanel key={tab} tab={tab} />
        </div>
      </section>
    </PageShell>
  );
}

function ResourcePanel({ tab }: { tab: Tab }) {
  const listFn = useServerFn(adminList);
  const qc = useQueryClient();
  const { data, isLoading } = useQuery({
    queryKey: ["admin-list", tab],
    queryFn: () => listFn({ data: { table: tab as any } }),
  });
  const [editing, setEditing] = useState<any | null>(null);
  const [creating, setCreating] = useState(false);

  const canEdit = !["subscribers", "registrations"].includes(tab);

  return (
    <div>
      {canEdit && (
        <div className="mb-4 flex justify-end">
          <button
            onClick={() => { setEditing(null); setCreating(true); }}
            className="rounded-full bg-aurora px-5 py-2 text-xs font-bold uppercase tracking-widest text-arctic-deep hover:bg-arctic-deep hover:text-white"
          >
            + New
          </button>
        </div>
      )}
      {isLoading ? <p>Loading…</p> : (
        <div className="overflow-x-auto rounded-2xl border border-arctic-deep/10">
          <table className="min-w-full divide-y divide-arctic-deep/10 text-sm">
            <thead className="bg-arctic-ice/30 text-left text-[10px] font-bold uppercase tracking-[0.18em] text-arctic-deep/70">
              <tr>
                <th className="px-4 py-3">Title / Name / Email</th>
                <th className="px-4 py-3">Status / Info</th>
                <th className="px-4 py-3">Updated</th>
                {canEdit && <th className="px-4 py-3 text-right">Actions</th>}
              </tr>
            </thead>
            <tbody className="divide-y divide-arctic-deep/5">
              {(data ?? []).map((row: any) => (
                <tr key={row.id ?? row.email}>
                  <td className="px-4 py-3 font-medium text-arctic-deep">
                    {row.title ?? row.name ?? row.email ?? row.slug ?? row.id}
                  </td>
                  <td className="px-4 py-3 text-arctic-deep/60">
                    {row.status ?? row.resource_type ?? row.organization ?? row.email ?? "—"}
                  </td>
                  <td className="px-4 py-3 text-xs text-arctic-deep/50">
                    {(row.updated_at ?? row.created_at ?? "").slice(0, 10)}
                  </td>
                  {canEdit && (
                    <td className="px-4 py-3 text-right">
                      <button onClick={() => { setCreating(false); setEditing(row); }} className="text-xs font-semibold text-aurora hover:underline">Edit</button>
                      <button
                        onClick={async () => {
                          if (!confirm("Delete this row?")) return;
                          try {
                            const del = useServerFn(adminDelete);
                            await del({ data: { table: tab as any, id: row.id } });
                            qc.invalidateQueries({ queryKey: ["admin-list", tab] });
                          } catch (e: any) { toast.error(e.message); }
                        }}
                        className="ml-3 text-xs font-semibold text-red-600 hover:underline"
                      >Delete</button>
                    </td>
                  )}
                </tr>
              ))}
              {(data ?? []).length === 0 && (
                <tr><td colSpan={4} className="px-4 py-8 text-center text-arctic-deep/50">Nothing here yet.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      )}
      {(editing || creating) && (
        <EditorDrawer
          tab={tab}
          row={editing}
          onClose={() => { setEditing(null); setCreating(false); }}
          onSaved={() => { setEditing(null); setCreating(false); qc.invalidateQueries({ queryKey: ["admin-list", tab] }); }}
        />
      )}
    </div>
  );
}

function EditorDrawer({ tab, row, onClose, onSaved }: { tab: Tab; row: any | null; onClose: () => void; onSaved: () => void }) {
  const [form, setForm] = useState<any>(row ?? {});
  useEffect(() => setForm(row ?? {}), [row]);

  const upsertPost = useServerFn(adminUpsertPost);
  const upsertFellow = useServerFn(adminUpsertFellow);
  const upsertEvent = useServerFn(adminUpsertEvent);
  const upsertPage = useServerFn(adminUpsertPage);
  const upsertResource = useServerFn(adminUpsertResource);
  const upsertCategory = useServerFn(adminUpsertCategory);

  const mutation = useMutation({
    mutationFn: async (payload: any) => {
      switch (tab) {
        case "posts": return upsertPost({ data: payload });
        case "fellows": return upsertFellow({ data: payload });
        case "events": return upsertEvent({ data: payload });
        case "pages": return upsertPage({ data: payload });
        case "resources": return upsertResource({ data: payload });
        case "categories": return upsertCategory({ data: payload });
        default: throw new Error("Unsupported");
      }
    },
    onSuccess: () => { toast.success("Saved."); onSaved(); },
    onError: (e: any) => toast.error(e.message ?? "Save failed"),
  });

  function set<K extends string>(key: K, value: any) { setForm((f: any) => ({ ...f, [key]: value })); }

  return (
    <div className="fixed inset-0 z-50 flex items-stretch justify-end bg-black/40" onClick={onClose}>
      <div onClick={(e) => e.stopPropagation()} className="h-full w-full max-w-xl overflow-y-auto bg-white p-8 shadow-2xl">
        <div className="flex items-center justify-between">
          <h2 className="font-display text-2xl font-bold text-arctic-deep">{row ? "Edit" : "New"} {tab.slice(0, -1)}</h2>
          <button onClick={onClose} className="text-arctic-deep/60 hover:text-arctic-deep">✕</button>
        </div>
        <form
          className="mt-6 space-y-4"
          onSubmit={(e) => { e.preventDefault(); mutation.mutate(form); }}
        >
          {tab === "posts" && <PostFields f={form} set={set} />}
          {tab === "fellows" && <FellowFields f={form} set={set} />}
          {tab === "events" && <EventFields f={form} set={set} />}
          {tab === "pages" && <PageFields f={form} set={set} />}
          {tab === "resources" && <ResourceFields f={form} set={set} />}
          {tab === "categories" && <CategoryFields f={form} set={set} />}
          <div className="flex justify-end gap-2 pt-4">
            <button type="button" onClick={onClose} className="rounded-full border border-arctic-deep/15 px-5 py-2 text-xs font-bold uppercase tracking-widest text-arctic-deep">Cancel</button>
            <button disabled={mutation.isPending} className="rounded-full bg-arctic-deep px-5 py-2 text-xs font-bold uppercase tracking-widest text-white hover:bg-aurora hover:text-arctic-deep">{mutation.isPending ? "Saving…" : "Save"}</button>
          </div>
        </form>
      </div>
    </div>
  );
}

const inputCls = "w-full rounded-lg border border-arctic-deep/15 px-3 py-2 text-sm";
function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return <label className="block"><span className="mb-1 block text-[10px] font-bold uppercase tracking-[0.18em] text-arctic-deep/60">{label}</span>{children}</label>;
}

function PostFields({ f, set }: any) {
  return (<>
    <Field label="Title"><input required className={inputCls} value={f.title ?? ""} onChange={(e) => set("title", e.target.value)} /></Field>
    <Field label="Slug (optional)"><input className={inputCls} value={f.slug ?? ""} onChange={(e) => set("slug", e.target.value)} /></Field>
    <Field label="Excerpt"><textarea className={inputCls} rows={2} value={f.excerpt ?? ""} onChange={(e) => set("excerpt", e.target.value)} /></Field>
    <Field label="Body (markdown / text)"><textarea className={inputCls} rows={10} value={f.body ?? ""} onChange={(e) => set("body", e.target.value)} /></Field>
    <Field label="Cover URL"><input className={inputCls} value={f.cover_url ?? ""} onChange={(e) => set("cover_url", e.target.value)} /></Field>
    <Field label="Author name"><input className={inputCls} value={f.author_name ?? ""} onChange={(e) => set("author_name", e.target.value)} /></Field>
    <Field label="Issue label"><input className={inputCls} value={f.issue_label ?? ""} onChange={(e) => set("issue_label", e.target.value)} /></Field>
    <Field label="Tags (comma separated)"><input className={inputCls} value={(f.tags ?? []).join(", ")} onChange={(e) => set("tags", e.target.value.split(",").map((s: string) => s.trim()).filter(Boolean))} /></Field>
    <Field label="Status"><select className={inputCls} value={f.status ?? "draft"} onChange={(e) => set("status", e.target.value)}><option>draft</option><option>published</option><option>archived</option></select></Field>
  </>);
}
function FellowFields({ f, set }: any) {
  return (<>
    <Field label="Name"><input required className={inputCls} value={f.name ?? ""} onChange={(e) => set("name", e.target.value)} /></Field>
    <Field label="Role"><input className={inputCls} value={f.role ?? ""} onChange={(e) => set("role", e.target.value)} /></Field>
    <Field label="Region"><input className={inputCls} value={f.region ?? ""} onChange={(e) => set("region", e.target.value)} /></Field>
    <Field label="Bio"><textarea rows={4} className={inputCls} value={f.bio ?? ""} onChange={(e) => set("bio", e.target.value)} /></Field>
    <Field label="Photo URL"><input className={inputCls} value={f.photo_url ?? ""} onChange={(e) => set("photo_url", e.target.value)} /></Field>
    <Field label="Sort order"><input type="number" className={inputCls} value={f.sort_order ?? 0} onChange={(e) => set("sort_order", Number(e.target.value))} /></Field>
    <Field label="Status"><select className={inputCls} value={f.status ?? "published"} onChange={(e) => set("status", e.target.value)}><option>draft</option><option>published</option><option>archived</option></select></Field>
  </>);
}
function EventFields({ f, set }: any) {
  return (<>
    <Field label="Title"><input required className={inputCls} value={f.title ?? ""} onChange={(e) => set("title", e.target.value)} /></Field>
    <Field label="Tag (e.g. Symposium)"><input className={inputCls} value={f.tag ?? ""} onChange={(e) => set("tag", e.target.value)} /></Field>
    <Field label="Starts at (ISO)"><input required className={inputCls} value={f.starts_at ?? ""} onChange={(e) => set("starts_at", e.target.value)} placeholder="2026-03-12T09:00:00Z" /></Field>
    <Field label="Ends at (ISO, optional)"><input className={inputCls} value={f.ends_at ?? ""} onChange={(e) => set("ends_at", e.target.value)} /></Field>
    <Field label="Description"><textarea rows={4} className={inputCls} value={f.description ?? ""} onChange={(e) => set("description", e.target.value)} /></Field>
    <Field label="Cover URL"><input className={inputCls} value={f.cover_url ?? ""} onChange={(e) => set("cover_url", e.target.value)} /></Field>
    <Field label="Capacity"><input type="number" className={inputCls} value={f.capacity ?? ""} onChange={(e) => set("capacity", e.target.value ? Number(e.target.value) : undefined)} /></Field>
    <Field label="Status"><select className={inputCls} value={f.status ?? "draft"} onChange={(e) => set("status", e.target.value)}><option>draft</option><option>published</option><option>archived</option></select></Field>
  </>);
}
function PageFields({ f, set }: any) {
  return (<>
    <Field label="Title"><input required className={inputCls} value={f.title ?? ""} onChange={(e) => set("title", e.target.value)} /></Field>
    <Field label="Slug"><input className={inputCls} value={f.slug ?? ""} onChange={(e) => set("slug", e.target.value)} /></Field>
    <Field label="Meta description"><textarea rows={2} className={inputCls} value={f.meta_description ?? ""} onChange={(e) => set("meta_description", e.target.value)} /></Field>
    <Field label="Body"><textarea rows={12} className={inputCls} value={f.body ?? ""} onChange={(e) => set("body", e.target.value)} /></Field>
    <Field label="Status"><select className={inputCls} value={f.status ?? "draft"} onChange={(e) => set("status", e.target.value)}><option>draft</option><option>published</option><option>archived</option></select></Field>
  </>);
}
function ResourceFields({ f, set }: any) {
  return (<>
    <Field label="Title"><input required className={inputCls} value={f.title ?? ""} onChange={(e) => set("title", e.target.value)} /></Field>
    <Field label="Description"><textarea rows={3} className={inputCls} value={f.description ?? ""} onChange={(e) => set("description", e.target.value)} /></Field>
    <Field label="URL"><input className={inputCls} value={f.url ?? ""} onChange={(e) => set("url", e.target.value)} /></Field>
    <Field label="Type"><select className={inputCls} value={f.resource_type ?? "report"} onChange={(e) => set("resource_type", e.target.value)}><option>report</option><option>brief</option><option>dataset</option><option>video</option><option>link</option></select></Field>
  </>);
}
function CategoryFields({ f, set }: any) {
  return (<>
    <Field label="Name"><input required className={inputCls} value={f.name ?? ""} onChange={(e) => set("name", e.target.value)} /></Field>
    <Field label="Slug"><input className={inputCls} value={f.slug ?? ""} onChange={(e) => set("slug", e.target.value)} /></Field>
    <Field label="Description"><textarea rows={2} className={inputCls} value={f.description ?? ""} onChange={(e) => set("description", e.target.value)} /></Field>
  </>);
}

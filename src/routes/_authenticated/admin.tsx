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
import {
  listUsersWithRoles, grantRole, revokeRole,
  listSubscribers, setSubscriberStatus, deleteSubscriber,
} from "@/lib/admin.functions";
import { getEmailSettings, sendTestEmail, testMailchimpConnection } from "@/lib/email-settings.functions";

export const Route = createFileRoute("/_authenticated/admin")({
  head: () => ({ meta: [{ title: "Admin — Afro Polar Institute" }] }),
  component: Admin,
});

type Tab = "posts" | "pages" | "fellows" | "events" | "resources" | "categories" | "subscribers" | "registrations" | "roles" | "settings";
const BASE_TABS: { id: Tab; label: string }[] = [
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
  const isAdmin = rolesData?.roles.includes("admin");
  const tabs = isAdmin
    ? [...BASE_TABS, { id: "roles" as Tab, label: "Roles" }, { id: "settings" as Tab, label: "Settings" }]
    : BASE_TABS;

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
          <div className="text-xs text-arctic-deep/50">Signed in as {rolesData?.userId.slice(0, 8)}… · {rolesData?.roles.join(", ") || "no roles"}</div>
        </header>
        <nav className="mt-6 flex flex-wrap gap-2">
          {tabs.map((t) => (
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
          {tab === "roles" ? <RolesPanel currentUserId={rolesData!.userId} />
            : tab === "settings" ? <SettingsPanel />
            : tab === "subscribers" ? <SubscribersPanel />
            : <ResourcePanel key={tab} tab={tab} />}
        </div>
      </section>
    </PageShell>
  );
}

function StatusBadge({ status }: { status?: string }) {
  const s = status ?? "—";
  const cls =
    s === "published" ? "bg-aurora/20 text-arctic-deep"
    : s === "review" ? "bg-golden/20 text-arctic-deep"
    : s === "draft" ? "bg-arctic-deep/10 text-arctic-deep/70"
    : s === "archived" ? "bg-red-100 text-red-700"
    : s === "confirmed" ? "bg-aurora/20 text-arctic-deep"
    : s === "pending" ? "bg-golden/20 text-arctic-deep"
    : s === "unsubscribed" ? "bg-red-100 text-red-700"
    : "bg-arctic-deep/5 text-arctic-deep/60";
  return <span className={`inline-block rounded-full px-2 py-0.5 text-[10px] font-bold uppercase tracking-widest ${cls}`}>{s}</span>;
}

function ResourcePanel({ tab }: { tab: Tab }) {
  const listFn = useServerFn(adminList);
  const deleteFn = useServerFn(adminDelete);
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
                    {row.status ? <StatusBadge status={row.status} /> : (row.resource_type ?? row.organization ?? row.email ?? "—")}
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
                            await deleteFn({ data: { table: tab as any, id: row.id } });
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

function SubscribersPanel() {
  const listFn = useServerFn(listSubscribers);
  const setStatusFn = useServerFn(setSubscriberStatus);
  const deleteFn = useServerFn(deleteSubscriber);
  const qc = useQueryClient();
  const { data, isLoading } = useQuery({ queryKey: ["admin-subscribers"], queryFn: () => listFn() });
  const [filter, setFilter] = useState<"all" | "pending" | "confirmed" | "unsubscribed">("all");

  const rows = (data ?? []).filter((r: any) => filter === "all" ? true : r.status === filter);

  async function update(id: string, status: "pending" | "confirmed" | "unsubscribed") {
    try {
      await setStatusFn({ data: { id, status } });
      qc.invalidateQueries({ queryKey: ["admin-subscribers"] });
    } catch (e: any) { toast.error(e.message); }
  }

  function exportCsv() {
    const list = rows;
    const header = ["email", "name", "status", "confirmed_at", "created_at"];
    const escape = (v: any) => {
      const s = v == null ? "" : String(v);
      return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
    };
    const csv = [header.join(","), ...list.map((r: any) => header.map((k) => escape(r[k])).join(","))].join("\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `subscribers-${filter}-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  }

  const counts = (data ?? []).reduce<Record<string, number>>((acc: Record<string, number>, r: any) => {
    acc[r.status] = (acc[r.status] ?? 0) + 1; return acc;
  }, {});

  return (
    <div>
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap gap-2">
          {(["all", "pending", "confirmed", "unsubscribed"] as const).map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`rounded-full px-3 py-1 text-[10px] font-bold uppercase tracking-widest ${
                filter === f ? "bg-arctic-deep text-white" : "border border-arctic-deep/15 text-arctic-deep/70"
              }`}
            >
              {f} {f !== "all" && counts[f] ? `(${counts[f]})` : f === "all" && data ? `(${data.length})` : ""}
            </button>
          ))}
        </div>
        <button onClick={exportCsv} className="rounded-full bg-aurora px-5 py-2 text-xs font-bold uppercase tracking-widest text-arctic-deep hover:bg-arctic-deep hover:text-white">
          Export CSV
        </button>
      </div>
      {isLoading ? <p>Loading…</p> : (
        <div className="overflow-x-auto rounded-2xl border border-arctic-deep/10">
          <table className="min-w-full divide-y divide-arctic-deep/10 text-sm">
            <thead className="bg-arctic-ice/30 text-left text-[10px] font-bold uppercase tracking-[0.18em] text-arctic-deep/70">
              <tr>
                <th className="px-4 py-3">Email</th>
                <th className="px-4 py-3">Name</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3">Signed up</th>
                <th className="px-4 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-arctic-deep/5">
              {rows.map((r: any) => (
                <tr key={r.id}>
                  <td className="px-4 py-3 font-medium text-arctic-deep">{r.email}</td>
                  <td className="px-4 py-3 text-arctic-deep/60">{r.name ?? "—"}</td>
                  <td className="px-4 py-3"><StatusBadge status={r.status} /></td>
                  <td className="px-4 py-3 text-xs text-arctic-deep/50">{(r.created_at ?? "").slice(0, 10)}</td>
                  <td className="px-4 py-3 text-right">
                    {r.status !== "confirmed" && (
                      <button onClick={() => update(r.id, "confirmed")} className="text-xs font-semibold text-aurora hover:underline">Confirm</button>
                    )}
                    {r.status !== "unsubscribed" && (
                      <button onClick={() => update(r.id, "unsubscribed")} className="ml-3 text-xs font-semibold text-arctic-deep/70 hover:underline">Unsubscribe</button>
                    )}
                    <button
                      onClick={async () => {
                        if (!confirm(`Permanently delete ${r.email}?`)) return;
                        try { await deleteFn({ data: { id: r.id } }); qc.invalidateQueries({ queryKey: ["admin-subscribers"] }); }
                        catch (e: any) { toast.error(e.message); }
                      }}
                      className="ml-3 text-xs font-semibold text-red-600 hover:underline"
                    >Delete</button>
                  </td>
                </tr>
              ))}
              {rows.length === 0 && (
                <tr><td colSpan={5} className="px-4 py-8 text-center text-arctic-deep/50">No subscribers.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

function RolesPanel({ currentUserId }: { currentUserId: string }) {
  const listFn = useServerFn(listUsersWithRoles);
  const grantFn = useServerFn(grantRole);
  const revokeFn = useServerFn(revokeRole);
  const qc = useQueryClient();
  const { data, isLoading, error } = useQuery({ queryKey: ["admin-users"], queryFn: () => listFn() });
  const [query, setQuery] = useState("");

  async function toggle(userId: string, role: "admin" | "editor", currentlyHas: boolean) {
    try {
      if (currentlyHas) await revokeFn({ data: { user_id: userId, role } });
      else await grantFn({ data: { user_id: userId, role } });
      qc.invalidateQueries({ queryKey: ["admin-users"] });
    } catch (e: any) { toast.error(e.message); }
  }

  const filtered = (data ?? []).filter((u: any) =>
    !query.trim() || u.email?.toLowerCase().includes(query.toLowerCase()) || u.id.includes(query),
  );

  if (error) return <p className="text-red-600">{(error as any).message}</p>;

  return (
    <div>
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search by email or user id…"
          className="w-full max-w-sm rounded-full border border-arctic-deep/15 px-4 py-2 text-sm"
        />
        <p className="text-xs text-arctic-deep/50">Toggle admin or editor access. Members have no elevated access.</p>
      </div>
      {isLoading ? <p>Loading…</p> : (
        <div className="overflow-x-auto rounded-2xl border border-arctic-deep/10">
          <table className="min-w-full divide-y divide-arctic-deep/10 text-sm">
            <thead className="bg-arctic-ice/30 text-left text-[10px] font-bold uppercase tracking-[0.18em] text-arctic-deep/70">
              <tr>
                <th className="px-4 py-3">User</th>
                <th className="px-4 py-3">Roles</th>
                <th className="px-4 py-3">Last sign in</th>
                <th className="px-4 py-3 text-right">Assign</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-arctic-deep/5">
              {filtered.map((u: any) => {
                const isAdmin = u.roles.includes("admin");
                const isEditor = u.roles.includes("editor");
                const isSelf = u.id === currentUserId;
                return (
                  <tr key={u.id}>
                    <td className="px-4 py-3">
                      <div className="font-medium text-arctic-deep">{u.email ?? "(no email)"}</div>
                      <div className="text-[10px] text-arctic-deep/40">{u.id}</div>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex flex-wrap gap-1">
                        {u.roles.length === 0 && <span className="text-xs text-arctic-deep/40">member</span>}
                        {u.roles.map((r: string) => <StatusBadge key={r} status={r} />)}
                      </div>
                    </td>
                    <td className="px-4 py-3 text-xs text-arctic-deep/50">{(u.last_sign_in_at ?? "").slice(0, 10) || "—"}</td>
                    <td className="px-4 py-3 text-right">
                      <button
                        onClick={() => toggle(u.id, "admin", isAdmin)}
                        disabled={isSelf && isAdmin}
                        className={`rounded-full px-3 py-1 text-[10px] font-bold uppercase tracking-widest ${
                          isAdmin ? "bg-arctic-deep text-white" : "border border-arctic-deep/15 text-arctic-deep hover:border-aurora hover:text-aurora"
                        } ${isSelf && isAdmin ? "opacity-50" : ""}`}
                        title={isSelf && isAdmin ? "You cannot revoke your own admin" : ""}
                      >
                        {isAdmin ? "Admin ✓" : "Make admin"}
                      </button>
                      <button
                        onClick={() => toggle(u.id, "editor", isEditor)}
                        className={`ml-2 rounded-full px-3 py-1 text-[10px] font-bold uppercase tracking-widest ${
                          isEditor ? "bg-aurora text-arctic-deep" : "border border-arctic-deep/15 text-arctic-deep hover:border-aurora hover:text-aurora"
                        }`}
                      >
                        {isEditor ? "Editor ✓" : "Make editor"}
                      </button>
                    </td>
                  </tr>
                );
              })}
              {filtered.length === 0 && (
                <tr><td colSpan={4} className="px-4 py-8 text-center text-arctic-deep/50">No users match.</td></tr>
              )}
            </tbody>
          </table>
        </div>
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

  function submitWithStatus(status?: string) {
    mutation.mutate(status ? { ...form, status } : form);
  }

  const showWorkflow = tab === "posts" || tab === "pages";

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
          {showWorkflow && (
            <div className="rounded-xl border border-arctic-deep/10 bg-arctic-ice/20 p-4">
              <p className="text-[10px] font-bold uppercase tracking-[0.24em] text-arctic-deep/60">Workflow</p>
              <p className="mt-1 text-xs text-arctic-deep/60">Current: <StatusBadge status={form.status ?? "draft"} /></p>
              <div className="mt-3 flex flex-wrap gap-2">
                <button type="button" onClick={() => submitWithStatus("draft")} disabled={mutation.isPending}
                  className="rounded-full border border-arctic-deep/15 px-4 py-1.5 text-[10px] font-bold uppercase tracking-widest text-arctic-deep hover:border-aurora hover:text-aurora">
                  Save as draft
                </button>
                <button type="button" onClick={() => submitWithStatus("review")} disabled={mutation.isPending}
                  className="rounded-full bg-golden px-4 py-1.5 text-[10px] font-bold uppercase tracking-widest text-arctic-deep hover:brightness-110">
                  Submit for review
                </button>
                <button type="button" onClick={() => submitWithStatus("published")} disabled={mutation.isPending}
                  className="rounded-full bg-aurora px-4 py-1.5 text-[10px] font-bold uppercase tracking-widest text-arctic-deep hover:bg-arctic-deep hover:text-white">
                  Publish
                </button>
                <button type="button" onClick={() => submitWithStatus("archived")} disabled={mutation.isPending}
                  className="rounded-full border border-red-200 px-4 py-1.5 text-[10px] font-bold uppercase tracking-widest text-red-700 hover:bg-red-50">
                  Archive
                </button>
              </div>
            </div>
          )}
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

const workflowOptions = ["draft", "review", "published", "archived"] as const;

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
    <Field label="Status"><select className={inputCls} value={f.status ?? "draft"} onChange={(e) => set("status", e.target.value)}>{workflowOptions.map((s) => <option key={s}>{s}</option>)}</select></Field>
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
    <Field label="Status"><select className={inputCls} value={f.status ?? "draft"} onChange={(e) => set("status", e.target.value)}>{workflowOptions.map((s) => <option key={s}>{s}</option>)}</select></Field>
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

function SettingsPanel() {
  const settingsFn = useServerFn(getEmailSettings);
  const testFn = useServerFn(sendTestEmail);
  const mailchimpTestFn = useServerFn(testMailchimpConnection);
  const qc = useQueryClient();
  const { data, isLoading } = useQuery({ queryKey: ["email-settings"], queryFn: () => settingsFn() });
  const [testTo, setTestTo] = useState("");
  const [testing, setTesting] = useState(false);
  const [pingingMc, setPingingMc] = useState(false);

  async function runTest() {
    setTesting(true);
    try {
      const res = await testFn({ data: { to: testTo || undefined } });
      toast.success(`Test email sent to ${res.sentTo}`);
    } catch (e: any) {
      toast.error(e?.message ?? "Test send failed");
    } finally {
      setTesting(false);
    }
  }

  async function pingMailchimp() {
    setPingingMc(true);
    try {
      const res = await mailchimpTestFn();
      if (res.ok) toast.success(`Mailchimp OK — “${res.audienceName}” (${res.memberCount ?? 0} members)`);
      else toast.error(res.error ?? "Mailchimp check failed");
    } catch (e: any) {
      toast.error(e?.message ?? "Mailchimp check failed");
    } finally {
      setPingingMc(false);
    }
  }

  if (isLoading || !data) return <div className="text-sm text-arctic-deep/60">Loading settings…</div>;

  const chip = (ok: boolean, okLabel = "Configured", missingLabel = "Missing") => (
    <span className={`inline-block rounded-full px-2 py-0.5 text-[10px] font-bold uppercase tracking-widest ${ok ? "bg-aurora/20 text-arctic-deep" : "bg-red-100 text-red-700"}`}>
      {ok ? okLabel : missingLabel}
    </span>
  );

  return (
    <div className="space-y-8">
      <div className="rounded-2xl border border-arctic-deep/10 bg-arctic-ice/20 p-5 text-sm text-arctic-deep/75">
        <p className="font-semibold text-arctic-deep">About credentials</p>
        <p className="mt-2">
          Email provider credentials (Resend API key, Mailchimp API key & audience, sender address) are stored as
          encrypted environment secrets and cannot be edited from this dashboard. Use the buttons below to review
          what's currently configured and to send a test message. To change a value, open
          <span className="mx-1 font-mono text-xs">Cloud → Secrets</span>
          in the Lovable editor and update / re-add the corresponding key, then re-publish.
        </p>
        <p className="mt-2">
          Every email sent from the site is automatically BCC'd to <span className="font-semibold">{data.archive.bcc}</span>{data.archive.isDefault ? " (default)" : " (via EMAIL_BCC)"}.
        </p>
      </div>

      <section className="rounded-2xl border border-arctic-deep/10 bg-white/70 p-6">
        <header className="flex items-center justify-between">
          <h2 className="font-display text-xl font-bold text-arctic-deep">Resend (transactional email)</h2>
          {chip(data.resend.apiKeyConfigured)}
        </header>
        <dl className="mt-4 grid gap-3 text-sm sm:grid-cols-2">
          <div>
            <dt className="text-xs font-bold uppercase tracking-widest text-arctic-deep/50">API key</dt>
            <dd className="mt-1 font-mono text-arctic-deep/80">{data.resend.apiKeyPreview ?? "—"}</dd>
          </div>
          <div>
            <dt className="text-xs font-bold uppercase tracking-widest text-arctic-deep/50">From address</dt>
            <dd className="mt-1 text-arctic-deep/80">
              {data.resend.from}
              {data.resend.fromIsDefault && (
                <span className="ml-2 text-[10px] font-bold uppercase tracking-widest text-golden">Default (test-only)</span>
              )}
            </dd>
          </div>
        </dl>
        {data.resend.fromIsDefault && (
          <p className="mt-3 text-xs text-arctic-deep/60">
            The default sender <code className="font-mono">onboarding@resend.dev</code> can only deliver to your own verified Resend account.
            Verify a domain in Resend, then set <code className="font-mono">RESEND_FROM</code> to something like <code className="font-mono">Afro Polar Institute &lt;hello@afropolar.org&gt;</code>.
          </p>
        )}
        <div className="mt-5 flex flex-col gap-3 sm:flex-row sm:items-center">
          <input
            type="email"
            value={testTo}
            onChange={(e) => setTestTo(e.target.value)}
            placeholder={data.archive.bcc}
            className="w-full rounded-full border border-arctic-deep/15 bg-white px-4 py-2 text-sm outline-none focus:border-aurora sm:max-w-xs"
          />
          <button
            onClick={runTest}
            disabled={testing || !data.resend.apiKeyConfigured}
            className="rounded-full bg-arctic-deep px-5 py-2 text-xs font-bold uppercase tracking-[0.18em] text-white transition hover:bg-aurora hover:text-arctic-deep disabled:opacity-50"
          >
            {testing ? "Sending…" : "Send test email"}
          </button>
          <button
            onClick={() => qc.invalidateQueries({ queryKey: ["email-settings"] })}
            className="text-xs font-bold uppercase tracking-[0.18em] text-arctic-deep/60 hover:text-aurora"
          >
            Refresh
          </button>
        </div>
      </section>

      <section className="rounded-2xl border border-arctic-deep/10 bg-white/70 p-6">
        <header className="flex items-center justify-between">
          <h2 className="font-display text-xl font-bold text-arctic-deep">Mailchimp (audience sync)</h2>
          {chip(
            data.mailchimp.apiKeyConfigured && !!data.mailchimp.audienceId && !!data.mailchimp.serverPrefix,
            "Ready",
            "Incomplete",
          )}
        </header>
        <dl className="mt-4 grid gap-3 text-sm sm:grid-cols-3">
          <div>
            <dt className="text-xs font-bold uppercase tracking-widest text-arctic-deep/50">API key</dt>
            <dd className="mt-1 font-mono text-arctic-deep/80">{data.mailchimp.apiKeyPreview ?? "—"}</dd>
          </div>
          <div>
            <dt className="text-xs font-bold uppercase tracking-widest text-arctic-deep/50">Audience ID</dt>
            <dd className="mt-1 font-mono text-arctic-deep/80">{data.mailchimp.audienceId ?? "—"}</dd>
          </div>
          <div>
            <dt className="text-xs font-bold uppercase tracking-widest text-arctic-deep/50">Server prefix</dt>
            <dd className="mt-1 font-mono text-arctic-deep/80">{data.mailchimp.serverPrefix ?? "—"}</dd>
          </div>
        </dl>
        <p className="mt-3 text-xs text-arctic-deep/60">
          Confirmed newsletter subscribers are mirrored into your Mailchimp audience automatically with the
          <span className="mx-1 font-mono">latitude-brief</span> tag.
        </p>
        <div className="mt-5">
          <button
            onClick={pingMailchimp}
            disabled={pingingMc}
            className="rounded-full border border-arctic-deep/20 px-5 py-2 text-xs font-bold uppercase tracking-[0.18em] text-arctic-deep transition hover:border-aurora hover:text-aurora disabled:opacity-50"
          >
            {pingingMc ? "Checking…" : "Test Mailchimp connection"}
          </button>
        </div>
      </section>
    </div>
  );
}

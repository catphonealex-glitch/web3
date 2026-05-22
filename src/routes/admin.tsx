import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth";
import { toast } from "sonner";
import { Shield, Trash2, Ban, Check, Tag as TagIcon, Flag, FolderOpen, MessageSquare } from "lucide-react";

export const Route = createFileRoute("/admin")({
  component: AdminPage,
});

type Tab = "reports" | "projects" | "comments" | "tags" | "users";

function AdminPage() {
  const { user, isStaff, loading } = useAuth();
  const navigate = useNavigate();
  const [tab, setTab] = useState<Tab>("reports");

  useEffect(() => {
    if (!loading && (!user || !isStaff)) navigate({ to: "/" });
  }, [user, isStaff, loading, navigate]);

  if (loading) return <main className="max-w-6xl mx-auto px-4 py-10 text-muted-foreground">Loading…</main>;
  if (!isStaff) return null;

  return (
    <main className="max-w-6xl mx-auto px-4 py-10">
      <div className="flex items-center gap-3 mb-2">
        <div className="h-11 w-11 rounded-xl bg-cta flex items-center justify-center shadow-neon">
          <Shield className="h-5 w-5 text-primary-foreground" />
        </div>
        <div>
          <p className="small-caps text-xs text-muted-foreground">Editor's Desk</p>
          <h1 className="font-display text-3xl">Moderation panel</h1>
        </div>
      </div>
      <p className="text-sm text-muted-foreground font-serif-italic mb-3">Manage content, tags, and users.</p>
      <div className="rule-double mb-6" />

      <div className="flex flex-wrap gap-1.5 mb-6 p-1 paper rounded-sm w-fit">
        <TabBtn active={tab === "reports"} onClick={() => setTab("reports")} icon={<Flag className="h-4 w-4" />}>Reports</TabBtn>
        <TabBtn active={tab === "projects"} onClick={() => setTab("projects")} icon={<FolderOpen className="h-4 w-4" />}>Projects</TabBtn>
        <TabBtn active={tab === "comments"} onClick={() => setTab("comments")} icon={<MessageSquare className="h-4 w-4" />}>Comments</TabBtn>
        <TabBtn active={tab === "tags"} onClick={() => setTab("tags")} icon={<TagIcon className="h-4 w-4" />}>Tags</TabBtn>
        <TabBtn active={tab === "users"} onClick={() => setTab("users")} icon={<Ban className="h-4 w-4" />}>Users</TabBtn>
      </div>

      {tab === "reports" && <Reports />}
      {tab === "projects" && <Projects />}
      {tab === "comments" && <Comments />}
      {tab === "tags" && <Tags />}
      {tab === "users" && <Users />}
    </main>
  );
}

function TabBtn({ active, onClick, icon, children }: { active: boolean; onClick: () => void; icon: React.ReactNode; children: React.ReactNode }) {
  return (
    <button
      onClick={onClick}
      className={`px-3 py-2 rounded-lg text-sm font-medium inline-flex items-center gap-1.5 transition ${
        active ? "bg-cta text-primary-foreground shadow-neon" : "text-muted-foreground hover:text-foreground hover:bg-secondary"
      }`}
    >
      {icon}{children}
    </button>
  );
}

function Reports() {
  const [items, setItems] = useState<any[]>([]);
  const load = async () => {
    const { data } = await supabase.from("reports").select("*").order("created_at", { ascending: false });
    setItems(data || []);
  };
  useEffect(() => { load(); }, []);

  const resolve = async (id: string) => {
    await supabase.from("reports").update({ status: "resolved" }).eq("id", id);
    toast.success("Resolved"); load();
  };
  const removeReport = async (id: string) => {
    await supabase.from("reports").delete().eq("id", id);
    load();
  };
  const removeTarget = async (r: any) => {
    if (!confirm(`Delete this ${r.target_type}?`)) return;
    const table = r.target_type === "comment" ? "comments" : "projects";
    await supabase.from(table).delete().eq("id", r.target_id);
    await supabase.from("reports").update({ status: "actioned" }).eq("id", r.id);
    toast.success("Removed"); load();
  };

  return (
    <div className="space-y-3">
      {items.length === 0 && <p className="text-muted-foreground">No reports.</p>}
      {items.map((r) => (
        <div key={r.id} className="bg-card border border-border rounded-xl p-4">
          <div className="flex items-start justify-between gap-3">
            <div>
              <span className={`text-xs px-2 py-0.5 rounded-full ${r.status === "open" ? "bg-destructive/20 text-destructive" : "bg-secondary text-muted-foreground"}`}>
                {r.status}
              </span>
              <p className="font-medium mt-1.5">{r.target_type} · <Link to={r.target_type === "comment" ? "/" : "/projects/$id"} params={{ id: r.target_id }} className="text-primary hover:underline font-mono text-xs">{r.target_id.slice(0, 8)}…</Link></p>
              <p className="text-sm text-muted-foreground mt-1">{r.reason}</p>
              <p className="text-xs text-muted-foreground mt-1">{new Date(r.created_at).toLocaleString()}</p>
            </div>
            <div className="flex gap-1.5 shrink-0">
              <button onClick={() => removeTarget(r)} className="px-2.5 py-1.5 rounded-lg bg-destructive/20 text-destructive text-xs hover:bg-destructive/30 inline-flex items-center gap-1"><Trash2 className="h-3.5 w-3.5" /> Remove</button>
              <button onClick={() => resolve(r.id)} className="px-2.5 py-1.5 rounded-lg border border-border text-xs hover:bg-secondary inline-flex items-center gap-1"><Check className="h-3.5 w-3.5" /> Resolve</button>
              <button onClick={() => removeReport(r.id)} className="px-2.5 py-1.5 rounded-lg border border-border text-xs hover:bg-secondary">Dismiss</button>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

function Projects() {
  const [items, setItems] = useState<any[]>([]);
  const load = async () => {
    const { data } = await supabase.from("projects").select("id, title, status, created_at, profiles(display_name)").order("created_at", { ascending: false }).limit(100);
    setItems(data || []);
  };
  useEffect(() => { load(); }, []);
  const del = async (id: string) => {
    if (!confirm("Delete project?")) return;
    await supabase.from("projects").delete().eq("id", id);
    toast.success("Deleted"); load();
  };
  return (
    <div className="bg-card border border-border rounded-xl divide-y divide-border">
      {items.map((p) => (
        <div key={p.id} className="p-3 flex items-center justify-between gap-3">
          <Link to="/projects/$id" params={{ id: p.id }} className="flex-1 min-w-0">
            <div className="font-medium truncate hover:text-primary">{p.title}</div>
            <div className="text-xs text-muted-foreground">{p.profiles?.display_name} · {p.status}</div>
          </Link>
          <button onClick={() => del(p.id)} className="p-2 rounded-lg hover:bg-destructive/20 text-destructive"><Trash2 className="h-4 w-4" /></button>
        </div>
      ))}
    </div>
  );
}

function Comments() {
  const [items, setItems] = useState<any[]>([]);
  const load = async () => {
    const { data } = await supabase.from("comments").select("id, body, created_at, project_id, profiles(display_name)").order("created_at", { ascending: false }).limit(100);
    setItems(data || []);
  };
  useEffect(() => { load(); }, []);
  const del = async (id: string) => {
    await supabase.from("comments").delete().eq("id", id);
    load();
  };
  return (
    <div className="bg-card border border-border rounded-xl divide-y divide-border">
      {items.map((c) => (
        <div key={c.id} className="p-3 flex items-start justify-between gap-3">
          <div className="flex-1 min-w-0">
            <div className="text-xs text-muted-foreground">{c.profiles?.display_name} · <Link to="/projects/$id" params={{ id: c.project_id }} className="hover:text-primary">view project</Link></div>
            <div className="text-sm mt-1 line-clamp-2">{c.body}</div>
          </div>
          <button onClick={() => del(c.id)} className="p-2 rounded-lg hover:bg-destructive/20 text-destructive shrink-0"><Trash2 className="h-4 w-4" /></button>
        </div>
      ))}
    </div>
  );
}

function Tags() {
  const [items, setItems] = useState<any[]>([]);
  const load = async () => {
    const { data } = await supabase.from("tags").select("*").order("name");
    setItems(data || []);
  };
  useEffect(() => { load(); }, []);
  const del = async (id: string) => {
    await supabase.from("tags").delete().eq("id", id);
    load();
  };
  return (
    <div className="flex flex-wrap gap-2">
      {items.map((t) => (
        <span key={t.id} className="inline-flex items-center gap-1 bg-card border border-border rounded-full px-3 py-1 text-sm">
          #{t.name}
          <button onClick={() => del(t.id)} className="text-muted-foreground hover:text-destructive ml-1"><Trash2 className="h-3 w-3" /></button>
        </span>
      ))}
      {items.length === 0 && <p className="text-muted-foreground">No tags.</p>}
    </div>
  );
}

function Users() {
  const { isAdmin } = useAuth();
  const [items, setItems] = useState<any[]>([]);
  const [roles, setRoles] = useState<Record<string, string[]>>({});
  const load = async () => {
    const { data } = await supabase.from("profiles").select("*").order("created_at", { ascending: false }).limit(100);
    setItems(data || []);
    const { data: rs } = await supabase.from("user_roles").select("user_id, role_name");
    const map: Record<string, string[]> = {};
    (rs || []).forEach((r: any) => { (map[r.user_id] ||= []).push(r.role_name); });
    setRoles(map);
  };
  useEffect(() => { load(); }, []);

  const ban = async (id: string, banned: boolean) => {
    await supabase.from("profiles").update({ is_banned: banned }).eq("id", id);
    toast.success(banned ? "User banned" : "User unbanned");
    load();
  };

  const grantMod = async (id: string) => {
    await supabase.from("user_roles").insert({ user_id: id, role_name: "moderator" });
    toast.success("Granted moderator"); load();
  };
  const revokeMod = async (id: string) => {
    await supabase.from("user_roles").delete().eq("user_id", id).eq("role_name", "moderator");
    load();
  };

  return (
    <div className="bg-card border border-border rounded-xl divide-y divide-border">
      {items.map((u) => {
        const r = roles[u.id] || [];
        return (
          <div key={u.id} className="p-3 flex items-center justify-between gap-3">
            <Link to="/profile/$id" params={{ id: u.id }} className="flex-1 min-w-0">
              <div className="font-medium truncate hover:text-primary inline-flex items-center gap-2">
                {u.display_name}
                {r.includes("admin") && <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-cta text-primary-foreground">A</span>}
                {r.includes("moderator") && <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-accent/20 text-accent">M</span>}
                {u.is_banned && <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-destructive/20 text-destructive">Banned</span>}
              </div>
              <div className="text-xs text-muted-foreground">Joined {new Date(u.created_at).toLocaleDateString()}</div>
            </Link>
            <div className="flex gap-1.5 shrink-0">
              {isAdmin && !r.includes("admin") && (
                r.includes("moderator")
                  ? <button onClick={() => revokeMod(u.id)} className="px-2.5 py-1.5 rounded-lg border border-border text-xs hover:bg-secondary">Revoke mod</button>
                  : <button onClick={() => grantMod(u.id)} className="px-2.5 py-1.5 rounded-lg border border-border text-xs hover:bg-secondary">Make mod</button>
              )}
              {!r.includes("admin") && (
                <button onClick={() => ban(u.id, !u.is_banned)} className={`px-2.5 py-1.5 rounded-lg text-xs inline-flex items-center gap-1 ${u.is_banned ? "border border-border hover:bg-secondary" : "bg-destructive/20 text-destructive hover:bg-destructive/30"}`}>
                  <Ban className="h-3.5 w-3.5" /> {u.is_banned ? "Unban" : "Ban"}
                </button>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}

import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth";
import { toast } from "sonner";
import { ProjectCard } from "@/components/ProjectCard";
import { Pencil, X, Flag } from "lucide-react";
import { ReportDialog, type ReportTarget } from "@/components/ReportDialog";

export const Route = createFileRoute("/profile/$id")({
  component: ProfilePage,
});

interface Profile {
  id: string;
  display_name: string;
  bio: string;
  avatar_url: string | null;
  is_banned: boolean;
  created_at: string;
}

function ProfilePage() {
  const { id } = Route.useParams();
  const { user, refresh } = useAuth();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [projects, setProjects] = useState<any[]>([]);
  const [roles, setRoles] = useState<string[]>([]);
  const [editing, setEditing] = useState(false);
  const [name, setName] = useState("");
  const [bio, setBio] = useState("");
  const [reportTarget, setReportTarget] = useState<ReportTarget>(null);

  const isMe = user?.id === id;

  const load = async () => {
    const { data } = await supabase.from("profiles").select("*").eq("id", id).maybeSingle();
    setProfile(data as Profile);
    setName(data?.display_name || "");
    setBio(data?.bio || "");
    const { data: rs } = await supabase.from("user_roles").select("role").eq("user_id", id);
    setRoles((rs || []).map((r: any) => r.role));
    const { data: ps } = await supabase
      .from("projects")
      .select("id, title, description, status, created_at, media_url, profiles(display_name), project_tags(tags(name, slug))")
      .eq("author_id", id)
      .order("created_at", { ascending: false });
    setProjects(ps || []);
  };

  useEffect(() => { load(); /* eslint-disable-next-line */ }, [id]);

  const save = async () => {
    const { error } = await supabase.from("profiles").update({ display_name: name, bio }).eq("id", id);
    if (error) return toast.error(error.message);
    toast.success("Profile updated");
    setEditing(false);
    load();
    refresh();
  };

  if (!profile) return <div className="max-w-4xl mx-auto p-10 text-muted-foreground">Loading…</div>;

  return (
    <main className="max-w-4xl mx-auto px-4 py-10">
      <div className="paper rounded-sm p-6 md:p-8">
        <div className="flex items-start gap-5">
          <div className="h-20 w-20 rounded-2xl bg-cta flex items-center justify-center text-3xl font-bold text-primary-foreground shrink-0">
            {profile.display_name[0]?.toUpperCase()}
          </div>
          <div className="flex-1 min-w-0">
            {editing ? (
              <input
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="text-2xl font-bold bg-input border border-border rounded-lg px-3 py-1 w-full max-w-sm"
              />
            ) : (
              <h1 className="font-display text-3xl md:text-4xl flex items-center gap-2 flex-wrap">
                {profile.display_name}
                {roles.includes("admin") && <span className="text-xs px-2 py-0.5 rounded-full bg-cta text-primary-foreground small-caps">Admin</span>}
                {roles.includes("moderator") && <span className="text-xs px-2 py-0.5 rounded-full bg-accent/20 text-accent small-caps">Mod</span>}
                {profile.is_banned && <span className="text-xs px-2 py-0.5 rounded-full bg-destructive/20 text-destructive small-caps">Banned</span>}
              </h1>
            )}
            <p className="text-xs text-muted-foreground mt-1 small-caps">Joined {new Date(profile.created_at).toLocaleDateString()}</p>

            {editing ? (
              <textarea
                value={bio}
                onChange={(e) => setBio(e.target.value)}
                rows={4}
                maxLength={500}
                className="mt-3 w-full bg-input border border-border rounded-lg px-3 py-2 outline-none focus:border-primary"
              />
            ) : (
              <p className="mt-3 text-foreground/90 whitespace-pre-wrap">{profile.bio || <span className="text-muted-foreground">No bio yet.</span>}</p>
            )}

            <div className="mt-4 flex gap-2">
              {isMe ? (
                editing ? (
                  <>
                    <button onClick={save} className="px-4 py-2 rounded-lg bg-cta text-primary-foreground font-medium">Save</button>
                    <button onClick={() => setEditing(false)} className="px-3 py-2 rounded-lg border border-border hover:bg-secondary inline-flex items-center gap-1.5">
                      <X className="h-4 w-4" /> Cancel
                    </button>
                  </>
                ) : (
                  <button onClick={() => setEditing(true)} className="px-3 py-2 rounded-lg border border-border hover:bg-secondary inline-flex items-center gap-1.5 text-sm">
                    <Pencil className="h-4 w-4" /> Edit profile
                  </button>
                )
              ) : user ? (
                <button
                  onClick={() => setReportTarget({ type: "profile", id: profile.id })}
                  className="px-3 py-2 rounded-lg border border-border hover:bg-destructive/20 hover:text-destructive inline-flex items-center gap-1.5 text-sm"
                >
                  <Flag className="h-4 w-4" /> Report user
                </button>
              ) : null}
            </div>
          </div>
        </div>
      </div>

      <div className="mt-10">
        <p className="small-caps text-xs text-muted-foreground">Collected Works</p>
        <h2 className="font-display text-2xl mt-1">Project history ({projects.length})</h2>
        <div className="rule-double mt-2 mb-4" />
      </div>
      {projects.length === 0 ? (
        <p className="text-muted-foreground">No projects yet.</p>
      ) : (
        <div className="grid sm:grid-cols-2 gap-4">
          {projects.map((p) => (
            <ProjectCard
              key={p.id}
              project={{ ...p, tags: (p.project_tags || []).map((pt: any) => pt.tags).filter(Boolean) }}
            />
          ))}
        </div>
      )}
      <ReportDialog target={reportTarget} onClose={() => setReportTarget(null)} />
    </main>
  );
}

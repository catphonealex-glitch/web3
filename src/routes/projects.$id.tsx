import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth";
import { uploadFile } from "@/lib/storage";
import { toast } from "sonner";
import { FileText, Trash2, Mic, Send, Flag, Lock, Pencil, Upload } from "lucide-react";

import { KaraokeReader } from "@/components/KaraokeReader";
import { ReportDialog, type ReportTarget } from "@/components/ReportDialog";

export const Route = createFileRoute("/projects/$id")({
  component: ProjectPage,
});

interface Project {
  id: string;
  title: string;
  description: string;
  status: string;
  created_at: string;
  media_url: string | null;
  text_url: string | null;
  author_id: string;
  profiles: { display_name: string; avatar_url: string | null } | null;
  project_tags: { tags: { name: string; slug: string } }[];
}

interface Comment {
  id: string;
  body: string;
  created_at: string;
  author_id: string;
  profiles: { display_name: string } | null;
}

interface Application {
  id: string;
  note: string;
  demo_url: string;
  created_at: string;
  applicant_id: string;
  profiles: { display_name: string } | null;
}

function ProjectPage() {
  const { id } = Route.useParams();
  const { user, isStaff } = useAuth();
  const navigate = useNavigate();
  const [project, setProject] = useState<Project | null>(null);
  const [comments, setComments] = useState<Comment[]>([]);
  const [apps, setApps] = useState<Application[]>([]);
  const [body, setBody] = useState("");
  const [demoFile, setDemoFile] = useState<File | null>(null);
  const [appNote, setAppNote] = useState("");
  const [busy, setBusy] = useState(false);
  const [loading, setLoading] = useState(true);
  const videoRef = useRef<HTMLVideoElement>(null);
  const [reportTarget, setReportTarget] = useState<ReportTarget>(null);

  const isOwner = user && project && user.id === project.author_id;

  const load = async () => {
    setLoading(true);
    const { data } = await supabase
      .from("projects")
      .select("*, profiles(display_name, avatar_url), project_tags(tags(name, slug))")
      .eq("id", id)
      .maybeSingle();
    
    if (!data) {
      setProject(null);
      setLoading(false);
      return;
    }

    // Check if current user can see this project
    const viewerIsOwner = user?.id === data.author_id;
    const viewerIsStaff = isStaff;
    
    if (data.hidden && !viewerIsOwner && !viewerIsStaff) {
      setProject(null);
      setLoading(false);
      return;
    }

    setProject(data as unknown as Project);

    const { data: cs } = await supabase
      .from("comments")
      .select("*, profiles(display_name, hidden)")
      .eq("project_id", id)
      .order("created_at", { ascending: true });

    const canSeeHiddenContent = user && (isStaff || viewerIsOwner);
    setComments(
      ((cs as unknown as Comment[]) || []).filter(
        (c: any) => !c.profiles?.hidden || canSeeHiddenContent,
      ),
    );

    if (user) {
      const { data: as } = await supabase
        .from("applications")
        .select("*, profiles(display_name, hidden)")
        .eq("project_id", id)
        .order("created_at", { ascending: false });
      setApps((as as unknown as Application[]) || []);
    }
    setLoading(false);
  };


  useEffect(() => { load(); /* eslint-disable-next-line */ }, [id, user?.id]);

  const submitComment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return navigate({ to: "/auth" });
    if (!body.trim()) return;
    const { error } = await supabase.from("comments").insert({ project_id: id, author_id: user.id, body: body.trim() });
    if (error) return toast.error(error.message);
    setBody("");
    load();
  };

  const deleteComment = async (cid: string) => {
    const { error } = await supabase.from("comments").delete().eq("id", cid);
    if (error) return toast.error(error.message);
    toast.success("Comment deleted");
    load();
  };

  const submitApplication = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return navigate({ to: "/auth" });
    if (!demoFile) return toast.error("Attach a voice demo");
    setBusy(true);
    try {
      const demo_url = await uploadFile("demos", user.id, demoFile);
      const { error } = await supabase.from("applications").insert({
        project_id: id, applicant_id: user.id, demo_url, note: appNote,
      });
      if (error) throw error;
      toast.success("Audition submitted");
      setDemoFile(null); setAppNote("");
      load();
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : "Failed");
    } finally { setBusy(false); }
  };

  const deleteProject = async () => {
    if (!confirm("Delete this project?")) return;
    const { error } = await supabase.from("projects").delete().eq("id", id);
    if (error) return toast.error(error.message);
    toast.success("Project deleted");
    navigate({ to: "/" });
  };

  const toggleStatus = async () => {
    if (!project) return;
    const next = project.status === "open" ? "closed" : "open";
    const { error } = await supabase.from("projects").update({ status: next }).eq("id", id);
    if (error) return toast.error(error.message);
    load();
  };

  const report = (target_type: "comment" | "project" | "profile", target_id: string) => {
    if (!user) return navigate({ to: "/auth" });
    setReportTarget({ type: target_type, id: target_id });
  };


  if (loading) return <div className="max-w-4xl mx-auto p-10 text-muted-foreground">Loading…</div>;
  if (!project) return <div className="max-w-4xl mx-auto p-10">Not found.</div>;

  const canEditProject = isStaff || (user && project && user.id === project.author_id);


  return (
    <main className="max-w-6xl mx-auto px-4 py-8">
      <Link to="/" className="text-xs text-muted-foreground hover:text-foreground small-caps">← All projects</Link>

      <article className="mt-4 paper rounded-sm p-6 md:p-8">
        <div className="flex items-start justify-between gap-3 mb-3">
          <div>
            <span className={`text-xs font-semibold small-caps px-2 py-0.5 rounded-full ${project.status === "open" ? "bg-accent/20 text-accent" : "bg-muted text-muted-foreground"}`}>
              {project.status}
            </span>
            <h1 className="font-display text-3xl md:text-5xl mt-2 leading-tight">{project.title}</h1>
            <div className="rule-double mt-3 mb-3" />
            <p className="text-xs text-muted-foreground small-caps">
              by{" "}
              <Link to="/profile/$id" params={{ id: project.author_id }} className="text-foreground hover:text-primary">
                {project.profiles?.display_name}
              </Link>{" "}
              · {new Date(project.created_at).toLocaleDateString()}
            </p>
          </div>
          <div className="flex gap-1.5">
            {(isOwner || isStaff) && (
              <>
                {isOwner && (
                  <>
                    <Link
                      to="/projects/$id/edit"
                      params={{ id: project.id }}
                      className="p-2 rounded-lg border border-border hover:bg-secondary"
                      title="Edit project"
                      prefetch="intent"
                    >

                      <Pencil className="h-4 w-4" />
                    </Link>
                    <button onClick={toggleStatus} className="p-2 rounded-lg border border-border hover:bg-secondary" title="Toggle status">
                      <Lock className="h-4 w-4" />
                    </button>
                  </>
                )}
                <button onClick={deleteProject} className="p-2 rounded-lg border border-border hover:bg-destructive/20 text-destructive">
                  <Trash2 className="h-4 w-4" />
                </button>
              </>
            )}
            {user && !isOwner && (
              <button onClick={() => report("project", project.id)} className="p-2 rounded-lg border border-border hover:bg-secondary" title="Report">
                <Flag className="h-4 w-4" />
              </button>
            )}
          </div>
        </div>

        {project.project_tags.length > 0 && (
          <div className="flex flex-wrap gap-1.5 mb-4">
            {project.project_tags.map((pt) => (
              <Link key={pt.tags.slug} to="/" search={{ tag: pt.tags.slug, q: "" }} className="text-xs px-2 py-0.5 rounded-full bg-secondary hover:bg-primary/20 transition">
                #{pt.tags.name}
              </Link>
            ))}
          </div>
        )}

        <p className="whitespace-pre-wrap text-foreground/90 leading-relaxed">{project.description}</p>

        {project.media_url && (
          <div className={`mt-5 grid gap-5 ${project.text_url ? "lg:grid-cols-[1.4fr_1fr] lg:items-stretch" : ""}`}>
            <div className="rounded-xl overflow-hidden bg-stage border border-border self-start">
              <video ref={videoRef} src={project.media_url} controls className="w-full max-h-[60vh]" />
            </div>
            {project.text_url && (
              <div className="min-h-0 max-h-[60vh] lg:max-h-[60vh]">
                <KaraokeReader textUrl={project.text_url} videoRef={videoRef} />
              </div>
            )}
          </div>
        )}
        {project.text_url && !project.media_url && (
          <a href={project.text_url} target="_blank" rel="noreferrer" className="mt-3 inline-flex items-center gap-2 text-sm text-accent hover:underline">
            <FileText className="h-4 w-4" /> Download script
          </a>
        )}
        {project.text_url && project.media_url && (
          <a href={project.text_url} target="_blank" rel="noreferrer" className="mt-3 inline-flex items-center gap-2 text-xs text-muted-foreground hover:text-accent small-caps">
            <FileText className="h-3 w-3" /> Download original script
          </a>
        )}
      </article>

      {/* AUDITIONS */}
      <section className="mt-10">
        <p className="small-caps text-xs text-muted-foreground">Calls for Voice</p>
        <h2 className="font-display text-2xl mt-1 inline-flex items-center gap-2"><Mic className="h-5 w-5 text-primary" /> Auditions</h2>
        <div className="rule-double mt-2 mb-4" />

        {user && !isOwner && project.status === "open" && (
          <form onSubmit={submitApplication} className="paper rounded-sm p-5 mb-4 space-y-3">
            <p className="text-sm text-muted-foreground">Submit your voice demo for the director.</p>
            <label className="block">
              <span className="sr-only">Upload voice demo</span>
              <div className="flex items-center gap-3">
                <Upload className="h-4 w-4 text-primary" />
                <input
                  type="file"
                  accept="audio/*,video/*"
                  onChange={(e) => setDemoFile(e.target.files?.[0] ?? null)}
                  className="flex-1 text-sm file:mr-3 file:py-2 file:px-3 file:rounded-lg file:bg-cta file:text-primary-foreground file:border-0 file:font-medium"
                />
              </div>
            </label>

            <textarea
              value={appNote}
              onChange={(e) => setAppNote(e.target.value)}
              placeholder="Which role? Anything you want the director to know…"
              rows={3}
              className="w-full bg-input border border-border rounded-lg px-3 py-2 outline-none focus:border-primary"
            />
            <button disabled={busy} className="px-4 py-2 rounded-lg bg-cta text-primary-foreground font-medium disabled:opacity-50">
              {busy ? "Uploading…" : "Submit audition"}
            </button>
          </form>
        )}

        {(isOwner || isStaff) && apps.length > 0 ? (
          <div className="space-y-3">
            {apps.map((a) => (
              <div key={a.id} className="paper rounded-sm p-4">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <Link to="/profile/$id" params={{ id: a.applicant_id }} className="font-medium hover:text-primary">
                      {a.profiles?.display_name}
                    </Link>
                    {isStaff && a.profiles?.hidden && (
                      <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-muted text-muted-foreground small-caps">Hidden</span>
                    )}
                  </div>
                  <span className="text-xs text-muted-foreground">{new Date(a.created_at).toLocaleString()}</span>
                </div>
                {a.note && <p className="text-sm text-muted-foreground mb-2">{a.note}</p>}
                <audio src={a.demo_url} controls className="w-full" />
              </div>
            ))}
          </div>
        ) : isOwner ? (
          <p className="text-sm text-muted-foreground">No auditions yet.</p>
        ) : !user ? (
          <p className="text-sm text-muted-foreground"><Link to="/auth" className="text-primary hover:underline">Sign in</Link> to audition.</p>
        ) : null}
      </section>

      {/* COMMENTS */}
      <section className="mt-10">
        <p className="small-caps text-xs text-muted-foreground">Letters to the Editor</p>
        <h2 className="font-display text-2xl mt-1">Comments ({comments.length})</h2>
        <div className="rule-double mt-2 mb-4" />
        {user ? (
          <form onSubmit={submitComment} className="flex gap-2 mb-5">
            <input
              value={body}
              onChange={(e) => setBody(e.target.value)}
              maxLength={500}
              placeholder="Leave a comment…"
              className="flex-1 bg-input border border-border rounded-lg px-3 py-2 outline-none focus:border-primary"
            />
            <button className="px-4 rounded-lg bg-cta text-primary-foreground"><Send className="h-4 w-4" /></button>
          </form>
        ) : (
          <p className="text-sm text-muted-foreground mb-4"><Link to="/auth" className="text-primary hover:underline">Sign in</Link> to comment.</p>
        )}

        <div className="space-y-3">
          {comments.map((c) => (
            <div key={c.id} className="paper rounded-sm p-4">
              <div className="flex items-center justify-between mb-1">
                <div className="flex items-center gap-2">
                  <Link to="/profile/$id" params={{ id: c.author_id }} className="text-sm font-medium hover:text-primary">
                    {c.profiles?.display_name}
                  </Link>
                  {isStaff && c.profiles?.hidden && (
                    <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-muted text-muted-foreground small-caps">Hidden</span>
                  )}
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-xs text-muted-foreground">{new Date(c.created_at).toLocaleString()}</span>
                  {(c.author_id === user?.id || isStaff) && (
                    <button onClick={() => deleteComment(c.id)} className="text-muted-foreground hover:text-destructive">
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  )}
                  {user && c.author_id !== user.id && (
                    <button onClick={() => report("comment", c.id)} className="text-muted-foreground hover:text-foreground">
                      <Flag className="h-3.5 w-3.5" />
                    </button>
                  )}
                </div>
              </div>
              <p className="text-sm text-foreground/90 whitespace-pre-wrap">{c.body}</p>
            </div>
          ))}
          {comments.length === 0 && <p className="text-sm text-muted-foreground">No comments yet.</p>}
        </div>
      </section>

      <ReportDialog target={reportTarget} onClose={() => setReportTarget(null)} />
    </main>
  );
}

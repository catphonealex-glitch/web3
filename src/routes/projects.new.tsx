import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth";
import { uploadFile, slugify } from "@/lib/storage";
import { toast } from "sonner";
import { Upload, X, FileText, Video, Plus } from "lucide-react";
import { LangSwitcher } from "@/components/LangSwitcher";

export const Route = createFileRoute("/projects/new")({
  component: NewProject,
});

function NewProject() {
  const { user, profile } = useAuth();
  const navigate = useNavigate();
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [video, setVideo] = useState<File | null>(null);
  const [textFile, setTextFile] = useState<File | null>(null);
  const [status, setStatus] = useState<"open" | "closed">("open");
  const [tagInput, setTagInput] = useState("");
  const [tags, setTags] = useState<string[]>([]);
  const [existingTags, setExistingTags] = useState<{ name: string; slug: string }[]>([]);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (!user) navigate({ to: "/auth" });
  }, [user, navigate]);

  useEffect(() => {
    supabase.from("tags").select("name, slug").order("name").limit(60).then(({ data }) => {
      setExistingTags((data as { name: string; slug: string }[]) || []);
    });
  }, []);

  if (!user) return null;
  if (profile?.is_banned) {
    return <div className="max-w-xl mx-auto p-10 text-center text-destructive">Your account is banned and cannot post.</div>;
  }

  const addTag = () => {
    const t = tagInput.trim().toLowerCase();
    if (t && !tags.includes(t) && tags.length < 8) setTags([...tags, t]);
    setTagInput("");
  };

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return toast.error("Title required");
    setBusy(true);
    try {
      let media_url: string | null = null;
      let text_url: string | null = null;
      if (video) media_url = await uploadFile("media", user.id, video);
      if (textFile) text_url = await uploadFile("texts", user.id, textFile);

      const { data: project, error } = await supabase
        .from("projects")
        .insert({ author_id: user.id, title: title.trim(), description, media_url, text_url, status })
        .select()
        .single();
      if (error) throw error;

      // tags - upsert by slug
      if (tags.length) {
        const tagRows = tags.map((name) => ({ name, slug: slugify(name) }));
        await supabase.from("tags").upsert(tagRows, { onConflict: "slug", ignoreDuplicates: true });
        const { data: tagDocs } = await supabase.from("tags").select("id, slug").in("slug", tagRows.map((t) => t.slug));
        if (tagDocs?.length) {
          await supabase.from("project_tags").insert(tagDocs.map((t) => ({ project_id: project.id, tag_id: t.id })));
        }
      }
      toast.success("Project posted");
      navigate({ to: "/projects/$id", params: { id: project.id } });
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : "Failed");
    } finally {
      setBusy(false);
    }
  };

  return (
    <main className="max-w-2xl mx-auto px-4 py-10">
      <div className="flex items-start justify-between gap-4 mb-6">
        <div>
          <Link to="/" className="text-xs text-muted-foreground hover:text-foreground small-caps">← Back</Link>
          <p className="small-caps text-xs text-muted-foreground mt-3">New Notice</p>
          <h1 className="font-display text-4xl mt-1">Start a dubbing project</h1>
        </div>
        <LangSwitcher />
      </div>
      <div className="rule-double mt-3 mb-6" />

      <form onSubmit={submit} className="space-y-5 paper rounded-sm p-6">
        <Field label="Title">
          <input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            maxLength={120}
            required
            placeholder="e.g. Practice dub — dramatic monologue scene"
            className="w-full bg-input border border-border rounded-lg px-3 py-2 outline-none focus:border-primary"
          />
        </Field>
        <Field label="Description">
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            rows={6}
            maxLength={4000}
            placeholder="What roles are open? Tone, deadline, character notes..."
            className="w-full bg-input border border-border rounded-lg px-3 py-2 outline-none focus:border-primary resize-y"
          />
        </Field>

        <Field label="Status">
          <div className="grid grid-cols-2 gap-2">
            {(["open", "closed"] as const).map((s) => (
              <button
                type="button"
                key={s}
                onClick={() => setStatus(s)}
                className={`py-2.5 rounded-lg border text-sm font-medium capitalize transition ${
                  status === s
                    ? "bg-cta text-primary-foreground border-transparent shadow-neon"
                    : "bg-input border-border text-muted-foreground hover:text-foreground hover:border-primary/50"
                }`}
              >
                {s === "open" ? "Open — accepting auditions" : "Closed — preview only"}
              </button>
            ))}
          </div>
        </Field>

        <div className="grid sm:grid-cols-2 gap-3">
          <FileSlot
            label="Video file"
            icon={<Video className="h-4 w-4" />}
            accept="video/*"
            file={video}
            onChange={setVideo}
          />
          <FileSlot
            label="Script / .lrc"
            icon={<FileText className="h-4 w-4" />}
            accept=".txt,.md,.lrc,.pdf,.doc,.docx,text/plain,application/x-subrip"
            file={textFile}
            onChange={setTextFile}
          />
        </div>
        <p className="text-[11px] text-muted-foreground -mt-2">
          Tip: upload a <code className="text-foreground/80">.lrc</code> file with <code className="text-foreground/80">[mm:ss.xx]</code> timestamps for karaoke-style sync. Plain <code className="text-foreground/80">.txt</code> works too and will auto-pace to the video.
        </p>

        <Field label="Tags">
          {tags.length > 0 && (
            <div className="flex flex-wrap gap-2 mb-2">
              {tags.map((t) => (
                <span key={t} className="text-xs px-2 py-1 rounded-full bg-cta text-primary-foreground inline-flex items-center gap-1">
                  #{t}
                  <button type="button" onClick={() => setTags(tags.filter((x) => x !== t))} className="hover:opacity-70">
                    <X className="h-3 w-3" />
                  </button>
                </span>
              ))}
            </div>
          )}
          <div className="flex gap-2">
            <input
              value={tagInput}
              onChange={(e) => setTagInput(e.target.value)}
              onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); addTag(); } }}
              placeholder="Type a tag and press Enter to create…"
              className="flex-1 bg-input border border-border rounded-lg px-3 py-2 outline-none focus:border-primary"
            />
            <button
              type="button"
              onClick={addTag}
              className="px-3 rounded-lg border border-border hover:bg-secondary inline-flex items-center gap-1 text-sm"
            >
              <Plus className="h-4 w-4" /> Add
            </button>
          </div>
          {existingTags.length > 0 && (
            <div className="mt-3">
              <p className="text-xs text-muted-foreground mb-1.5">Or pick from existing:</p>
              <div className="flex flex-wrap gap-1.5 max-h-32 overflow-y-auto">
                {existingTags
                  .filter((t) => !tags.includes(t.name))
                  .map((t) => (
                    <button
                      type="button"
                      key={t.slug}
                      onClick={() => tags.length < 8 && setTags([...tags, t.name])}
                      className="text-xs px-2 py-1 rounded-full bg-secondary hover:bg-primary/20 transition"
                    >
                      #{t.name}
                    </button>
                  ))}
              </div>
            </div>
          )}
        </Field>

        <button disabled={busy} className="w-full py-3 rounded-lg bg-cta text-primary-foreground font-medium shadow-neon disabled:opacity-50">
          {busy ? "Posting…" : "Post project"}
        </button>
      </form>
    </main>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="block">
      <span className="text-xs text-muted-foreground small-caps">{label}</span>
      <div className="mt-1">{children}</div>
    </div>
  );
}

function FileSlot({ label, icon, accept, file, onChange }: { label: string; icon: React.ReactNode; accept: string; file: File | null; onChange: (f: File | null) => void }) {
  return (
    <label className="block">
      <span className="text-xs text-muted-foreground small-caps inline-flex items-center gap-1.5">{icon}{label}</span>
      <div className="mt-1 relative">
        {file ? (
          <div className="bg-input border border-border rounded-lg px-3 py-2.5 flex items-center justify-between text-sm">
            <span className="truncate">{file.name}</span>
            <button type="button" onClick={() => onChange(null)} className="text-muted-foreground hover:text-destructive">
              <X className="h-4 w-4" />
            </button>
          </div>
        ) : (
          <div className="bg-input border border-dashed border-border rounded-lg px-3 py-2.5 flex items-center gap-2 text-sm text-muted-foreground hover:border-primary transition cursor-pointer">
            <Upload className="h-4 w-4" /> Upload file
            <input
              type="file"
              accept={accept}
              onChange={(e) => onChange(e.target.files?.[0] ?? null)}
              className="absolute inset-0 opacity-0 cursor-pointer"
            />
          </div>
        )}
      </div>
    </label>
  );
}

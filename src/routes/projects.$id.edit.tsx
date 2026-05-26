import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth";
import { uploadFile, slugify } from "@/lib/storage";
import { toast } from "sonner";
import { Upload, X, FileText, Video, Plus } from "lucide-react";
import { LangSwitcher } from "@/components/LangSwitcher";

export const Route = createFileRoute("/projects/$id/edit")({
  component: EditProject,
});

function EditProject() {
  const { id } = Route.useParams();
  const { user, isStaff, loading: authLoading } = useAuth();
  const navigate = useNavigate();

  const [loading, setLoading] = useState(true);
  const [authorId, setAuthorId] = useState<string | null>(null);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [status, setStatus] = useState<"open" | "closed">("open");
  const [mediaUrl, setMediaUrl] = useState<string | null>(null);
  const [textUrl, setTextUrl] = useState<string | null>(null);
  const [video, setVideo] = useState<File | null>(null);
  const [textFile, setTextFile] = useState<File | null>(null);
  const [tagInput, setTagInput] = useState("");
  const [tags, setTags] = useState<string[]>([]);
  const [existingTags, setExistingTags] = useState<{ name: string; slug: string }[]>([]);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (!authLoading && !user) navigate({ to: "/auth" });
  }, [authLoading, user, navigate]);

  useEffect(() => {
    const fetchTags = async () => {
      const { data } = await supabase.from("tags").select("name, slug").order("name").limit(60);
      setExistingTags((data as { name: string; slug: string }[]) || []);
    };
    fetchTags();
  }, []);

  useEffect(() => {
    const loadProject = async () => {
      try {
        const { data, error } = await supabase
          .from("projects")
          .select("*, project_tags(tags(name))")
          .eq("id", id)
          .maybeSingle();

        if (error || !data) {
          toast.error("Project not found");
          navigate({ to: "/" });
          return;
        }

        setAuthorId(data.author_id);
        setTitle(data.title);
        setDescription(data.description ?? "");
        setStatus((data.status as "open" | "closed") ?? "open");
        setMediaUrl(data.media_url);
        setTextUrl(data.text_url);
        setTags((data.project_tags as { tags: { name: string } }[] | null)?.map((pt) => pt.tags.name) ?? []);
      } finally {
        setLoading(false);
      }
    };
    loadProject();
  }, [id, navigate]);

  useEffect(() => {
    if (!loading && user && authorId && user.id !== authorId && !isStaff) {
      toast.error("You can only edit your own projects");
      navigate({ to: "/projects/$id", params: { id } });
    }
  }, [loading, user, authorId, isStaff, id, navigate]);

  if (authLoading || loading) return <div className="max-w-2xl mx-auto p-10 text-muted-foreground">Loading…</div>;
  if (!user) return null;

  const addTag = () => {
    const t = tagInput.trim().toLowerCase();
    if (t && !tags.includes(t) && tags.length < 8) setTags([...tags, t]);
    setTagInput("");
  };

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return toast.error("Please add a title before saving.");
    setBusy(true);
    try {
      let media_url = mediaUrl;
      let text_url = textUrl;
      if (video) media_url = await uploadFile("media", user.id, video);
      if (textFile) text_url = await uploadFile("texts", user.id, textFile);

      const { error } = await supabase
        .from("projects")
        .update({ title: title.trim(), description, media_url, text_url, status })
        .eq("id", id);
      if (error) throw error;

      // Reset tag links and re-create
      await supabase.from("project_tags").delete().eq("project_id", id);
      if (tags.length) {
        const tagRows = tags.map((name) => ({ name, slug: slugify(name) }));
        await supabase.from("tags").upsert(tagRows, { onConflict: "slug", ignoreDuplicates: true });
        const { data: tagDocs } = await supabase.from("tags").select("id, slug").in("slug", tagRows.map((t) => t.slug));
        if (tagDocs?.length) {
          await supabase.from("project_tags").insert(tagDocs.map((t) => ({ project_id: id, tag_id: t.id })));
        }
      }
      toast.success("Changes saved");
      navigate({ to: "/projects/$id", params: { id } });
    } catch (err: unknown) {
      toast.error(err instanceof Error ? `Couldn't save: ${err.message}` : "Couldn't save changes");
    } finally {
      setBusy(false);
    }
  };

  return (
    <main className="max-w-2xl mx-auto px-4 py-10">
      <div className="flex items-start justify-between gap-4 mb-6">
        <div>
          <Link to="/projects/$id" params={{ id }} className="text-xs text-muted-foreground hover:text-foreground small-caps">← Back to project</Link>
          <p className="small-caps text-xs text-muted-foreground mt-3">Revise Notice</p>
          <h1 className="font-display text-4xl mt-1">Edit project</h1>
          <p className="text-sm text-muted-foreground mt-1">Update details, swap the video or script, and re-tag — changes save in place.</p>
        </div>
        <LangSwitcher />
      </div>
      <div className="rule-double mt-3 mb-6" />

      <form onSubmit={submit} className="space-y-5 paper rounded-sm p-4 sm:p-6">
        <Field label="Title">
          <input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            maxLength={120}
            required
            className="w-full bg-input border border-border rounded-lg px-3 py-2 outline-none focus:border-primary"
          />
        </Field>
        <Field label="Description">
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            rows={6}
            maxLength={4000}
            placeholder="Roles, tone, character notes, deadline…"
            className="w-full bg-input border border-border rounded-lg px-3 py-2 outline-none focus:border-primary resize-y"
          />
        </Field>

        <Field label="Status">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            {(["open", "closed"] as const).map((s) => (
              <button
                type="button"
                key={s}
                onClick={() => setStatus(s)}
                className={`py-2.5 rounded-lg border text-xs sm:text-sm font-medium capitalize transition ${
                  status === s
                    ? "bg-cta text-primary-foreground border-transparent shadow-neon"
                    : "bg-input border-border text-muted-foreground hover:text-foreground hover:border-primary/50"
                }`}
              >
                <span className="hidden sm:inline">{s === "open" ? "Open — accepting auditions" : "Closed — preview only"}</span>
                <span className="sm:hidden">{s === "open" ? "Open" : "Closed"}</span>
              </button>
            ))}
          </div>
        </Field>

        <div className="grid sm:grid-cols-2 gap-3">
          <FileSlot
            label={mediaUrl && !video ? "Video file (replace)" : "Video file"}
            existing={mediaUrl && !video ? "Current video uploaded" : null}
            icon={<Video className="h-4 w-4" />}
            accept="video/*"
            file={video}
            onChange={setVideo}
            onClearExisting={mediaUrl ? () => setMediaUrl(null) : undefined}
          />
          <FileSlot
            label={textUrl && !textFile ? "Script (replace)" : "Script / .lrc"}
            existing={textUrl && !textFile ? "Current script uploaded" : null}
            icon={<FileText className="h-4 w-4" />}
            accept=".txt,.md,.lrc,.pdf,.doc,.docx,text/plain,application/x-subrip"
            file={textFile}
            onChange={setTextFile}
            onClearExisting={textUrl ? () => setTextUrl(null) : undefined}
          />
        </div>
        <p className="text-[11px] text-muted-foreground -mt-2">
          Upload a <code className="text-foreground/80">.lrc</code> file with <code className="text-foreground/80">[mm:ss.xx]</code> timestamps for synced karaoke. Plain <code className="text-foreground/80">.txt</code> auto-paces to the video.
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
              placeholder="Type a tag and press Enter…"
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

        <div className="flex gap-2 pt-1">
          <Link
            to="/projects/$id"
            params={{ id }}
            className="px-4 py-3 rounded-lg border border-border hover:bg-secondary text-sm font-medium"
          >
            Cancel
          </Link>
          <button type="submit" disabled={busy} className="flex-1 py-3 rounded-lg bg-cta text-primary-foreground font-medium shadow-neon disabled:opacity-50">
            {busy ? "Saving…" : "Save changes"}
          </button>
        </div>
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

function FileSlot({
  label, icon, accept, file, onChange, existing, onClearExisting,
}: {
  label: string;
  icon: React.ReactNode;
  accept: string;
  file: File | null;
  onChange: (f: File | null) => void;
  existing?: string | null;
  onClearExisting?: () => void;
}) {
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
        ) : existing ? (
          <div className="bg-input border border-border rounded-lg px-3 py-2.5 text-sm cursor-pointer hover:border-primary transition relative">
            <div className="flex items-center justify-between">
              <span className="truncate text-muted-foreground">{existing}</span>
              <div className="flex items-center gap-2">
                <span className="text-[10px] small-caps text-muted-foreground">Upload to replace</span>
                {onClearExisting && (
                  <button type="button" onClick={(e) => { e.stopPropagation(); onClearExisting(); }} className="text-muted-foreground hover:text-destructive" title="Remove">
                    <X className="h-4 w-4" />
                  </button>
                )}
              </div>
            </div>
            <p className="text-[10px] small-caps text-muted-foreground mt-1 group-hover:text-primary transition">
              Click or drag to replace
            </p>
            <input
              type="file"
              accept={accept}
              onChange={(e) => onChange(e.target.files?.[0] ?? null)}
              className="absolute inset-0 opacity-0 cursor-pointer"
            />
          </div>
        ) : (
          <div className="relative bg-input border border-dashed border-border rounded-lg px-3 py-2.5 flex items-center gap-2 text-sm text-muted-foreground hover:border-primary hover:text-foreground transition cursor-pointer group">
            <Upload className="h-4 w-4 group-hover:text-primary" /> Upload file
            <input
              type="file"
              accept={accept}
              onChange={(e) => onChange(e.target.files?.[0] ?? null)}
              className="absolute inset-0 opacity-0 cursor-pointer w-full h-full"
            />
          </div>
        )}
      </div>
    </label>
  );
}

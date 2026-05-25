import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth";
import { ProjectCard } from "@/components/ProjectCard";
import { useI18n } from "@/lib/i18n";
import { Search, Sparkles, Mic2, Film, Users } from "lucide-react";

export const Route = createFileRoute("/")({
  component: Index,
  validateSearch: (s: Record<string, unknown>): { q?: string; tag?: string } => ({
    q: (s.q as string) || "",
    tag: (s.tag as string) || "",
  }),
});

interface ProjectRow {
  id: string;
  title: string;
  description: string;
  status: string;
  created_at: string;
  media_url: string | null;
  author_id: string;
  hidden?: boolean;
  profiles: { display_name: string } | null;
  project_tags: { tags: { name: string; slug: string } }[];
}

// Levenshtein distance for fuzzy matching
function distance(a: string, b: string): number {
  if (!a.length) return b.length;
  if (!b.length) return a.length;
  const m: number[][] = Array.from({ length: a.length + 1 }, () => Array(b.length + 1).fill(0));
  for (let i = 0; i <= a.length; i++) m[i][0] = i;
  for (let j = 0; j <= b.length; j++) m[0][j] = j;
  for (let i = 1; i <= a.length; i++) {
    for (let j = 1; j <= b.length; j++) {
      const cost = a[i - 1] === b[j - 1] ? 0 : 1;
      m[i][j] = Math.min(m[i - 1][j] + 1, m[i][j - 1] + 1, m[i - 1][j - 1] + cost);
    }
  }
  return m[a.length][b.length];
}

function Index() {
  const { t } = useI18n();
  const { isStaff } = useAuth();
  const { q, tag } = Route.useSearch();
  const navigate = Route.useNavigate();
  const [search, setSearch] = useState(q);
  const [projects, setProjects] = useState<ProjectRow[]>([]);
  const [counts, setCounts] = useState<Record<string, { c: number; a: number }>>({});
  const [loading, setLoading] = useState(true);
  const [allTags, setAllTags] = useState<{ name: string; slug: string }[]>([]);
  const [matchMode, setMatchMode] = useState<"title" | "tag" | "fuzzy" | null>(null);

  useEffect(() => {
    supabase.from("tags").select("name, slug").order("name").limit(40).then(({ data }) => {
      setAllTags((data as { name: string; slug: string }[]) || []);
    });
  }, []);

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      setMatchMode(null);

      // Always fetch a working set; we'll filter client-side for tiered matching
      const { data } = await supabase
        .from("projects")
        .select("id, title, description, status, created_at, media_url, author_id, hidden, profiles(display_name), project_tags(tags(name, slug))")
        .order("created_at", { ascending: false })
        .limit(200);

      let all = (data as unknown as ProjectRow[]) || [];
      // Filter hidden projects - only show if user is staff
      all = all.filter((p) => !p.hidden || isStaff);
      
      if (tag) all = all.filter((p) => p.project_tags.some((pt) => pt.tags?.slug === tag));

      let list = all;
      if (q) {
        const needle = q.trim().toLowerCase();
        // Tier 1: title contains query
        const titleHits = all.filter((p) => p.title.toLowerCase().includes(needle));
        if (titleHits.length) {
          list = titleHits;
          setMatchMode("title");
        } else {
          // Tier 2: tag name/slug contains query
          const tagHits = all.filter((p) =>
            p.project_tags.some((pt) =>
              pt.tags && (pt.tags.name.toLowerCase().includes(needle) || pt.tags.slug.toLowerCase().includes(needle))
            )
          );
          if (tagHits.length) {
            list = tagHits;
            setMatchMode("tag");
          } else {
            // Tier 3: fuzzy — closest by Levenshtein on title (and tag names)
            const scored = all.map((p) => {
              const titleScore = distance(needle, p.title.toLowerCase().slice(0, 60));
              const tagScore = Math.min(
                ...p.project_tags.map((pt) => pt.tags ? distance(needle, pt.tags.name.toLowerCase()) : 999),
                999
              );
              return { p, score: Math.min(titleScore, tagScore) };
            });
            scored.sort((a, b) => a.score - b.score);
            list = scored.slice(0, 12).map((s) => s.p);
            if (list.length) setMatchMode("fuzzy");
          }
        }
      }
      setProjects(list);

      // counts
      const ids = list.map((p) => p.id);
      if (ids.length) {
        const [{ data: cs }, { data: as }] = await Promise.all([
          supabase.from("comments").select("project_id").in("project_id", ids),
          supabase.from("applications").select("project_id").in("project_id", ids),
        ]);
        const map: Record<string, { c: number; a: number }> = {};
        ids.forEach((id) => (map[id] = { c: 0, a: 0 }));
        (cs || []).forEach((r: any) => map[r.project_id] && (map[r.project_id].c++));
        (as || []).forEach((r: any) => map[r.project_id] && (map[r.project_id].a++));
        setCounts(map);
      }
      setLoading(false);
    };
    load();
  }, [q, tag]);

  return (
    <main className="max-w-6xl mx-auto px-4 py-10">
      {/* HERO */}
      <section className="relative rounded-lg overflow-hidden paper p-8 md:p-14 mb-10">
        <div className="absolute inset-0 opacity-60 pointer-events-none" style={{ background: "radial-gradient(60% 60% at 20% 10%, oklch(0.7 0.13 75 / 0.25), transparent), radial-gradient(50% 50% at 85% 80%, oklch(0.42 0.13 25 / 0.18), transparent)" }} />
        <div className="relative max-w-2xl">
          <div className="small-caps text-xs text-primary font-semibold mb-3 flex items-center gap-2">
            <Sparkles className="h-3.5 w-3.5" /> {t("home.kicker")}
          </div>
          <h1 className="font-display text-3xl sm:text-5xl md:text-7xl leading-[1.0] mb-2">
            {t("home.title1")}
          </h1>
          <h1 className="font-display font-serif-italic italic text-3xl sm:text-5xl md:text-7xl leading-[1.0] mb-5 text-gradient">
            {t("home.title2")}
          </h1>
          <div className="rule-double w-24 mb-5" />
          <p className="text-muted-foreground text-base sm:text-lg mb-6 max-w-lg leading-relaxed">
            {t("home.lead")}
          </p>
          <form
            onSubmit={(e) => { e.preventDefault(); navigate({ search: { q: search, tag } }); }}
            className="flex flex-col sm:flex-row gap-2"
          >
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder={t("home.searchPlaceholder")}
                className="w-full bg-card border border-border rounded-lg pl-10 pr-4 py-3 outline-none focus:border-primary transition"
              />
            </div>
            <button className="px-5 py-3 rounded-lg bg-cta text-primary-foreground font-medium shadow-neon whitespace-nowrap">{t("home.search")}</button>
          </form>
        </div>
        <div className="relative grid grid-cols-3 gap-3 mt-8 max-w-md">
          <Stat icon={<Film className="h-4 w-4" />} label={t("home.stat.projects")} value={projects.length} />
          <Stat icon={<Mic2 className="h-4 w-4" />} label={t("home.stat.tags")} value={allTags.length} />
          <Stat icon={<Users className="h-4 w-4" />} label={t("home.stat.openCasts")} value={projects.filter((p) => p.status === "open").length} />
        </div>
      </section>

      {/* TAGS */}
      {allTags.length > 0 && (
        <section className="mb-8">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">{t("home.browseTags")}</h2>
            {tag && (
              <button onClick={() => navigate({ search: { q, tag: "" } })} className="text-xs text-primary hover:underline">
                {t("home.clearFilter")}
              </button>
            )}
          </div>
          <div className="flex flex-wrap gap-2">
            {allTags.map((t) => (
              <button
                key={t.slug}
                onClick={() => navigate({ search: { q, tag: tag === t.slug ? "" : t.slug } })}
                className={`text-xs px-3 py-1.5 rounded-full border transition ${
                  tag === t.slug ? "bg-cta text-primary-foreground border-transparent" : "bg-card border-border hover:border-primary/50"
                }`}
              >
                #{t.name}
              </button>
            ))}
          </div>
        </section>
      )}

      {/* GRID */}
      <section>
        <h2 className="text-2xl font-bold mb-1">
          {tag ? `${t("home.tagged")} "#${tag}"` : q ? `${t("home.resultsFor")} "${q}"` : t("home.latest")}
        </h2>
        {q && matchMode && (
          <p className="small-caps text-xs text-muted-foreground mb-4">
            {matchMode === "title" && t("home.match.title")}
            {matchMode === "tag" && t("home.match.tag")}
            {matchMode === "fuzzy" && t("home.match.fuzzy")}
          </p>
        )}
        {(!q || !matchMode) && <div className="mb-4" />}
        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="h-44 rounded-2xl bg-card border border-border animate-pulse" />
            ))}
          </div>
        ) : projects.length === 0 ? (
          <div className="text-center py-16 bg-card border border-border rounded-2xl">
            <Mic2 className="h-10 w-10 text-muted-foreground mx-auto mb-3" />
            <p className="text-muted-foreground mb-4">{t("home.empty")}</p>
            <Link to="/projects/new" className="inline-flex px-4 py-2 rounded-lg bg-cta text-primary-foreground font-medium">
              {t("home.startProject")}
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {projects.map((p) => (
              <ProjectCard
                key={p.id}
                project={{
                  id: p.id,
                  title: p.title,
                  description: p.description,
                  status: p.status,
                  created_at: p.created_at,
                  media_url: p.media_url,
                  profiles: p.profiles,
                  tags: p.project_tags.map((pt) => pt.tags).filter(Boolean),
                  comment_count: counts[p.id]?.c ?? 0,
                  application_count: counts[p.id]?.a ?? 0,
                }}
              />
            ))}
          </div>
        )}
      </section>
    </main>
  );
}

function Stat({ icon, label, value }: { icon: React.ReactNode; label: string; value: number }) {
  return (
    <div className="rounded-xl bg-card/60 backdrop-blur border border-border p-3">
      <div className="text-muted-foreground flex items-center gap-1.5 text-xs mb-1">{icon}{label}</div>
      <div className="text-2xl font-bold">{value}</div>
    </div>
  );
}

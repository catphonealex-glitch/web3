import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/tags")({
  component: TagsPage,
});

function TagsPage() {
  const [tags, setTags] = useState<{ name: string; slug: string; count: number }[]>([]);

  useEffect(() => {
    (async () => {
      const { data: ts } = await supabase.from("tags").select("name, slug").order("name");
      const { data: pts } = await supabase.from("project_tags").select("tag_id, tags(slug)");
      const counts: Record<string, number> = {};
      (pts || []).forEach((pt: any) => {
        const slug = pt.tags?.slug;
        if (slug) counts[slug] = (counts[slug] || 0) + 1;
      });
      setTags((ts || []).map((t) => ({ ...t, count: counts[t.slug] || 0 })).sort((a, b) => b.count - a.count));
    })();
  }, []);

  return (
    <main className="max-w-4xl mx-auto px-4 py-10">
      <p className="small-caps text-xs text-muted-foreground">The Index</p>
      <h1 className="font-display text-4xl md:text-5xl mt-1">Tags</h1>
      <div className="rule-double mt-3 mb-5" />
      <p className="text-muted-foreground mb-6 font-serif-italic">Browse projects by topic. Tags are created on the fly when posting.</p>
      {tags.length === 0 ? (
        <p className="text-muted-foreground">No tags yet.</p>
      ) : (
        <div className="grid sm:grid-cols-2 md:grid-cols-3 gap-3">
          {tags.map((t) => (
            <Link
              key={t.slug}
              to="/"
              search={{ tag: t.slug, q: "" }}
              className="group paper rounded-sm p-4 hover:border-primary/60 transition flex items-center justify-between"
            >
              <span className="font-medium">#{t.name}</span>
              <span className="text-xs text-muted-foreground group-hover:text-primary small-caps">{t.count} {t.count === 1 ? "project" : "projects"}</span>
            </Link>
          ))}
        </div>
      )}
    </main>
  );
}

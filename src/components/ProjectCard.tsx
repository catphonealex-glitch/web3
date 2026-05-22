import { Link } from "@tanstack/react-router";
import { Film, MessageCircle, Mic } from "lucide-react";

interface Props {
  project: {
    id: string;
    title: string;
    description: string;
    status: string;
    created_at: string;
    media_url: string | null;
    profiles?: { display_name: string } | null;
    tags?: { name: string; slug: string }[];
    comment_count?: number;
    application_count?: number;
  };
}

export function ProjectCard({ project }: Props) {
  return (
    <Link
      to="/projects/$id"
      params={{ id: project.id }}
      className="group block rounded-sm paper p-5 hover:border-primary/60 transition-all hover:-translate-y-0.5"
    >
      <div className="flex items-start gap-3 mb-3">
        <div className="h-10 w-10 rounded-lg bg-cta flex items-center justify-center shrink-0">
          <Film className="h-5 w-5 text-primary-foreground" />
        </div>
        <div className="flex-1 min-w-0">
          <h3 className="font-semibold text-lg leading-tight group-hover:text-primary transition truncate">
            {project.title}
          </h3>
          <p className="text-xs text-muted-foreground mt-0.5 small-caps">
            by {project.profiles?.display_name ?? "unknown"} ·{" "}
            <span className={project.status === "open" ? "text-accent" : "text-muted-foreground"}>
              {project.status}
            </span>
          </p>
        </div>
      </div>

      <p className="text-sm text-muted-foreground line-clamp-2 mb-3">{project.description}</p>

      {project.tags && project.tags.length > 0 && (
        <div className="flex flex-wrap gap-1.5 mb-3">
          {project.tags.slice(0, 4).map((t) => (
            <span key={t.slug} className="text-xs px-2 py-0.5 rounded-full bg-secondary text-secondary-foreground">
              #{t.name}
            </span>
          ))}
        </div>
      )}

      <div className="flex items-center gap-4 text-xs text-muted-foreground">
        <span className="inline-flex items-center gap-1"><MessageCircle className="h-3.5 w-3.5" /> {project.comment_count ?? 0}</span>
        <span className="inline-flex items-center gap-1"><Mic className="h-3.5 w-3.5" /> {project.application_count ?? 0}</span>
      </div>
    </Link>
  );
}

import { Link, useNavigate } from "@tanstack/react-router";
import { useAuth } from "@/lib/auth";
import { useI18n } from "@/lib/i18n";
import { LangSwitcher } from "@/components/LangSwitcher";
import { Mic2, Plus, Shield, User as UserIcon, LogOut } from "lucide-react";

export function Header() {
  const { user, profile, isStaff, signOut } = useAuth();
  const { t } = useI18n();
  const navigate = useNavigate();

  return (
    <header className="sticky top-0 z-40 glass">
      <div className="max-w-6xl mx-auto px-4 h-16 flex items-center gap-3">
        <Link to="/" className="flex items-center gap-2 group">
          <div className="h-9 w-9 rounded-xl bg-cta flex items-center justify-center shadow-neon">
            <Mic2 className="h-5 w-5 text-primary-foreground" />
          </div>
          <span className="text-lg font-bold tracking-tight">
            Dub<span className="text-gradient">Stage</span>
          </span>
        </Link>

        <nav className="ml-6 hidden md:flex items-center gap-6 text-xs text-muted-foreground small-caps">
          <Link to="/" className="hover:text-foreground transition" activeProps={{ className: "text-foreground" }}>{t("nav.projects")}</Link>
          <Link to="/tags" className="hover:text-foreground transition" activeProps={{ className: "text-foreground" }}>{t("nav.tags")}</Link>
          <Link to="/guidelines" className="hover:text-foreground transition" activeProps={{ className: "text-foreground" }}>{t("nav.guidelines")}</Link>
          <Link to="/about" className="hover:text-foreground transition" activeProps={{ className: "text-foreground" }}>{t("nav.about")}</Link>
        </nav>

        <div className="flex-1" />

        <LangSwitcher />

        {user ? (
          <div className="flex items-center gap-2">
            <Link
              to="/projects/new"
              className="hidden sm:inline-flex items-center gap-1.5 px-3 py-2 rounded-lg bg-cta text-primary-foreground text-sm font-medium hover:opacity-90 transition shadow-neon"
            >
              <Plus className="h-4 w-4" /> {t("nav.newProject")}
            </Link>
            {isStaff && (
              <Link
                to="/admin"
                className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg border border-border text-sm hover:bg-secondary transition"
              >
                <Shield className="h-4 w-4 text-accent" /> {t("nav.admin")}
              </Link>
            )}
            <Link
              to="/profile/$id"
              params={{ id: user.id }}
              className="inline-flex items-center gap-2 px-2 py-1.5 rounded-lg hover:bg-secondary transition"
            >
              <div className="h-7 w-7 rounded-full bg-secondary flex items-center justify-center text-xs font-bold">
                {profile?.display_name?.[0]?.toUpperCase() ?? "?"}
              </div>
              <span className="hidden sm:inline text-sm">{profile?.display_name}</span>
            </Link>
            <button
              onClick={async () => { await signOut(); navigate({ to: "/" }); }}
              className="p-2 rounded-lg hover:bg-secondary transition"
              aria-label={t("nav.signOut")}
            >
              <LogOut className="h-4 w-4" />
            </button>
          </div>
        ) : (
          <Link to="/auth" className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-cta text-primary-foreground text-sm font-medium hover:opacity-90 transition">
            <UserIcon className="h-4 w-4" /> {t("nav.signIn")}
          </Link>
        )}
      </div>
    </header>
  );
}

import { createFileRoute, Link } from "@tanstack/react-router";
import { Mic2, Sparkles, Users, Compass } from "lucide-react";
import { useI18n } from "@/lib/i18n";

export const Route = createFileRoute("/about")({
  head: () => ({
    meta: [
      { title: "About — DubStage" },
      { name: "description", content: "DubStage is an amateur dubbing community for aspiring voice actors to practice, audition, and build a career-ready portfolio." },
      { property: "og:title", content: "About — DubStage" },
      { property: "og:description", content: "An amateur dubbing community built for people starting a voice-acting career." },
    ],
  }),
  component: AboutPage,
});

function AboutPage() {
  const { t } = useI18n();
  return (
    <main className="max-w-3xl mx-auto px-4 py-10 sm:py-12">
      <p className="small-caps text-xs text-muted-foreground">{t("about.kicker")}</p>
      <h1 className="font-display text-3xl sm:text-5xl mt-1">{t("about.title")}</h1>
      <div className="rule-double mt-3 mb-8 w-32" />

      <section className="paper rounded-sm p-8 space-y-5 text-muted-foreground leading-relaxed">
        <p className="text-lg text-foreground">{t("about.lead")}</p>
        <p>{t("about.p2")}</p>
        <p>{t("about.p3")}</p>
      </section>

      <section className="grid sm:grid-cols-3 gap-3 mt-8">
        <Pillar icon={<Mic2 className="h-5 w-5" />} title={t("about.pillar.practice")} body={t("about.pillar.practice.body")} />
        <Pillar icon={<Users className="h-5 w-5" />} title={t("about.pillar.audition")} body={t("about.pillar.audition.body")} />
        <Pillar icon={<Sparkles className="h-5 w-5" />} title={t("about.pillar.portfolio")} body={t("about.pillar.portfolio.body")} />
      </section>

      <section className="mt-10 paper rounded-sm p-8">
        <h2 className="font-display text-3xl mb-3 flex items-center gap-2"><Compass className="h-6 w-6 text-accent" /> {t("about.who")}</h2>
        <ul className="space-y-2 text-muted-foreground">
          <li>• {t("about.who.1")}</li>
          <li>• {t("about.who.2")}</li>
          <li>• {t("about.who.3")}</li>
          <li>• {t("about.who.4")}</li>
        </ul>
      </section>

      <div className="mt-10 text-center">
        <Link to="/guidelines" className="text-sm text-primary hover:underline small-caps">{t("about.cta")}</Link>
      </div>
    </main>
  );
}

function Pillar({ icon, title, body }: { icon: React.ReactNode; title: string; body: string }) {
  return (
    <div className="paper rounded-sm p-4 sm:p-5">
      <div className="h-9 w-9 rounded-lg bg-cta flex items-center justify-center text-primary-foreground mb-3 shadow-neon">{icon}</div>
      <h3 className="font-display text-lg sm:text-xl mb-1">{title}</h3>
      <p className="text-xs sm:text-sm text-muted-foreground">{body}</p>
    </div>
  );
}

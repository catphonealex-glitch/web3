import { createFileRoute } from "@tanstack/react-router";
import { ShieldCheck, Heart, AlertTriangle, Scale } from "lucide-react";
import { useI18n } from "@/lib/i18n";

export const Route = createFileRoute("/guidelines")({
  head: () => ({
    meta: [
      { title: "Community Guidelines — DubStage" },
      { name: "description", content: "How to participate on DubStage: respect, constructive feedback, copyright, and what gets you removed from the platform." },
      { property: "og:title", content: "Community Guidelines — DubStage" },
      { property: "og:description", content: "The rules that keep DubStage a supportive place for amateur dubbers." },
    ],
  }),
  component: GuidelinesPage,
});

function GuidelinesPage() {
  const { t } = useI18n();
  return (
    <main className="max-w-3xl mx-auto px-4 py-12">
      <p className="small-caps text-xs text-muted-foreground">{t("gl.kicker")}</p>
      <h1 className="font-display text-5xl mt-1">{t("gl.title")}</h1>
      <div className="rule-double mt-3 mb-8 w-32" />

      <p className="text-muted-foreground leading-relaxed mb-8">{t("gl.intro")}</p>

      <Section icon={<Heart className="h-5 w-5 text-accent" />} title={t("gl.s1.title")}>
        <ul className="space-y-2">
          <li>• {t("gl.s1.1")}</li>
          <li>• {t("gl.s1.2")}</li>
          <li>• {t("gl.s1.3")}</li>
        </ul>
      </Section>

      <Section icon={<ShieldCheck className="h-5 w-5 text-primary" />} title={t("gl.s2.title")}>
        <ul className="space-y-2">
          <li>• {t("gl.s2.1")}</li>
          <li>• {t("gl.s2.2")}</li>
          <li>• {t("gl.s2.3")}</li>
        </ul>
      </Section>

      <Section icon={<Scale className="h-5 w-5 text-primary-glow" />} title={t("gl.s3.title")}>
        <ul className="space-y-2">
          <li>• {t("gl.s3.1")}</li>
          <li>• {t("gl.s3.2")}</li>
          <li>• {t("gl.s3.3")}</li>
          <li>• {t("gl.s3.4")}</li>
        </ul>
      </Section>

      <Section icon={<AlertTriangle className="h-5 w-5 text-destructive" />} title={t("gl.s4.title")}>
        <p className="mb-2">{t("gl.s4.intro")}</p>
        <ul className="space-y-2">
          <li>• {t("gl.s4.1")}</li>
          <li>• {t("gl.s4.2")}</li>
          <li>• {t("gl.s4.3")}</li>
          <li>• {t("gl.s4.4")}</li>
          <li>• {t("gl.s4.5")}</li>
        </ul>
      </Section>

      <Section icon={<ShieldCheck className="h-5 w-5 text-primary" />} title={t("gl.s5.title")}>
        <ul className="space-y-2">
          <li>• {t("gl.s5.1")}</li>
          <li>• {t("gl.s5.2")}</li>
          <li>• {t("gl.s5.3")}</li>
          <li>• {t("gl.s5.4")}</li>
        </ul>
      </Section>

      <Section icon={<AlertTriangle className="h-5 w-5 text-accent" />} title={t("gl.s6.title")}>
        <ul className="space-y-2">
          <li>• {t("gl.s6.1")}</li>
          <li>• {t("gl.s6.2")}</li>
          <li>• {t("gl.s6.3")}</li>
        </ul>
      </Section>

      <p className="text-xs text-muted-foreground mt-10 text-center small-caps">{t("gl.updated")}</p>
    </main>
  );
}

function Section({ icon, title, children }: { icon: React.ReactNode; title: string; children: React.ReactNode }) {
  return (
    <section className="paper rounded-sm p-6 mb-4">
      <h2 className="font-display text-2xl mb-3 flex items-center gap-2">{icon} {title}</h2>
      <div className="text-muted-foreground leading-relaxed">{children}</div>
    </section>
  );
}

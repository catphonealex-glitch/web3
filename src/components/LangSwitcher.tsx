import { useI18n, type Lang } from "@/lib/i18n";

export function LangSwitcher() {
  const { lang, setLang } = useI18n();
  const langs: { code: Lang; label: string }[] = [
    { code: "en", label: "EN" },
    { code: "lv", label: "LV" },
  ];
  return (
    <div className="inline-flex rounded-lg border border-border overflow-hidden text-xs">
      {langs.map((l) => (
        <button
          key={l.code}
          onClick={() => setLang(l.code)}
          className={`px-2 py-1.5 transition ${
            lang === l.code ? "bg-cta text-primary-foreground" : "hover:bg-secondary text-muted-foreground"
          }`}
          aria-label={`Switch language to ${l.label}`}
        >
          {l.label}
        </button>
      ))}
    </div>
  );
}

import { useEffect, useMemo, useRef, useState } from "react";
import { Music2, ExternalLink } from "lucide-react";

const URL_RE = /https?:\/\/[^\s]+/gi;

// If the script is essentially just one or more URLs (e.g. a Canva or Google
// Docs share link pasted into a .txt), we can't karaoke it — show the links.
function extractIfLinksOnly(raw: string): string[] | null {
  const trimmed = raw.trim();
  if (!trimmed) return null;
  const urls = trimmed.match(URL_RE) ?? [];
  if (urls.length === 0) return null;
  // Strip URLs and see if anything substantive remains
  const remainder = trimmed.replace(URL_RE, "").replace(/\s+/g, "");
  if (remainder.length > 8) return null; // there's real script text too
  return Array.from(new Set(urls));
}

function hostLabel(u: string): string {
  try { return new URL(u).hostname.replace(/^www\./, ""); } catch { return u; }
}

interface Line {
  time: number | null; 
  text: string;
}

interface Props {
  textUrl: string;
  videoRef: React.RefObject<HTMLVideoElement | null>;
}

// Parse LRC-style: [mm:ss.xx] line text
function parseScript(raw: string): { lines: Line[]; hasTimestamps: boolean } {
  const lrcRe = /\[(\d{1,2}):(\d{2})(?:[.:](\d{1,3}))?\]/g;
  const lines: Line[] = [];
  let hasTimestamps = false;

  for (const rawLine of raw.split(/\r?\n/)) {
    const line = rawLine.trim();
    if (!line) continue;

    const matches = [...line.matchAll(lrcRe)];
    if (matches.length > 0) {
      hasTimestamps = true;
      const text = line.replace(lrcRe, "").trim();
      if (!text) continue;
      for (const m of matches) {
        const min = parseInt(m[1], 10);
        const sec = parseInt(m[2], 10);
        const fracStr = m[3] ?? "0";
        const frac = parseInt(fracStr, 10) / Math.pow(10, fracStr.length);
        lines.push({ time: min * 60 + sec + frac, text });
      }
    } else {
      lines.push({ time: null, text: line });
    }
  }

  lines.sort((a, b) => {
    if (a.time == null && b.time == null) return 0;
    if (a.time == null) return 1;
    if (b.time == null) return -1;
    return a.time - b.time;
  });

  return { lines, hasTimestamps };
}

export function KaraokeReader({ textUrl, videoRef }: Props) {
  const [raw, setRaw] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const containerRef = useRef<HTMLDivElement>(null);
  const lineRefs = useRef<Array<HTMLButtonElement | null>>([]);

  // Fetch script
  useEffect(() => {
    let cancelled = false;
    setRaw(null);
    setError(null);
    fetch(textUrl)
      .then((r) => {
        if (!r.ok) throw new Error(`HTTP ${r.status}`);
        const ct = r.headers.get("content-type") ?? "";
        if (ct.includes("pdf") || ct.includes("octet-stream")) {
          throw new Error("Script must be a plain-text or .lrc file for karaoke.");
        }
        return r.text();
      })
      .then((t) => { if (!cancelled) setRaw(t); })
      .catch((e: unknown) => { if (!cancelled) setError(e instanceof Error ? e.message : "Failed to load"); });
    return () => { cancelled = true; };
  }, [textUrl]);

  // Subscribe to video time
  useEffect(() => {
    const v = videoRef.current;
    if (!v) return;
    const onTime = () => setCurrentTime(v.currentTime);
    const onMeta = () => setDuration(v.duration || 0);
    v.addEventListener("timeupdate", onTime);
    v.addEventListener("loadedmetadata", onMeta);
    if (v.readyState >= 1) onMeta();
    return () => {
      v.removeEventListener("timeupdate", onTime);
      v.removeEventListener("loadedmetadata", onMeta);
    };
  }, [videoRef, raw]);

  const { lines, hasTimestamps } = useMemo(
    () => (raw ? parseScript(raw) : { lines: [], hasTimestamps: false }),
    [raw],
  );

  // Compute line times — for plain text, distribute evenly across duration
  const timedLines = useMemo(() => {
    if (lines.length === 0) return [];
    const dur = duration > 0 ? duration : 0;
    if (hasTimestamps) {
      return lines.map((l, i) => ({
        ...l,
        time: l.time ?? (dur ? (i / lines.length) * dur : i),
      }));
    }
    if (!dur) return lines.map((l, i) => ({ ...l, time: i }));
    const per = dur / lines.length;
    return lines.map((l, i) => ({ ...l, time: i * per }));
  }, [lines, duration, hasTimestamps]);

  // Active line index
  const activeIdx = useMemo(() => {
    if (timedLines.length === 0) return -1;
    let idx = -1;
    for (let i = 0; i < timedLines.length; i++) {
      if ((timedLines[i].time ?? Infinity) <= currentTime + 0.05) idx = i;
      else break;
    }
    return idx;
  }, [timedLines, currentTime]);

  // Auto-scroll active line into view
  useEffect(() => {
    if (activeIdx < 0) return;
    const el = lineRefs.current[activeIdx];
    if (el) el.scrollIntoView({ behavior: "smooth", block: "center" });
  }, [activeIdx]);

  const seek = (t: number) => {
    const v = videoRef.current;
    if (!v) return;
    v.currentTime = t;
    if (v.paused) v.play().catch(() => {});
  };

  return (
    <aside className="paper rounded-sm p-5 h-full flex flex-col">
      <div className="flex items-center justify-between mb-2">
        <div>
          <p className="small-caps text-xs text-muted-foreground">Read-Along</p>
          <h3 className="font-display text-xl inline-flex items-center gap-2">
            <Music2 className="h-4 w-4 text-primary" /> Script
          </h3>
        </div>
        <span className="text-[10px] small-caps text-muted-foreground">
          {hasTimestamps ? "synced" : "auto-paced"}
        </span>
      </div>
      <div className="rule-double mb-3" />

      {error && <p className="text-sm text-destructive">Could not load script: {error}</p>}
      {!raw && !error && <p className="text-sm text-muted-foreground">Loading script…</p>}

      {raw && (() => {
        const links = extractIfLinksOnly(raw);
        if (!links) return null;
        return (
          <div className="space-y-3 flex-1 min-h-0 overflow-y-auto pr-1">
            <p className="text-sm text-muted-foreground">
              This script is hosted externally — open it in a new tab to read along.
            </p>
            <ul className="space-y-2">
              {links.map((u) => (
                <li key={u}>
                  <a
                    href={u}
                    target="_blank"
                    rel="noreferrer"
                    className="flex items-start gap-3 paper rounded-sm px-3 py-2 hover:border-primary transition group"
                  >
                    <ExternalLink className="h-4 w-4 mt-0.5 text-muted-foreground group-hover:text-primary shrink-0" />
                    <div className="min-w-0 flex-1">
                      <p className="small-caps text-[11px] text-muted-foreground leading-tight">
                        {hostLabel(u)}
                      </p>
                      <p className="text-sm text-foreground/90 group-hover:text-primary break-all leading-snug">
                        {u}
                      </p>
                    </div>
                  </a>
                </li>
              ))}
            </ul>
            <p className="text-[11px] text-muted-foreground small-caps">
              Tip: paste the full script (or a .lrc file) for in-page karaoke sync.
            </p>
          </div>
        );
      })()}

      {raw && !extractIfLinksOnly(raw) && timedLines.length === 0 && (
        <p className="text-sm text-muted-foreground">Script is empty.</p>
      )}

      {raw && !extractIfLinksOnly(raw) && timedLines.length > 0 && (
        <div
          ref={containerRef}
          className="flex-1 min-h-0 overflow-hidden pr-2 space-y-2"
        >
          {timedLines.map((l, i) => {
            const isActive = i === activeIdx;
            const isPast = i < activeIdx;
            return (
              <button
                key={i}
                ref={(el) => { lineRefs.current[i] = el; }}
                onClick={() => seek(l.time ?? 0)}
                className={[
                  "block w-full text-left font-display leading-snug transition-all px-2 py-1 rounded-sm break-words",
                  isActive
                    ? "text-primary text-2xl md:text-3xl scale-[1.02] origin-left line-clamp-2"
                    : isPast
                      ? "text-muted-foreground/60 text-base line-clamp-1"
                      : "text-foreground/80 text-base hover:text-foreground hover:bg-secondary/40 line-clamp-1",
                ].join(" ")}
              >
                {l.text}
              </button>
            );
          })}
        </div>
      )}

      {!hasTimestamps && raw && !extractIfLinksOnly(raw) && (
        <p className="mt-3 text-[11px] text-muted-foreground small-caps">
          Tip: upload a .lrc file with [mm:ss.xx] timestamps for precise sync.
        </p>
      )}
    </aside>
  );
}

import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { Gauge } from "@/components/Gauge";
import { HistoryDrawer } from "@/components/HistoryDrawer";
import {
  countTokens,
  countWords,
  diffWords,
  optimize,
  SAMPLE_PROMPTS,
  type Domain,
  type OptimizationRun,
  type Preset,
} from "@/lib/optimizer";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Prompt Forge — AI Prompt Optimizer & Quality Scoring" },
      {
        name: "description",
        content:
          "Rewrite vague prompts into structured, high-scoring instructions. Live clarity, completeness and efficiency scoring with side-by-side diffs.",
      },
      { property: "og:title", content: "Prompt Forge — AI Prompt Optimizer & Quality Scoring" },
      {
        property: "og:description",
        content:
          "Rewrite vague prompts into structured, high-scoring instructions with instant quality analytics.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Index,
});

const STORAGE_KEY = "prompt-forge-history-v1";

const PRESETS: { id: Exclude<Preset, null>; label: string }[] = [
  { id: "vague", label: "Fix Vague Prompt" },
  { id: "coding", label: "Coding Task" },
  { id: "structured", label: "Make Structured" },
];

const DOMAINS: { id: Domain; label: string }[] = [
  { id: "coding", label: "Coding" },
  { id: "academic", label: "Academic" },
  { id: "writing", label: "Writing" },
  { id: "marketing", label: "Marketing" },
];

type Tab = "optimized" | "diff" | "improvements";

function Index() {
  const [input, setInput] = useState("");
  const [domain, setDomain] = useState<Domain>("coding");
  const [preset, setPreset] = useState<Preset>(null);
  const [run, setRun] = useState<OptimizationRun | null>(null);
  const [history, setHistory] = useState<OptimizationRun[]>([]);
  const [drawer, setDrawer] = useState(false);
  const [tab, setTab] = useState<Tab>("optimized");
  const [busy, setBusy] = useState(false);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) setHistory(JSON.parse(raw) as OptimizationRun[]);
    } catch {
      /* ignore corrupted storage */
    }
  }, []);

  const persist = (next: OptimizationRun[]) => {
    setHistory(next);
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
    } catch {
      /* storage full or blocked */
    }
  };

  const stats = useMemo(
    () => ({
      chars: input.length,
      words: countWords(input),
      tokens: countTokens(input),
    }),
    [input],
  );

  const handleOptimize = () => {
    if (!input.trim() || busy) return;
    setBusy(true);
    window.setTimeout(() => {
      const result = optimize(input, domain, preset);
      setRun(result);
      setTab("optimized");
      persist([result, ...history].slice(0, 50));
      setBusy(false);
    }, 650);
  };

  const handleCopy = async () => {
    if (!run) return;
    await navigator.clipboard.writeText(run.optimized);
    setCopied(true);
    window.setTimeout(() => setCopied(false), 1600);
  };

  const loadRun = (r: OptimizationRun) => {
    setInput(r.original);
    setDomain(r.domain);
    setPreset(r.preset);
    setRun(r);
    setDrawer(false);
    setTab("optimized");
  };

  const diff = run ? diffWords(run.original, run.optimized) : null;

  return (
    <div className="min-h-screen">
      <header className="sticky top-0 z-30 border-b border-border bg-background/70 backdrop-blur-xl">
        <div className="mx-auto flex max-w-[1500px] items-center justify-between gap-4 px-5 py-3.5">
          <div className="flex items-center gap-3">
            <div className="grid h-9 w-9 place-items-center rounded-xl bg-primary/25 text-base ring-1 ring-primary/40">
              ⚡
            </div>
            <div>
              <h1 className="text-[15px] font-semibold leading-tight">Prompt Forge</h1>
              <p className="text-[11px] text-muted-foreground">
                AI prompt optimizer &amp; quality scoring
              </p>
            </div>
          </div>
          <button onClick={() => setDrawer(true)} className="btn-ghost">
            History
            <span className="badge">{history.length}</span>
          </button>
        </div>
      </header>

      <main className="mx-auto grid max-w-[1500px] gap-5 p-5 lg:grid-cols-2">
        {/* LEFT — input & controls */}
        <section className="glass flex flex-col gap-5 rounded-2xl p-5">
          <div>
            <h2 className="text-lg font-semibold">Your prompt</h2>
            <p className="text-sm text-muted-foreground">
              Paste anything rough. The engine restructures it into a production-grade instruction.
            </p>
          </div>

          <div className="relative">
            <textarea
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="e.g. write me some good code for a react component that shows a list of things…"
              className="h-56 w-full resize-none rounded-xl border border-input bg-background/60 p-4 font-mono text-sm leading-relaxed text-foreground outline-none transition-colors placeholder:text-muted-foreground/70 focus:border-primary/70"
            />
            <div className="mt-2 flex flex-wrap gap-2 text-[11px] tabular-nums text-muted-foreground">
              <span className="chip !cursor-default !py-1">{stats.chars} chars</span>
              <span className="chip !cursor-default !py-1">{stats.words} words</span>
              <span className="chip !cursor-default !py-1">≈ {stats.tokens} tokens</span>
            </div>
          </div>

          <div>
            <p className="mb-2 text-xs font-medium uppercase tracking-wider text-muted-foreground">
              Presets
            </p>
            <div className="flex flex-wrap gap-2">
              {PRESETS.map((p) => (
                <button
                  key={p.id}
                  onClick={() => setPreset(preset === p.id ? null : p.id)}
                  className={`chip ${preset === p.id ? "chip-active" : ""}`}
                >
                  {p.label}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label
              htmlFor="domain"
              className="mb-2 block text-xs font-medium uppercase tracking-wider text-muted-foreground"
            >
              Domain
            </label>
            <select
              id="domain"
              value={domain}
              onChange={(e) => setDomain(e.target.value as Domain)}
              className="w-full rounded-xl border border-input bg-background/60 px-4 py-2.5 text-sm text-foreground outline-none focus:border-primary/70"
            >
              {DOMAINS.map((d) => (
                <option key={d.id} value={d.id} className="bg-card">
                  {d.label}
                </option>
              ))}
            </select>
          </div>

          <div className="flex flex-wrap gap-2.5">
            <button onClick={handleOptimize} disabled={!input.trim() || busy} className="btn-primary">
              {busy ? "Optimizing…" : "Optimize Prompt"}
            </button>
            <button
              onClick={() =>
                setInput(SAMPLE_PROMPTS[Math.floor(Math.random() * SAMPLE_PROMPTS.length)])
              }
              className="btn-ghost"
            >
              Load Sample
            </button>
            <button
              onClick={() => {
                setInput("");
                setRun(null);
                setPreset(null);
              }}
              className="btn-ghost"
            >
              Clear
            </button>
          </div>
        </section>

        {/* RIGHT — output & analytics */}
        <section className="flex flex-col gap-5">
          {!run ? (
            <div className="glass grid min-h-[420px] place-items-center rounded-2xl p-8 text-center">
              <div className="max-w-sm">
                <div className="mx-auto grid h-14 w-14 place-items-center rounded-2xl bg-primary/20 text-2xl ring-1 ring-primary/40">
                  ✦
                </div>
                <h3 className="mt-4 text-lg font-semibold">No analysis yet</h3>
                <p className="mt-1.5 text-sm text-muted-foreground">
                  Optimize a prompt to see clarity, completeness and efficiency scores, plus a
                  side-by-side diff of what changed.
                </p>
              </div>
            </div>
          ) : (
            <>
              <div className="grid grid-cols-3 gap-3">
                <Gauge
                  label="Clarity"
                  value={run.scores.clarity}
                  baseline={run.baseline.clarity}
                  hue="violet"
                />
                <Gauge
                  label="Completeness"
                  value={run.scores.completeness}
                  baseline={run.baseline.completeness}
                  hue="cyan"
                />
                <Gauge
                  label="Efficiency"
                  value={run.scores.efficiency}
                  baseline={run.baseline.efficiency}
                  hue="amber"
                />
              </div>

              <div className="glass flex flex-wrap items-center gap-2 rounded-2xl px-4 py-3">
                <span className="text-xs text-muted-foreground">Classification:</span>
                <span className="badge">Intent · {run.intent}</span>
                <span className="badge">Domain · {run.detectedDomain}</span>
                {run.preset && <span className="badge">Preset applied</span>}
              </div>

              <div className="glass flex min-h-[360px] flex-col rounded-2xl">
                <div className="flex flex-wrap gap-2 border-b border-border p-3">
                  {(
                    [
                      ["optimized", "Optimized Prompt"],
                      ["diff", "Side-by-Side Diff"],
                      ["improvements", "Improvements Made"],
                    ] as [Tab, string][]
                  ).map(([id, label]) => (
                    <button
                      key={id}
                      onClick={() => setTab(id)}
                      className={`chip ${tab === id ? "chip-active" : ""}`}
                    >
                      {label}
                    </button>
                  ))}
                  {tab === "optimized" && (
                    <button onClick={handleCopy} className="chip ml-auto">
                      {copied ? "Copied ✓" : "Copy"}
                    </button>
                  )}
                </div>

                <div className="flex-1 overflow-auto p-4">
                  {tab === "optimized" && (
                    <pre className="whitespace-pre-wrap font-mono text-[13px] leading-relaxed text-foreground/90">
                      {run.optimized}
                    </pre>
                  )}

                  {tab === "diff" && (
                    <div className="grid gap-4 md:grid-cols-2">
                      <div>
                        <p className="mb-2 text-xs font-medium uppercase tracking-wider text-muted-foreground">
                          Original
                        </p>
                        <div className="rounded-xl border border-destructive/25 bg-destructive/10 p-3 font-mono text-[13px] leading-relaxed">
                          {run.original}
                        </div>
                        {diff && diff.removed.length > 0 && (
                          <p className="mt-2 text-[11px] text-muted-foreground">
                            Dropped terms: {diff.removed.slice(0, 10).join(", ")}
                          </p>
                        )}
                      </div>
                      <div>
                        <p className="mb-2 text-xs font-medium uppercase tracking-wider text-muted-foreground">
                          Optimized
                        </p>
                        <div className="max-h-72 overflow-auto rounded-xl border border-emerald-500/25 bg-emerald-500/10 p-3">
                          <pre className="whitespace-pre-wrap font-mono text-[13px] leading-relaxed">
                            {run.optimized}
                          </pre>
                        </div>
                        {diff && (
                          <p className="mt-2 text-[11px] text-muted-foreground">
                            {diff.added.length} new instruction terms added
                          </p>
                        )}
                      </div>
                    </div>
                  )}

                  {tab === "improvements" && (
                    <ul className="space-y-2.5">
                      {run.improvements.map((imp) => (
                        <li key={imp} className="flex gap-3 rounded-xl bg-background/40 p-3 text-sm">
                          <span className="text-primary">▸</span>
                          <span className="text-foreground/85">{imp}</span>
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              </div>
            </>
          )}
        </section>
      </main>

      <HistoryDrawer
        open={drawer}
        onClose={() => setDrawer(false)}
        runs={history}
        onLoad={loadRun}
        onDelete={(id) => persist(history.filter((h) => h.id !== id))}
        onClear={() => persist([])}
      />
    </div>
  );
}

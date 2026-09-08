import type { OptimizationRun } from "@/lib/optimizer";

interface Props {
  open: boolean;
  onClose: () => void;
  runs: OptimizationRun[];
  onLoad: (run: OptimizationRun) => void;
  onDelete: (id: string) => void;
  onClear: () => void;
}

export function HistoryDrawer({ open, onClose, runs, onLoad, onDelete, onClear }: Props) {
  return (
    <>
      <div
        onClick={onClose}
        className={`fixed inset-0 z-40 bg-black/60 backdrop-blur-sm transition-opacity duration-300 ${
          open ? "opacity-100" : "pointer-events-none opacity-0"
        }`}
      />
      <aside
        className={`fixed right-0 top-0 z-50 flex h-full w-[min(420px,92vw)] flex-col border-l border-border bg-card/95 backdrop-blur-xl transition-transform duration-300 ${
          open ? "translate-x-0" : "translate-x-full"
        }`}
      >
        <header className="flex items-center justify-between border-b border-border px-5 py-4">
          <div>
            <h2 className="text-sm font-semibold text-foreground">Optimization history</h2>
            <p className="text-xs text-muted-foreground">{runs.length} saved run(s)</p>
          </div>
          <div className="flex items-center gap-2">
            {runs.length > 0 && (
              <button onClick={onClear} className="chip text-xs">
                Clear all
              </button>
            )}
            <button onClick={onClose} aria-label="Close history" className="chip px-2.5 text-xs">
              ✕
            </button>
          </div>
        </header>

        <div className="flex-1 space-y-3 overflow-y-auto p-4">
          {runs.length === 0 && (
            <p className="mt-16 text-center text-sm text-muted-foreground">
              No runs yet. Optimize a prompt and it will appear here.
            </p>
          )}
          {runs.map((run) => (
            <div key={run.id} className="glass rounded-xl p-3.5">
              <div className="flex items-center justify-between gap-2">
                <span className="badge">{run.detectedDomain}</span>
                <span className="text-[11px] text-muted-foreground">
                  {new Date(run.createdAt).toLocaleString()}
                </span>
              </div>
              <p className="mt-2 line-clamp-2 text-sm text-foreground/85">{run.original}</p>
              <div className="mt-2 flex items-center gap-3 text-[11px] text-muted-foreground tabular-nums">
                <span>C {run.scores.clarity}</span>
                <span>Cm {run.scores.completeness}</span>
                <span>E {run.scores.efficiency}</span>
              </div>
              <div className="mt-3 flex gap-2">
                <button onClick={() => onLoad(run)} className="chip chip-active text-xs">
                  Reload
                </button>
                <button onClick={() => onDelete(run.id)} className="chip text-xs">
                  Delete
                </button>
              </div>
            </div>
          ))}
        </div>
      </aside>
    </>
  );
}

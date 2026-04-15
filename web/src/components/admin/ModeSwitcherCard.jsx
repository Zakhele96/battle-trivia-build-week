export default function ModeSwitcherCard({
  value = "continuous",
  isSaving = false,
  onChange,
  onSave,
}) {
  const modes = [
    {
      key: "continuous",
      title: "Continuous",
      description: "Questions can keep cycling without daily time windows.",
    },
    {
      key: "scheduled",
      title: "Scheduled",
      description: "Only run inside configured daily live windows.",
    },
  ];

  return (
    <div className="rounded-[26px] border border-white/10 bg-neutral-950/80 p-5">
      <div className="flex items-center justify-between gap-3">
        <div>
          <h3 className="text-sm font-semibold text-white">Run mode</h3>
          <div className="mt-0.5 text-[11px] text-neutral-500">
            Choose how Battle Trivia operates
          </div>
        </div>

        <span className="rounded-full border border-white/10 bg-white/[0.04] px-3 py-1 text-[10px] uppercase tracking-[0.16em] text-neutral-400">
          Core
        </span>
      </div>

      <div className="mt-4 grid gap-3 md:grid-cols-2">
        {modes.map((mode) => {
          const active = value === mode.key;

          return (
            <button
              key={mode.key}
              type="button"
              onClick={() => onChange?.(mode.key)}
              className={`rounded-[22px] border p-4 text-left transition-all duration-200 ${
                active
                  ? "border-blue-400/20 bg-blue-500/10 ring-1 ring-blue-400/15"
                  : "border-white/8 bg-white/[0.03] hover:bg-white/[0.05]"
              }`}
            >
              <div className="flex items-center justify-between gap-3">
                <div>
                  <div className="text-sm font-semibold text-white">{mode.title}</div>
                  <div className="mt-1 text-sm leading-6 text-neutral-400">
                    {mode.description}
                  </div>
                </div>

                <span
                  className={`h-3 w-3 shrink-0 rounded-full ${
                    active ? "bg-blue-300 shadow-[0_0_10px_rgba(147,197,253,0.7)]" : "bg-neutral-600"
                  }`}
                />
              </div>
            </button>
          );
        })}
      </div>

      <div className="mt-4 flex justify-end">
        <button
          type="button"
          onClick={onSave}
          disabled={isSaving}
          className="rounded-[18px] bg-[linear-gradient(180deg,rgba(64,156,255,1)_0%,rgba(10,132,255,1)_100%)] px-4 py-2.5 text-sm font-semibold text-white shadow-[0_12px_28px_rgba(37,99,235,0.28)] transition-all duration-200 hover:-translate-y-[1px] disabled:cursor-not-allowed disabled:opacity-60"
        >
          {isSaving ? "Saving..." : "Save mode"}
        </button>
      </div>
    </div>
  );
}
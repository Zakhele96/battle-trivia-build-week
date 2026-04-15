export default function AdminStatusCard({
  runMode = "continuous",
  isLiveNow = false,
  questionsCount = 0,
  activeQuestionsCount = 0,
  nextWindowText = "—",
}) {
  const stats = [
    {
      label: "Mode",
      value: runMode === "scheduled" ? "Scheduled" : "Continuous",
      accent:
        runMode === "scheduled"
          ? "text-amber-300 bg-amber-500/10"
          : "text-blue-300 bg-blue-500/10",
    },
    {
      label: "Live",
      value: isLiveNow ? "Now" : "Standby",
      accent: isLiveNow
        ? "text-emerald-300 bg-emerald-500/10"
        : "text-neutral-300 bg-white/[0.04]",
    },
    {
      label: "Questions",
      value: `${questionsCount}`,
      accent: "text-white bg-white/[0.04]",
    },
    {
      label: "Active",
      value: `${activeQuestionsCount}`,
      accent: "text-violet-300 bg-violet-500/10",
    },
  ];

  return (
    <div className="rounded-[26px] border border-white/10 bg-neutral-950/80 p-5">
      <div className="flex items-center justify-between gap-3">
        <div>
          <h3 className="text-sm font-semibold text-white">Overview</h3>
          <div className="mt-0.5 text-[11px] text-neutral-500">
            Live configuration snapshot
          </div>
        </div>

        <div className="rounded-full border border-white/10 bg-white/[0.04] px-3 py-1 text-[10px] uppercase tracking-[0.16em] text-neutral-400">
          Status
        </div>
      </div>

      <div className="mt-4 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        {stats.map((item) => (
          <div
            key={item.label}
            className="rounded-[20px] border border-white/6 bg-white/[0.03] p-4"
          >
            <div className="text-[10px] uppercase tracking-[0.16em] text-neutral-500">
              {item.label}
            </div>
            <div className="mt-2 flex items-center gap-2">
              <span className={`rounded-full px-2.5 py-1 text-sm font-medium ${item.accent}`}>
                {item.value}
              </span>
            </div>
          </div>
        ))}
      </div>

      <div className="mt-4 rounded-[20px] border border-white/6 bg-white/[0.03] px-4 py-3">
        <div className="text-[10px] uppercase tracking-[0.16em] text-neutral-500">
          Next live window
        </div>
        <div className="mt-1 text-sm font-medium text-white">{nextWindowText}</div>
      </div>
    </div>
  );
}
export default function AdminPageHeader({
  title = "Trivia control",
  subtitle = "Manage questions, run mode, and scheduling.",
  status = "Ready",
}) {
  return (
    <div className="overflow-hidden rounded-[28px] border border-white/10 bg-[radial-gradient(circle_at_top,rgba(96,165,250,0.12),transparent_34%),linear-gradient(135deg,rgba(10,10,11,1)_0%,rgba(17,24,39,0.94)_52%,rgba(10,10,11,1)_100%)] shadow-2xl shadow-black/20">
      <div className="pointer-events-none h-px bg-white/10" />

      <div className="p-5 sm:p-6">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="min-w-0">
            <div className="text-[11px] uppercase tracking-[0.22em] text-blue-300/70">
              Admin
            </div>
            <h1 className="mt-2 text-[26px] font-semibold tracking-[-0.03em] text-white sm:text-[32px]">
              {title}
            </h1>
            <p className="mt-3 max-w-[42rem] text-sm leading-6 text-neutral-400 sm:text-[15px]">
              {subtitle}
            </p>
          </div>

          <div className="rounded-[22px] border border-white/10 bg-white/[0.04] px-4 py-3 text-right">
            <div className="text-[10px] uppercase tracking-[0.18em] text-neutral-500">
              System
            </div>
            <div className="mt-1 text-sm font-medium text-white">{status}</div>
          </div>
        </div>
      </div>
    </div>
  );
}
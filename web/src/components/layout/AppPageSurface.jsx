export function PageSectionHeader({
  eyebrow,
  title,
  description,
  action = null,
}) {
  return (
    <div className="mb-3 flex flex-wrap items-end justify-between gap-2.5 sm:mb-4">
      <div>
        <div className="text-[10px] uppercase tracking-[0.18em] text-neutral-500 sm:text-[11px]">
          {eyebrow}
        </div>
        <div className="mt-1 text-[16px] font-semibold tracking-[-0.03em] text-white sm:text-[19px]">
          {title}
        </div>
        {description ? (
          <div className="mt-1 text-[12px] leading-5 text-neutral-400 sm:mt-1.5 sm:text-[13px]">
            {description}
          </div>
        ) : null}
      </div>

      {action}
    </div>
  );
}

export function PageMobileSectionShell({
  eyebrow,
  title,
  description,
  children,
}) {
  return (
    <section className="rounded-[28px] border border-white/10 bg-[linear-gradient(180deg,rgba(18,22,31,0.98),rgba(8,10,16,0.98))] p-4 shadow-[0_18px_40px_rgba(0,0,0,0.2)] sm:rounded-none sm:border-0 sm:bg-transparent sm:p-0 sm:shadow-none">
      <div className="sm:hidden">
        <div className="text-[10px] uppercase tracking-[0.18em] text-blue-200/70">
          {eyebrow}
        </div>
        <h2 className="mt-2 text-[24px] font-semibold tracking-[-0.05em] text-white">
          {title}
        </h2>
        {description ? (
          <p className="mt-1.5 text-[13px] leading-6 text-neutral-400">
            {description}
          </p>
        ) : null}
      </div>

      <div className="mt-4 sm:mt-0">{children}</div>
    </section>
  );
}

export function PagePanel({ children, className = "" }) {
  return (
    <div
      className={`rounded-[20px] border border-white/10 bg-[linear-gradient(180deg,rgba(255,255,255,0.028),rgba(255,255,255,0.012))] p-3.5 sm:rounded-[24px] sm:p-4 ${className}`}
    >
      {children}
    </div>
  );
}

export function PageSummaryCard({
  eyebrow,
  title,
  value,
  detail,
  tone = "blue",
}) {
  const toneClassName =
    tone === "amber"
      ? "border-amber-300/18 bg-amber-400/10 text-amber-200"
      : tone === "emerald"
        ? "border-emerald-300/18 bg-emerald-400/10 text-emerald-200"
        : tone === "violet"
          ? "border-violet-300/18 bg-violet-500/10 text-violet-200"
          : "border-blue-300/18 bg-blue-400/10 text-blue-200";

  return (
    <div className="rounded-[18px] border border-white/10 bg-[linear-gradient(180deg,rgba(255,255,255,0.03),rgba(255,255,255,0.012))] p-3.5 transition hover:border-white/15 hover:bg-[linear-gradient(180deg,rgba(255,255,255,0.04),rgba(255,255,255,0.018))] sm:rounded-[20px] sm:p-4">
      <div className="flex items-start justify-between gap-3">
        <div className="text-[10px] uppercase tracking-[0.16em] text-neutral-500">
          {eyebrow}
        </div>
        <div
          className={`rounded-full border px-2.5 py-1 text-[9px] font-medium uppercase tracking-[0.14em] ${toneClassName}`}
        >
          Live
        </div>
      </div>
      <div className="mt-1.5 text-[16px] font-semibold tracking-[-0.03em] text-white sm:text-[17px]">
        {title}
      </div>
      <div className="mt-2 text-[22px] font-semibold tracking-[-0.05em] text-white sm:text-[24px]">
        {value}
      </div>
      <div className="mt-1 text-[12px] leading-5 text-neutral-400 sm:text-[13px]">
        {detail}
      </div>
    </div>
  );
}

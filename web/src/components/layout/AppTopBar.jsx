import { Link } from "react-router-dom";

function MobileAction({ to, label, tone = "default" }) {
  const toneClass =
    tone === "primary"
      ? "border-blue-400/20 bg-blue-500/10 text-blue-100"
      : "border-white/10 bg-white/[0.035] text-neutral-200";

  return (
    <Link
      to={to}
      className={`inline-flex shrink-0 items-center justify-center rounded-full border px-3 py-1.5 text-[11px] font-medium transition hover:border-white/15 hover:bg-white/[0.05] ${toneClass}`}
    >
      {label}
    </Link>
  );
}

function DesktopAction({ to, label, sublabel, primary = false }) {
  return (
    <Link
      to={to}
      className={`inline-flex min-w-[8.5rem] flex-col rounded-[16px] border px-3.5 py-2.5 text-left transition ${
        primary
          ? "border-blue-400/20 bg-blue-500/10 hover:border-blue-400/30 hover:bg-blue-500/15"
          : "border-white/10 bg-white/[0.03] hover:border-white/15 hover:bg-white/[0.05]"
      }`}
    >
      <span
        className={`text-[13px] font-medium ${
          primary ? "text-blue-100" : "text-white"
        }`}
      >
        {label}
      </span>

      {sublabel ? (
        <span className="mt-1 text-[10px] leading-4 text-neutral-500">
          {sublabel}
        </span>
      ) : null}
    </Link>
  );
}

export default function AppTopBar({
  eyebrow = "BTS",
  title,
  description,
  showBackToLobby = true,
  actions = [],
}) {
  const primaryAction = actions[0] || null;
  const secondaryActions = actions.slice(1);

  return (
    <div className="mb-5 sm:mb-7">
      <div className="border-b border-white/8 pb-4 sm:hidden">
        <div className="flex flex-col gap-3">
          <div className="flex flex-wrap items-center gap-2">
            {showBackToLobby ? (
              <Link
                to="/"
                className="inline-flex items-center gap-1.5 rounded-full border border-white/10 bg-white/[0.035] px-3 py-1.5 text-[10px] font-medium uppercase tracking-[0.14em] text-neutral-300 transition hover:border-white/15 hover:bg-white/[0.05]"
              >
                <span aria-hidden="true">←</span>
                Lobby
              </Link>
            ) : null}

            <div className="rounded-full border border-white/10 bg-white/[0.03] px-2.5 py-1 text-[9px] font-medium uppercase tracking-[0.16em] text-blue-300/75">
              {eyebrow}
            </div>
          </div>

          <div>
            <h1 className="text-[22px] font-semibold tracking-[-0.04em] text-white">
              {title}
            </h1>

            {description ? (
              <p className="mt-1.5 max-w-[38rem] text-[12px] leading-5 text-neutral-400">
                {description}
              </p>
            ) : null}
          </div>

          {actions.length > 0 ? (
            <div className="-mx-1 flex gap-2 overflow-x-auto px-1 pb-0.5">
              {primaryAction ? (
                <MobileAction
                  to={primaryAction.to}
                  label={primaryAction.label}
                  tone="primary"
                />
              ) : null}

              {secondaryActions.map((action) => (
                <MobileAction
                  key={`${action.to}-${action.label}`}
                  to={action.to}
                  label={action.label}
                />
              ))}
            </div>
          ) : null}
        </div>
      </div>

      <div className="hidden rounded-[26px] border border-white/10 bg-[radial-gradient(circle_at_top_left,rgba(59,130,246,0.08),transparent_28%),linear-gradient(180deg,rgba(255,255,255,0.03),rgba(255,255,255,0.012))] p-5 shadow-[0_18px_40px_rgba(0,0,0,0.14)] sm:block lg:p-6">
        <div className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              {showBackToLobby ? (
                <Link
                  to="/"
                  className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.03] px-3 py-1.5 text-[11px] font-medium uppercase tracking-[0.15em] text-neutral-300 transition hover:border-white/15 hover:bg-white/[0.05]"
                >
                  <span aria-hidden="true">←</span>
                  Back to lobby
                </Link>
              ) : null}

              <div className="rounded-full border border-white/10 bg-white/[0.03] px-3 py-1 text-[10px] font-medium uppercase tracking-[0.18em] text-blue-300/75">
                {eyebrow}
              </div>
            </div>

            <h1 className="mt-3 text-[32px] font-semibold tracking-[-0.04em] text-white lg:text-[36px]">
              {title}
            </h1>

            {description ? (
              <p className="mt-2 max-w-[44rem] text-[14px] leading-7 text-neutral-400">
                {description}
              </p>
            ) : null}
          </div>

          {actions.length > 0 ? (
            <div className="flex flex-wrap gap-2.5">
              {actions.map((action, index) => (
                <DesktopAction
                  key={`${action.to}-${action.label}`}
                  to={action.to}
                  label={action.label}
                  sublabel={action.sublabel}
                  primary={index === 0}
                />
              ))}
            </div>
          ) : null}
        </div>
      </div>
    </div>
  );
}
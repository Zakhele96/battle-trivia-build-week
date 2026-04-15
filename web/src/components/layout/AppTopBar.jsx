import { Link } from "react-router-dom";

function MobileAction({ to, label, tone = "default" }) {
  const toneClass =
    tone === "primary"
      ? "border-blue-400/20 bg-blue-500/10 text-blue-200"
      : "border-white/10 bg-white/[0.035] text-neutral-200";

  return (
    <Link
      to={to}
      className={`inline-flex items-center justify-center rounded-full border px-3.5 py-2 text-[12px] font-medium transition hover:border-white/15 hover:bg-white/[0.05] ${toneClass}`}
    >
      {label}
    </Link>
  );
}

function DesktopAction({ to, label, sublabel, primary = false }) {
  return (
    <Link
      to={to}
      className={`inline-flex min-w-[9rem] flex-col rounded-[18px] border px-4 py-3 text-left transition ${
        primary
          ? "border-blue-400/20 bg-blue-500/10 hover:border-blue-400/30 hover:bg-blue-500/15"
          : "border-white/10 bg-white/[0.035] hover:border-white/15 hover:bg-white/[0.05]"
      }`}
    >
      <span
        className={`text-sm font-medium ${
          primary ? "text-blue-100" : "text-white"
        }`}
      >
        {label}
      </span>

      {sublabel ? (
        <span className="mt-1 text-[11px] text-neutral-500">{sublabel}</span>
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
    <div className="mb-5 border-b border-white/8 pb-4 sm:mb-8 sm:rounded-[28px] sm:border sm:border-white/10 sm:bg-[linear-gradient(180deg,rgba(255,255,255,0.035),rgba(255,255,255,0.015))] sm:p-5 sm:pb-5 sm:shadow-[0_18px_44px_rgba(0,0,0,0.16)] lg:p-6">
      <div className="flex flex-col gap-4 sm:gap-5 lg:flex-row lg:items-end lg:justify-between">
        <div className="min-w-0">
          {showBackToLobby ? (
            <Link
              to="/"
              className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.035] px-3 py-1.5 text-[10px] font-medium uppercase tracking-[0.16em] text-neutral-300 transition hover:border-white/15 hover:bg-white/[0.05] sm:text-[11px]"
            >
              <span aria-hidden="true">←</span>
              Back to lobby
            </Link>
          ) : null}

          <div
            className={`${
              showBackToLobby ? "mt-3.5 sm:mt-4" : ""
            } text-[10px] uppercase tracking-[0.2em] text-blue-300/70 sm:text-[11px] sm:tracking-[0.22em]`}
          >
            {eyebrow}
          </div>

          <h1 className="mt-1.5 text-[24px] font-semibold tracking-[-0.04em] text-white sm:mt-2 sm:text-[36px]">
            {title}
          </h1>

          {description ? (
            <p className="mt-2 max-w-[42rem] text-[13px] leading-6 text-neutral-400 sm:mt-3 sm:text-[15px] sm:leading-7">
              {description}
            </p>
          ) : null}
        </div>

        {actions.length > 0 ? (
          <>
            <div className="flex flex-wrap gap-2 sm:hidden">
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

            <div className="hidden sm:flex sm:flex-wrap sm:gap-3">
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
          </>
        ) : null}
      </div>
    </div>
  );
}
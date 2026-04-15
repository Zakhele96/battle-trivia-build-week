import { Link } from "react-router-dom";

function TopAction({ to, label, sublabel }) {
  return (
    <Link
      to={to}
      className="inline-flex min-w-[9.5rem] flex-col rounded-[18px] border border-white/10 bg-white/[0.035] px-4 py-3 text-left transition hover:border-white/15 hover:bg-white/[0.05]"
    >
      <span className="text-sm font-medium text-white">{label}</span>
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
  return (
    <div className="mb-8 rounded-[28px] border border-white/10 bg-[linear-gradient(180deg,rgba(255,255,255,0.035),rgba(255,255,255,0.015))] p-4 shadow-[0_18px_44px_rgba(0,0,0,0.16)] sm:p-5 lg:p-6">
      <div className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
        <div className="min-w-0">
          {showBackToLobby ? (
            <Link
              to="/"
              className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.035] px-3 py-1.5 text-[11px] font-medium uppercase tracking-[0.16em] text-neutral-300 transition hover:border-white/15 hover:bg-white/[0.05]"
            >
              <span aria-hidden="true">←</span>
              Back to lobby
            </Link>
          ) : null}

          <div className={`${showBackToLobby ? "mt-4" : ""} text-[11px] uppercase tracking-[0.22em] text-blue-300/70`}>
            {eyebrow}
          </div>

          <h1 className="mt-2 text-[28px] font-semibold tracking-[-0.04em] text-white sm:text-[36px]">
            {title}
          </h1>

          {description ? (
            <p className="mt-3 max-w-[42rem] text-sm leading-7 text-neutral-400 sm:text-[15px]">
              {description}
            </p>
          ) : null}
        </div>

        {actions.length > 0 ? (
          <div className="flex flex-wrap gap-3">
            {actions.map((action) => (
              <TopAction
                key={`${action.to}-${action.label}`}
                to={action.to}
                label={action.label}
                sublabel={action.sublabel}
              />
            ))}
          </div>
        ) : null}
      </div>
    </div>
  );
}
import { Link } from "react-router-dom";
import { useTheme } from "../../hooks/useTheme";

function ActionShell({
  to,
  onClick,
  className,
  children,
  type = "button",
}) {
  if (to) {
    return (
      <Link to={to} className={className}>
        {children}
      </Link>
    );
  }

  return (
    <button type={type} onClick={onClick} className={className}>
      {children}
    </button>
  );
}

function MobileAction({ to, onClick, label, tone = "default", isLight = false }) {
  const toneClass =
    tone === "primary"
      ? isLight
        ? "border-sky-300 bg-sky-50 text-sky-800"
        : "border-blue-400/20 bg-blue-500/10 text-blue-100"
      : isLight
      ? "border-stone-200 bg-white/76 text-stone-700"
      : "border-white/10 bg-white/[0.035] text-neutral-200";

  return (
    <ActionShell
      to={to}
      onClick={onClick}
      className={`inline-flex shrink-0 items-center justify-center rounded-full border px-3 py-1.5 text-[11px] font-medium transition ${
        isLight ? "hover:border-stone-300 hover:bg-white" : "hover:border-white/15 hover:bg-white/[0.05]"
      } ${toneClass}`}
    >
      {label}
    </ActionShell>
  );
}

function DesktopAction({
  to,
  onClick,
  label,
  sublabel,
  primary = false,
  isLight = false,
}) {
  const cardClassName = primary
    ? isLight
      ? "border-sky-300 bg-white hover:border-sky-400 hover:bg-sky-50"
      : "border-blue-400/20 bg-blue-500/10 hover:border-blue-400/30 hover:bg-blue-500/15"
    : isLight
    ? "border-stone-200 bg-white/82 hover:border-stone-300 hover:bg-white"
    : "border-white/10 bg-white/[0.03] hover:border-white/15 hover:bg-white/[0.05]";
  const labelClassName = primary
    ? isLight
      ? "text-sky-800"
      : "text-blue-100"
    : isLight
    ? "text-stone-900"
    : "text-white";

  return (
    <ActionShell
      to={to}
      onClick={onClick}
      className={`inline-flex min-w-[8.5rem] flex-col rounded-[16px] border px-3.5 py-2.5 text-left transition ${cardClassName}`}
    >
      <span className={`text-[13px] font-medium ${labelClassName}`}>{label}</span>

      {sublabel ? (
        <span className={`mt-1 text-[10px] leading-4 ${isLight ? "text-stone-500" : "text-neutral-500"}`}>
          {sublabel}
        </span>
      ) : null}
    </ActionShell>
  );
}

export default function AppTopBar({
  eyebrow = "BTS",
  title,
  description,
  showBackToLobby = true,
  actions = [],
}) {
  const { resolvedTheme } = useTheme();
  const isLight = resolvedTheme === "light";
  const primaryAction = actions[0] || null;
  const secondaryActions = actions.slice(1);
  const mobileShellClassName = isLight
    ? "border-b border-stone-200 pb-4"
    : "border-b border-white/8 pb-4";
  const mobileBackClassName = isLight
    ? "inline-flex items-center gap-1.5 rounded-full border border-stone-200 bg-white/76 px-3 py-1.5 text-[10px] font-medium uppercase tracking-[0.14em] text-stone-700 transition hover:border-stone-300 hover:bg-white"
    : "inline-flex items-center gap-1.5 rounded-full border border-white/10 bg-white/[0.035] px-3 py-1.5 text-[10px] font-medium uppercase tracking-[0.14em] text-neutral-300 transition hover:border-white/15 hover:bg-white/[0.05]";
  const mobileEyebrowClassName = isLight
    ? "rounded-full border border-amber-300 bg-amber-50 px-2.5 py-1 text-[9px] font-medium uppercase tracking-[0.16em] text-amber-800"
    : "rounded-full border border-white/10 bg-white/[0.03] px-2.5 py-1 text-[9px] font-medium uppercase tracking-[0.16em] text-blue-300/75";
  const mobileTitleClassName = isLight
    ? "text-[22px] font-semibold tracking-[-0.04em] text-stone-900"
    : "text-[22px] font-semibold tracking-[-0.04em] text-white";
  const mobileDescClassName = isLight
    ? "mt-1.5 max-w-[38rem] text-[12px] leading-5 text-stone-600"
    : "mt-1.5 max-w-[38rem] text-[12px] leading-5 text-neutral-400";
  const desktopShellClassName = isLight
    ? "hidden rounded-[26px] border border-[#d8c3a0] bg-[radial-gradient(circle_at_top_left,rgba(59,130,246,0.08),transparent_28%),radial-gradient(circle_at_bottom_right,rgba(245,158,11,0.1),transparent_24%),linear-gradient(180deg,rgba(255,255,255,0.96),rgba(243,231,214,0.98))] p-5 shadow-[0_18px_40px_rgba(114,84,41,0.12)] sm:block lg:p-6"
    : "hidden rounded-[26px] border border-white/10 bg-[radial-gradient(circle_at_top_left,rgba(59,130,246,0.08),transparent_28%),linear-gradient(180deg,rgba(255,255,255,0.03),rgba(255,255,255,0.012))] p-5 shadow-[0_18px_40px_rgba(0,0,0,0.14)] sm:block lg:p-6";
  const desktopBackClassName = isLight
    ? "inline-flex items-center gap-2 rounded-full border border-stone-200 bg-white/82 px-3 py-1.5 text-[11px] font-medium uppercase tracking-[0.15em] text-stone-700 transition hover:border-stone-300 hover:bg-white"
    : "inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.03] px-3 py-1.5 text-[11px] font-medium uppercase tracking-[0.15em] text-neutral-300 transition hover:border-white/15 hover:bg-white/[0.05]";
  const desktopEyebrowClassName = isLight
    ? "rounded-full border border-amber-300 bg-amber-50 px-3 py-1 text-[10px] font-medium uppercase tracking-[0.18em] text-amber-800"
    : "rounded-full border border-white/10 bg-white/[0.03] px-3 py-1 text-[10px] font-medium uppercase tracking-[0.18em] text-blue-300/75";
  const desktopTitleClassName = isLight
    ? "mt-3 text-[32px] font-semibold tracking-[-0.04em] text-stone-900 lg:text-[36px]"
    : "mt-3 text-[32px] font-semibold tracking-[-0.04em] text-white lg:text-[36px]";
  const desktopDescClassName = isLight
    ? "mt-2 max-w-[44rem] text-[14px] leading-7 text-stone-600"
    : "mt-2 max-w-[44rem] text-[14px] leading-7 text-neutral-400";

  return (
    <div className="mb-5 sm:mb-7">
      <div className={`sm:hidden ${mobileShellClassName}`}>
        <div className="flex flex-col gap-3">
          <div className="flex flex-wrap items-center gap-2">
            {showBackToLobby ? (
              <Link to="/" className={mobileBackClassName}>
                <span aria-hidden="true">&larr;</span>
                Lobby
              </Link>
            ) : null}

            <div className={mobileEyebrowClassName}>{eyebrow}</div>
          </div>

          <div>
            <h1 className={mobileTitleClassName}>{title}</h1>

            {description ? <p className={mobileDescClassName}>{description}</p> : null}
          </div>

          {actions.length > 0 ? (
            <div className="-mx-1 flex gap-2 overflow-x-auto px-1 pb-0.5">
              {primaryAction ? (
                <MobileAction
                  to={primaryAction.to}
                  onClick={primaryAction.onClick}
                  label={primaryAction.label}
                  tone="primary"
                  isLight={isLight}
                />
              ) : null}

              {secondaryActions.map((action) => (
                <MobileAction
                  key={`${action.to || action.label}-${action.label}`}
                  to={action.to}
                  onClick={action.onClick}
                  label={action.label}
                  isLight={isLight}
                />
              ))}
            </div>
          ) : null}
        </div>
      </div>

      <div className={desktopShellClassName}>
        <div className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              {showBackToLobby ? (
                <Link to="/" className={desktopBackClassName}>
                  <span aria-hidden="true">&larr;</span>
                  Back to lobby
                </Link>
              ) : null}

              <div className={desktopEyebrowClassName}>{eyebrow}</div>
            </div>

            <h1 className={desktopTitleClassName}>{title}</h1>

            {description ? <p className={desktopDescClassName}>{description}</p> : null}
          </div>

          {actions.length > 0 ? (
            <div className="flex flex-wrap gap-2.5">
              {actions.map((action, index) => (
                <DesktopAction
                  key={`${action.to || action.label}-${action.label}`}
                  to={action.to}
                  onClick={action.onClick}
                  label={action.label}
                  sublabel={action.sublabel}
                  primary={index === 0}
                  isLight={isLight}
                />
              ))}
            </div>
          ) : null}
        </div>
      </div>
    </div>
  );
}

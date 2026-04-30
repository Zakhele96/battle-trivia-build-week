import { Link, useNavigate } from "react-router-dom";
import AppSectionNav from "../components/layout/AppSectionNav";
import AppTopBar from "../components/layout/AppTopBar";
import { useAlerts } from "../context/AlertsContext";
import { useTheme } from "../hooks/useTheme";

function SummaryCard({ label, value, detail, accent = "blue" }) {
  const accentClassName =
    accent === "amber"
      ? "border-amber-300/18 bg-amber-400/10 text-amber-200"
      : accent === "emerald"
        ? "border-emerald-300/18 bg-emerald-400/10 text-emerald-200"
        : "border-blue-300/18 bg-blue-400/10 text-blue-200";

  return (
    <div className="rounded-[18px] border border-white/10 bg-[linear-gradient(180deg,rgba(255,255,255,0.03),rgba(255,255,255,0.012))] p-3.5 transition hover:border-white/15 hover:bg-[linear-gradient(180deg,rgba(255,255,255,0.04),rgba(255,255,255,0.018))] sm:rounded-[20px] sm:p-4">
      <div className="flex items-start justify-between gap-3">
        <div className="text-[10px] uppercase tracking-[0.16em] text-neutral-500">
          {label}
        </div>
        <div className={`rounded-full border px-2.5 py-1 text-[9px] font-medium uppercase tracking-[0.14em] ${accentClassName}`}>
          Live
        </div>
      </div>
      <div className="mt-1.5 text-[16px] font-semibold tracking-[-0.03em] text-white sm:text-[17px]">
        {label}
      </div>
      <div className="mt-2 text-[22px] font-semibold tracking-[-0.05em] text-white sm:text-[24px]">
        {value}
      </div>
      <div className="mt-1 text-[12px] leading-5 text-neutral-400 sm:text-[13px]">{detail}</div>
    </div>
  );
}

function SectionShell({ children }) {
  return (
    <section className="rounded-[20px] border border-white/10 bg-[linear-gradient(180deg,rgba(255,255,255,0.028),rgba(255,255,255,0.012))] p-3.5 sm:rounded-[24px] sm:p-4">
      {children}
    </section>
  );
}

function AlertCard({ item, isRead = false, onMarkRead, onPrimaryAction }) {
  const toneClass =
    item.tone === "amber"
      ? "border-amber-300/18 bg-amber-400/10 text-amber-100"
      : item.tone === "emerald"
        ? "border-emerald-300/18 bg-emerald-400/10 text-emerald-100"
        : item.tone === "violet"
          ? "border-violet-300/18 bg-violet-500/10 text-violet-100"
          : "border-blue-300/18 bg-blue-500/10 text-blue-100";

  return (
    <div
      className={`rounded-[20px] border p-4 transition ${
        isRead
          ? "border-white/8 bg-white/[0.02] opacity-80"
          : "border-white/10 bg-white/[0.04]"
      }`}
    >
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div className="min-w-0 flex-1">
          <div className="mb-2 flex items-center gap-2">
            {!isRead ? (
              <span className="h-2.5 w-2.5 rounded-full bg-sky-300 shadow-[0_0_0_4px_rgba(125,211,252,0.12)]" />
            ) : null}
            <span className="text-[10px] font-medium uppercase tracking-[0.16em] text-neutral-500">
              {isRead ? "Read" : "Unread"}
            </span>
          </div>

          <div
            className={`inline-flex rounded-full border px-2.5 py-1 text-[10px] font-medium uppercase tracking-[0.14em] ${toneClass}`}
          >
            {item.kind}
          </div>
          <div className="mt-3 text-[16px] font-semibold tracking-[-0.03em] text-white">
            {item.title}
          </div>
          <div className="mt-1 text-[13px] leading-6 text-neutral-400">
            {item.detail}
          </div>
        </div>

        <div className="flex shrink-0 flex-wrap items-center gap-2 self-start sm:self-auto">
          {!isRead ? (
            <button
              type="button"
              onClick={() => onMarkRead?.(item.id)}
              className="rounded-full border border-white/10 bg-white/[0.04] px-3 py-1.5 text-[11px] font-semibold uppercase tracking-[0.14em] text-neutral-200 transition hover:bg-white/[0.08]"
            >
              Mark read
            </button>
          ) : null}

          {item.ctaTo ? (
            <Link
              to={item.ctaTo}
              onClick={(event) => onPrimaryAction?.(item, event)}
              className="rounded-full border border-white/10 bg-white/[0.04] px-3 py-1.5 text-[11px] font-semibold uppercase tracking-[0.14em] text-white transition hover:bg-white/[0.08]"
            >
              {item.ctaLabel || "Open"}
            </Link>
          ) : null}
        </div>
      </div>
    </div>
  );
}

export default function AlertsPage() {
  const navigate = useNavigate();
  const {
    alerts,
    acceptInboxChallenge,
    acceptInboxFriendRequest,
    error,
    isLoading: loading,
    markAlertRead,
    markAllAlertsRead,
    readAlertIds,
    resetAlertInbox,
    unreadCount,
  } = useAlerts();
  const { resolvedTheme } = useTheme();

  const handlePrimaryAction = async (item, event) => {
    markAlertRead(item?.id);

    if (item?.actionType !== "accept-challenge" || !item?.challengeInviteId) {
      if (item?.actionType !== "accept-friend-request" || !item?.friendshipId) {
        return;
      }

      event?.preventDefault?.();

      try {
        await acceptInboxFriendRequest(item.friendshipId);
      } finally {
        navigate(item.ctaTo || "/profile");
      }

      return;
    }

    event?.preventDefault?.();

    try {
      await acceptInboxChallenge(item.challengeInviteId);
    } finally {
      navigate(item.ctaTo || "/leaderboards?mode=battle-trivia&period=current");
    }
  };

  const isLight = resolvedTheme === "light";
  const unreadAlerts = alerts.filter((item) => !readAlertIds.includes(item.id));
  const actionAlerts = unreadAlerts.filter((item) => item.ctaTo).length;
  const latestAlertLabel = alerts[0]?.kind || "Quiet";
  const lightModeUndoFilter = isLight
    ? {
        filter:
          "invert(1) hue-rotate(180deg) saturate(1.08) contrast(1.08) brightness(0.97)",
      }
    : undefined;

  return (
    <div
      className={`alerts-page min-h-screen bg-neutral-950 text-white ${
        isLight ? "alerts-page--light" : ""
      }`}
      style={lightModeUndoFilter}
    >
      <div className="mx-auto w-full max-w-[76rem] px-4 py-4 pb-24 sm:px-5 sm:py-7 sm:pb-7 lg:px-6 lg:py-9">
        <AppSectionNav />

        <AppTopBar
          eyebrow="Alerts"
          title="What needs your attention"
          description="Live pressure, recap-ready moments, and squad movement in one place."
          actions={[
            unreadCount > 0
              ? {
                  label: `Mark all read (${unreadCount})`,
                  onClick: markAllAlertsRead,
                }
              : null,
            readAlertIds.length > 0
              ? {
                  label: "Reset inbox",
                  onClick: resetAlertInbox,
                }
              : null,
          ].filter(Boolean)}
        />

        <div className="mb-6 grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
          <SummaryCard
            label="Unread"
            value={unreadCount}
            detail="Fresh alerts that still need a read or an action."
            accent="blue"
          />
          <SummaryCard
            label="Actionable"
            value={actionAlerts}
            detail="Alerts that can take you somewhere immediately."
            accent="emerald"
          />
          <SummaryCard
            label="Latest tone"
            value={latestAlertLabel}
            detail="The most recent kind of alert currently at the top of the inbox."
            accent="amber"
          />
        </div>

        {error ? (
          <div className="mb-4 rounded-[18px] border border-red-900/35 bg-red-950/25 px-4 py-3 text-sm text-red-300/90">
            {error}
          </div>
        ) : null}

        {loading ? (
          <SectionShell>
            <div className="rounded-[20px] border border-white/10 bg-white/[0.03] px-4 py-10 text-center text-sm text-neutral-500">
              Loading alerts...
            </div>
          </SectionShell>
        ) : alerts.length === 0 ? (
          <SectionShell>
            <div className="rounded-[20px] border border-white/10 bg-white/[0.03] px-4 py-10 text-center text-sm text-neutral-500">
              No alerts right now. Play a few rounds, climb a board, or build a squad and this page will light up.
            </div>
          </SectionShell>
        ) : (
          <SectionShell>
            <div className="mb-4 flex flex-wrap items-end justify-between gap-3">
              <div>
                <div className="text-[10px] uppercase tracking-[0.18em] text-neutral-500">
                  Inbox flow
                </div>
                <div className="mt-1 text-[17px] font-semibold tracking-[-0.03em] text-white">
                  Alerts ordered for quick triage
                </div>
                <div className="mt-1 text-[12px] leading-5 text-neutral-400">
                  Unread items stay visually louder so you can scan, act, and clear pressure quickly.
                </div>
              </div>
            </div>

            <div className="space-y-3">
              {alerts.map((item) => (
                <AlertCard
                  key={item.id}
                  item={item}
                  isRead={readAlertIds.includes(item.id)}
                  onMarkRead={markAlertRead}
                  onPrimaryAction={handlePrimaryAction}
                />
              ))}
            </div>
          </SectionShell>
        )}
      </div>
    </div>
  );
}

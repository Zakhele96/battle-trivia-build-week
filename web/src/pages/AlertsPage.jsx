import { Link, useNavigate } from "react-router-dom";
import AppSectionNav from "../components/layout/AppSectionNav";
import AppTopBar from "../components/layout/AppTopBar";
import { useAlerts } from "../context/AlertsContext";
import { useTheme } from "../hooks/useTheme";

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
      navigate(item.ctaTo || "/leaderboards?mode=combined&period=current");
    }
  };

  const isLight = resolvedTheme === "light";
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

        {error ? (
          <div className="mb-4 rounded-[18px] border border-red-900/35 bg-red-950/25 px-4 py-3 text-sm text-red-300/90">
            {error}
          </div>
        ) : null}

        {loading ? (
          <div className="rounded-[20px] border border-white/10 bg-white/[0.03] px-4 py-10 text-center text-sm text-neutral-500">
            Loading alerts...
          </div>
        ) : alerts.length === 0 ? (
          <div className="rounded-[20px] border border-white/10 bg-white/[0.03] px-4 py-10 text-center text-sm text-neutral-500">
            No alerts right now. Play a few rounds, climb a board, or build a squad and this page will light up.
          </div>
        ) : (
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
        )}
      </div>
    </div>
  );
}

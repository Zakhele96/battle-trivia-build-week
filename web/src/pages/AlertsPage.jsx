import { Link, useNavigate } from "react-router-dom";
import AppSectionNav from "../components/layout/AppSectionNav";
import AppTopBar from "../components/layout/AppTopBar";
import { useAlerts } from "../context/AlertsContext";
import { useTheme } from "../hooks/useTheme";

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
      className={`rounded-[18px] border p-4 transition sm:rounded-[20px] ${
        isRead
          ? "border-white/8 bg-white/[0.018]"
          : "border-blue-300/14 bg-[linear-gradient(180deg,rgba(59,130,246,0.07),rgba(255,255,255,0.025))]"
      }`}
    >
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            {!isRead ? (
              <span className="h-2 w-2 rounded-full bg-sky-300 shadow-[0_0_0_4px_rgba(125,211,252,0.1)]" />
            ) : null}
            <div
              className={`inline-flex rounded-full border px-2.5 py-1 text-[9px] font-medium uppercase tracking-[0.14em] ${toneClass}`}
            >
              {item.kind}
            </div>
          </div>
          <div className={`mt-3 text-[16px] font-semibold tracking-[-0.03em] ${isRead ? "text-neutral-200" : "text-white"}`}>
            {item.title}
          </div>
          <div className={`mt-1 text-[13px] leading-6 ${isRead ? "text-neutral-500" : "text-neutral-400"}`}>
            {item.detail}
          </div>
        </div>

        <div className="flex shrink-0 flex-wrap items-center gap-2 self-stretch sm:self-auto">
          {!isRead ? (
            <button
              type="button"
              onClick={() => onMarkRead?.(item.id)}
              className="min-h-10 flex-1 rounded-[14px] border border-white/10 bg-white/[0.04] px-3 py-2 text-[11px] font-semibold text-neutral-300 transition hover:bg-white/[0.08] sm:flex-none"
            >
              Mark read
            </button>
          ) : null}

          {item.ctaTo ? (
            <Link
              to={item.ctaTo}
              onClick={(event) => onPrimaryAction?.(item, event)}
              className={`min-h-10 flex-1 rounded-[14px] px-3 py-2 text-center text-[11px] font-semibold transition sm:flex-none ${
                isRead
                  ? "border border-white/10 bg-white/[0.04] text-neutral-200 hover:bg-white/[0.08]"
                  : "bg-blue-500 text-white shadow-[0_10px_24px_rgba(37,99,235,0.2)] hover:bg-blue-400"
              }`}
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
  const readAlerts = alerts.filter((item) => readAlertIds.includes(item.id));
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
      <div className="mx-auto w-full max-w-[76rem] px-4 py-4 pb-24 sm:px-5 sm:py-7 md:pb-7 lg:px-6 lg:py-9">
        <AppSectionNav />

        <AppTopBar
          eyebrow="Alerts"
          title="Your alerts"
          description="Handle what needs attention now, then move on."
          actions={[
            unreadCount > 0
              ? {
                  label: `Mark all read (${unreadCount})`,
                  onClick: markAllAlertsRead,
                }
              : null,
            readAlertIds.length > 0
              ? {
                  label: "Mark all unread",
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
          <SectionShell>
            <div className="rounded-[20px] border border-white/10 bg-white/[0.03] px-4 py-10 text-center text-sm text-neutral-500">
              Loading alerts...
            </div>
          </SectionShell>
        ) : alerts.length === 0 ? (
          <SectionShell>
            <div className="rounded-[20px] border border-white/10 bg-white/[0.03] px-5 py-12 text-center">
              <div className="text-[18px] font-semibold tracking-[-0.03em] text-white">
                You&apos;re all caught up
              </div>
              <div className="mx-auto mt-2 max-w-[30rem] text-sm leading-6 text-neutral-500">
                New challenges, friend requests, and competition updates will appear here.
              </div>
            </div>
          </SectionShell>
        ) : (
          <div className="space-y-5 sm:space-y-6">
            <SectionShell>
              <div className="mb-4 flex items-end justify-between gap-3">
                <div>
                  <div className="text-[10px] uppercase tracking-[0.18em] text-blue-200/70">
                    Inbox
                  </div>
                  <h2 className="mt-1 text-[21px] font-semibold tracking-[-0.04em] text-white">
                    Needs attention
                  </h2>
                  <p className="mt-1 text-[12px] leading-5 text-neutral-500">
                    New activity and actions waiting for you.
                  </p>
                </div>
                <div className="rounded-full border border-blue-300/16 bg-blue-500/10 px-2.5 py-1 text-[11px] font-semibold text-blue-100">
                  {unreadAlerts.length}
                </div>
              </div>

              {unreadAlerts.length === 0 ? (
                <div className="rounded-[18px] border border-emerald-300/14 bg-emerald-500/[0.06] px-4 py-6 text-center">
                  <div className="text-sm font-semibold text-emerald-100">
                    Nothing needs attention
                  </div>
                  <div className="mt-1 text-[12px] text-neutral-500">
                    Your earlier activity is available below.
                  </div>
                </div>
              ) : (
                <div className="space-y-3">
                  {unreadAlerts.map((item) => (
                    <AlertCard
                      key={item.id}
                      item={item}
                      onMarkRead={markAlertRead}
                      onPrimaryAction={handlePrimaryAction}
                    />
                  ))}
                </div>
              )}
            </SectionShell>

            {readAlerts.length > 0 ? (
              <details className="group rounded-[20px] border border-white/8 bg-white/[0.018] p-3.5 sm:rounded-[24px] sm:p-4">
                <summary className="flex cursor-pointer list-none items-center justify-between gap-3 rounded-[16px] px-1 py-1 text-left [&::-webkit-details-marker]:hidden">
                  <div>
                    <div className="text-[10px] uppercase tracking-[0.18em] text-neutral-600">
                      History
                    </div>
                    <div className="mt-1 text-[16px] font-semibold tracking-[-0.03em] text-neutral-300">
                      Earlier activity
                    </div>
                  </div>
                  <div className="flex items-center gap-2 text-[11px] text-neutral-500">
                    <span>{readAlerts.length}</span>
                    <span className="transition group-open:rotate-180" aria-hidden="true">
                      &darr;
                    </span>
                  </div>
                </summary>

                <div className="mt-4 space-y-3 border-t border-white/8 pt-4">
                  {readAlerts.map((item) => (
                    <AlertCard
                      key={item.id}
                      item={item}
                      isRead
                      onMarkRead={markAlertRead}
                      onPrimaryAction={handlePrimaryAction}
                    />
                  ))}
                </div>
              </details>
            ) : null}
          </div>
        )}
      </div>
    </div>
  );
}

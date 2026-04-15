import { useState } from "react";

const SLOW_MODE_OPTIONS = [0, 5, 10, 30];

function formatActionTime(value) {
  if (!value) return "";
  return new Intl.DateTimeFormat(undefined, {
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(value));
}

function getActionLabel(action) {
  switch (action.actionType) {
    case "mute":
      return action.targetDisplayName
        ? `Muted ${action.targetDisplayName}`
        : "Muted user";
    case "unmute":
      return action.targetDisplayName
        ? `Unmuted ${action.targetDisplayName}`
        : "Unmuted user";
    case "delete_message":
      return "Deleted a message";
    case "slow_mode":
      return "Updated slow mode";
    default:
      return action.actionType;
  }
}

export default function RoomModerationControlCard({
  roomName,
  slowModeSeconds = 0,
  onUpdateSlowMode,
  moderationActions = [],
  isLoadingActions = false,
}) {
  const [busyValue, setBusyValue] = useState(null);

  async function handleSelect(value) {
    if (!onUpdateSlowMode || busyValue !== null || value === slowModeSeconds) {
      return;
    }

    try {
      setBusyValue(value);
      await onUpdateSlowMode(value);
    } finally {
      setBusyValue(null);
    }
  }

  return (
    <div className="rounded-[22px] border border-white/10 bg-neutral-950/80 p-3.5">
      <div className="mb-3 flex items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="text-sm font-semibold text-white">Moderation</div>
          <div className="mt-0.5 text-[11px] text-neutral-500">
            {roomName || "Room"} controls
          </div>
        </div>

        <span className="rounded-full border border-blue-400/20 bg-blue-500/10 px-2 py-0.5 text-[9px] font-semibold uppercase tracking-[0.14em] text-blue-200">
          Admin
        </span>
      </div>

      <div className="mb-2 text-[10px] uppercase tracking-[0.14em] text-neutral-500">
        Slow mode
      </div>

      <div className="grid grid-cols-4 gap-2">
        {SLOW_MODE_OPTIONS.map((value) => {
          const isActive = value === slowModeSeconds;
          const isBusy = busyValue === value;

          return (
            <button
              key={value}
              type="button"
              onClick={() => handleSelect(value)}
              disabled={busyValue !== null}
              className={`rounded-[14px] border px-2 py-2 text-[11px] font-medium transition-all duration-200 ${
                isActive
                  ? "border-blue-400/25 bg-blue-500/12 text-blue-200"
                  : "border-white/8 bg-white/[0.03] text-neutral-300 hover:bg-white/[0.06]"
              } disabled:opacity-60`}
            >
              {isBusy ? "..." : value === 0 ? "Off" : `${value}s`}
            </button>
          );
        })}
      </div>

      <div className="mt-3 rounded-[16px] border border-white/6 bg-white/[0.03] px-3 py-2 text-[11px] text-neutral-400">
        {slowModeSeconds > 0
          ? `Users can send one message every ${slowModeSeconds} seconds.`
          : "Users can chat without slow mode."}
      </div>

      <div className="mt-4">
        <div className="mb-2 text-[10px] uppercase tracking-[0.14em] text-neutral-500">
          Recent actions
        </div>

        {isLoadingActions ? (
          <div className="rounded-[16px] border border-white/6 bg-white/[0.03] px-3 py-3 text-[11px] text-neutral-500">
            Loading moderation activity...
          </div>
        ) : moderationActions.length === 0 ? (
          <div className="rounded-[16px] border border-white/6 bg-white/[0.03] px-3 py-3 text-[11px] text-neutral-500">
            No moderation actions yet.
          </div>
        ) : (
          <div className="space-y-2">
            {moderationActions.map((action) => (
              <div
                key={action.id}
                className="rounded-[16px] border border-white/6 bg-white/[0.03] px-3 py-2.5"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <div className="text-[11px] font-medium text-white">
                      {getActionLabel(action)}
                    </div>
                    <div className="mt-0.5 text-[10px] text-neutral-500">
                      by {action.createdByDisplayName || "Unknown"}
                    </div>
                    {action.reason ? (
                      <div className="mt-1 text-[10px] text-neutral-400">
                        {action.reason}
                      </div>
                    ) : null}
                  </div>

                  <div className="shrink-0 text-[10px] text-neutral-500">
                    {formatActionTime(action.createdAt)}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
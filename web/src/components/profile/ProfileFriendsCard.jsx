import { Link } from "react-router-dom";

function getInitials(value) {
  if (!value) return "P";

  const parts = String(value).trim().split(/\s+/).filter(Boolean);
  if (parts.length === 1) return parts[0].charAt(0).toUpperCase();

  return `${parts[0].charAt(0)}${parts[1].charAt(0)}`.toUpperCase();
}

function FriendAvatar({ name, avatarUrl }) {
  return (
    <div className="h-11 w-11 shrink-0 overflow-hidden rounded-full border border-white/10 bg-white/[0.05]">
      {avatarUrl ? (
        <img src={avatarUrl} alt={name} className="h-full w-full object-cover" />
      ) : (
        <div className="flex h-full w-full items-center justify-center text-xs font-semibold text-white">
          {getInitials(name)}
        </div>
      )}
    </div>
  );
}

function PlayerMeta({ item }) {
  const displayName = item.displayName || item.username;
  const statusLine = item.statusMessage || `@${item.username}`;

  return (
    <div className="min-w-0 flex-1">
      <div className="break-words text-sm font-medium text-white">{displayName}</div>
      <div className="mt-1 break-all text-[11px] text-neutral-500">@{item.username}</div>
      <div className="mt-1 break-words text-[12px] leading-5 text-neutral-400">
        {statusLine}
      </div>
    </div>
  );
}

function PlayerRowActions({ item, actionLabel, onAction, tone = "blue", disabled = false }) {
  const buttonClass =
    tone === "emerald"
      ? "border-emerald-400/20 bg-emerald-500/10 text-emerald-100 hover:bg-emerald-500/15"
      : tone === "rose"
        ? "border-rose-400/20 bg-rose-500/10 text-rose-100 hover:bg-rose-500/15"
        : "border-blue-300/18 bg-blue-400/10 text-blue-100 hover:bg-blue-400/15";

  return (
    <div className="flex shrink-0 flex-wrap gap-2 self-start">
      <Link
        to={`/profile/${item.userId}`}
        className="rounded-full border border-white/10 bg-white/[0.04] px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.14em] text-white transition hover:bg-white/[0.08]"
      >
        View profile
      </Link>

      {onAction ? (
        <button
          type="button"
          onClick={() => onAction(item)}
          disabled={disabled}
          className={`rounded-full border px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.14em] transition disabled:cursor-not-allowed disabled:opacity-45 ${buttonClass}`}
        >
          {actionLabel}
        </button>
      ) : null}
    </div>
  );
}

function NetworkList({
  title,
  items = [],
  emptyMessage,
  actionLabel,
  onAction,
  tone = "blue",
}) {
  return (
    <div className="rounded-[18px] border border-white/8 bg-black/20 p-4">
      <div className="mb-3 text-[10px] uppercase tracking-[0.16em] text-neutral-500">
        {title}
      </div>

      {items.length === 0 ? (
        <div className="text-sm text-neutral-500">{emptyMessage}</div>
      ) : (
        <div className="space-y-2.5">
          {items.map((item) => (
            <div
              key={`${title}-${item.friendshipId || item.userId}`}
              className="flex flex-col gap-3 rounded-[14px] border border-white/8 bg-white/[0.03] px-3 py-3"
            >
              <div className="flex items-start gap-3">
                <FriendAvatar
                  name={item.displayName || item.username}
                  avatarUrl={item.avatarUrl}
                />
                <PlayerMeta item={item} />
              </div>

              <PlayerRowActions
                item={item}
                actionLabel={actionLabel}
                onAction={onAction}
                tone={tone}
              />
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default function ProfileFriendsCard({
  searchQuery,
  onSearchQueryChange,
  onSearch,
  searchResults = [],
  network,
  loading = false,
  onSendRequest,
  onAcceptRequest,
  onDeclineRequest,
}) {
  if (loading) {
    return (
      <div className="rounded-[24px] border border-white/10 bg-white/[0.03] p-5">
        <div className="text-sm text-neutral-500">Loading friends...</div>
      </div>
    );
  }

  return (
    <div className="rounded-[24px] border border-white/10 bg-white/[0.03] p-5">
      <div className="mb-4">
        <div className="text-sm font-semibold text-white">Friends and rivals</div>
        <div className="mt-1 text-[12px] leading-5 text-neutral-400">
          Build a real social circle around the board, then compare against people you actually know.
        </div>
      </div>

      <form onSubmit={onSearch} className="mb-4 flex flex-col gap-2 sm:flex-row">
        <input
          value={searchQuery}
          onChange={(event) => onSearchQueryChange(event.target.value)}
          placeholder="Search username, display name, or email"
          className="flex-1 rounded-[16px] border border-white/10 bg-white/[0.03] px-4 py-3 text-sm text-white outline-none focus:border-blue-400/20"
        />
        <button
          type="submit"
          className="rounded-[16px] bg-white px-4 py-3 text-sm font-semibold text-neutral-950 transition hover:bg-neutral-200"
        >
          Search players
        </button>
      </form>

      {searchResults.length > 0 ? (
        <div className="mb-4 rounded-[18px] border border-white/8 bg-black/20 p-4">
          <div className="mb-3 text-[10px] uppercase tracking-[0.16em] text-neutral-500">
            Search results
          </div>
          <div className="space-y-2.5">
            {searchResults.map((player) => {
              const actionLabel =
                player.status === "accepted"
                  ? "Friends"
                  : player.status === "pending" && player.initiatedByMe
                    ? "Pending"
                    : player.status === "pending"
                      ? "Awaiting you"
                      : "Add friend";

              return (
                <div
                  key={player.userId}
                  className="flex flex-col gap-3 rounded-[14px] border border-white/8 bg-white/[0.03] px-3 py-3"
                >
                  <div className="flex items-start gap-3">
                    <FriendAvatar
                      name={player.displayName || player.username}
                      avatarUrl={player.avatarUrl}
                    />
                    <PlayerMeta item={player} />
                  </div>

                  <PlayerRowActions
                    item={player}
                    actionLabel={actionLabel}
                    onAction={onSendRequest}
                    disabled={player.status !== "none"}
                  />
                </div>
              );
            })}
          </div>
        </div>
      ) : null}

      <div className="grid gap-4 lg:grid-cols-3">
        <NetworkList
          title="Friends"
          items={network?.friends || []}
          emptyMessage="No friends added yet."
        />
        <NetworkList
          title="Incoming"
          items={network?.incomingRequests || []}
          emptyMessage="No incoming requests."
          actionLabel="Accept"
          onAction={onAcceptRequest}
          tone="emerald"
        />
        <NetworkList
          title="Outgoing"
          items={network?.outgoingRequests || []}
          emptyMessage="No outgoing requests."
          actionLabel="Cancel"
          onAction={onDeclineRequest}
          tone="rose"
        />
      </div>
    </div>
  );
}

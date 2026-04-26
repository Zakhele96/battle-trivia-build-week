function NetworkList({ title, items = [], emptyMessage, actionLabel, onAction, tone = "blue" }) {
  const buttonClass =
    tone === "emerald"
      ? "border-emerald-400/20 bg-emerald-500/10 text-emerald-100 hover:bg-emerald-500/15"
      : tone === "rose"
      ? "border-rose-400/20 bg-rose-500/10 text-rose-100 hover:bg-rose-500/15"
      : "border-blue-300/18 bg-blue-400/10 text-blue-100 hover:bg-blue-400/15";

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
              className="flex items-center justify-between gap-3 rounded-[14px] border border-white/8 bg-white/[0.03] px-3 py-2.5"
            >
              <div className="min-w-0">
                <div className="truncate text-sm font-medium text-white">
                  {item.displayName || item.username}
                </div>
                <div className="mt-1 text-[11px] text-neutral-500">@{item.username}</div>
              </div>

              {onAction ? (
                <button
                  type="button"
                  onClick={() => onAction(item)}
                  className={`shrink-0 rounded-full border px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.14em] transition ${buttonClass}`}
                >
                  {actionLabel}
                </button>
              ) : null}
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
                  className="flex items-center justify-between gap-3 rounded-[14px] border border-white/8 bg-white/[0.03] px-3 py-2.5"
                >
                  <div className="min-w-0">
                    <div className="truncate text-sm font-medium text-white">
                      {player.displayName || player.username}
                    </div>
                    <div className="mt-1 text-[11px] text-neutral-500">@{player.username}</div>
                  </div>

                  <button
                    type="button"
                    disabled={player.status !== "none"}
                    onClick={() => onSendRequest?.(player)}
                    className="shrink-0 rounded-full border border-blue-300/18 bg-blue-400/10 px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.14em] text-blue-100 transition hover:bg-blue-400/15 disabled:cursor-not-allowed disabled:opacity-45"
                  >
                    {actionLabel}
                  </button>
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

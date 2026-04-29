import ArenaChallengeCard from "./ArenaChallengeCard";
import ArenaChallengeDetailCard from "./ArenaChallengeDetailCard";

const tabs = [
  { key: "chat", label: "Chat" },
  { key: "open", label: "Open" },
  { key: "voting", label: "Voting" },
  { key: "winners", label: "Winners" },
  { key: "hall", label: "Hall of Bars" },
  { key: "rankings", label: "Rankings" },
];

function ArenaEmptyState({ text }) {
  return (
    <div className="rounded-[22px] border border-dashed border-white/10 bg-white/[0.02] p-5 text-center text-sm text-neutral-500">
      {text}
    </div>
  );
}

function ArenaHeaderNotice({ arenaNotice }) {
  if (!arenaNotice?.message) return null;

  return (
    <div
      className={`rounded-[20px] border px-4 py-3 text-sm shadow-[0_12px_28px_rgba(0,0,0,0.16)] ${
        arenaNotice.tone === "success"
          ? "border-emerald-400/20 bg-emerald-500/10 text-emerald-100"
          : "border-amber-400/18 bg-amber-500/10 text-amber-100"
      }`}
    >
      {arenaNotice.message}
    </div>
  );
}

function HallOfBarsPanel({ hallOfBars }) {
  return (
    <div className="rounded-[24px] border border-white/10 bg-white/[0.03] p-4 sm:p-5">
      <div className="text-xl font-semibold tracking-[-0.03em] text-white">
        Hall of Bars
      </div>
      <div className="mt-2 text-sm text-neutral-400">
        Winning pieces live here after the crowd decides.
      </div>

      <div className="mt-5 space-y-3">
        {hallOfBars.map((item) => (
          <div
            key={`${item.challengeId}-${item.entryId}`}
            className="rounded-[20px] border border-amber-400/15 bg-amber-500/10 p-4"
          >
            <div className="text-sm font-semibold text-white">{item.title}</div>
            <div className="mt-1 text-xs text-amber-100/80">
              {item.challengeType} • {item.theme}
            </div>
            <div className="mt-3 whitespace-pre-wrap text-sm leading-7 text-neutral-100">
              {item.content}
            </div>
            <div className="mt-3 text-xs text-neutral-300">
              Winner: {item.winnerDisplayName || item.winnerUsername} •{" "}
              {item.voteCount} votes
            </div>
          </div>
        ))}

        {hallOfBars.length === 0 ? (
          <ArenaEmptyState text="No winning entries yet." />
        ) : null}
      </div>
    </div>
  );
}

function RankingsPanel({ leaderboard }) {
  return (
    <div className="rounded-[24px] border border-white/10 bg-white/[0.03] p-4 sm:p-5">
      <div className="text-xl font-semibold tracking-[-0.03em] text-white">
        Weekly Rankings
      </div>
      <div className="mt-2 text-sm text-neutral-400">
        Winners, votes, and submissions from the last 7 days.
      </div>

      <div className="mt-5 space-y-3">
        {leaderboard.map((item, index) => (
          <div
            key={item.userId}
            className="rounded-[20px] border border-white/8 bg-black/20 p-4"
          >
            <div className="flex items-center justify-between gap-3">
              <div>
                <div className="text-sm font-semibold text-white">
                  #{index + 1} {item.displayName || item.username}
                </div>
                <div className="mt-1 text-xs text-neutral-500">
                  @{item.username}
                </div>
              </div>
              <div className="text-right text-xs text-neutral-300">
                <div>{item.battlesWon} wins</div>
                <div>{item.votesReceived} votes</div>
                <div>{item.entriesSubmitted} entries</div>
              </div>
            </div>
          </div>
        ))}

        {leaderboard.length === 0 ? (
          <ArenaEmptyState text="No ranking data yet." />
        ) : null}
      </div>
    </div>
  );
}

export default function ArenaRoomPanel({
  activeTab,
  onTabChange,
  challenges = [],
  selectedChallenge,
  onSelectChallenge,
  onBackFromChallenge,
  hallOfBars = [],
  leaderboard = [],
  arenaNotice = null,
  actionBusy = false,
  actionError = "",
  currentUserId,
  onSubmitEntry,
  onVote,
  onComment,
  onCreateChallenge,
  loading = false,
  showToolbar = true,
}) {
  const isBrowseTab =
    activeTab !== "chat" && activeTab !== "hall" && activeTab !== "rankings";
  const isViewingChallenge = isBrowseTab && !!selectedChallenge?.challenge?.id;

  const mobileListLabel =
    activeTab === "open"
      ? "Open battles"
      : activeTab === "voting"
      ? "Voting now"
      : activeTab === "winners"
      ? "Closed battles"
      : "Battles";

  return (
    <div className="flex min-h-0 flex-1 flex-col overflow-hidden">
      {showToolbar ? (
        <div className="border-b border-white/6 px-3 py-3 sm:px-5">
          <div className="flex flex-col gap-3">
            <div className="overflow-x-auto pb-1">
              <div className="flex min-w-max gap-2">
                {tabs.map((tab) => (
                  <button
                    key={tab.key}
                    type="button"
                    onClick={() => onTabChange?.(tab.key)}
                    className={`rounded-full px-3 py-1.5 text-sm font-medium transition ${
                      activeTab === tab.key
                        ? "bg-white text-neutral-950"
                        : "border border-white/10 bg-white/[0.03] text-neutral-300 hover:bg-white/[0.06]"
                    }`}
                  >
                    {tab.label}
                  </button>
                ))}
              </div>
            </div>

            <button
              type="button"
              onClick={onCreateChallenge}
              className="rounded-full bg-white px-4 py-2.5 text-sm font-semibold text-neutral-950 sm:w-fit"
            >
              Create Challenge
            </button>
          </div>
        </div>
      ) : null}

      <div className="min-h-0 flex-1 overflow-y-auto px-3 py-4 sm:px-5">
        {loading ? (
          <div className="rounded-[22px] border border-white/10 bg-white/[0.03] p-6 text-sm text-neutral-400">
            Loading arena...
          </div>
        ) : (
          <div className="space-y-4">
            <ArenaHeaderNotice arenaNotice={arenaNotice} />

            {activeTab === "hall" ? (
              <HallOfBarsPanel hallOfBars={hallOfBars} />
            ) : activeTab === "rankings" ? (
              <RankingsPanel leaderboard={leaderboard} />
            ) : isBrowseTab ? (
              isViewingChallenge ? (
                <div className="space-y-4">
                  <ArenaChallengeDetailCard
                    detail={selectedChallenge}
                    currentUserId={currentUserId}
                    actionBusy={actionBusy}
                    actionError={actionError}
                    onSubmitEntry={onSubmitEntry}
                    onVote={onVote}
                    onComment={onComment}
                  />
                </div>
              ) : (
              <>
                <div className="rounded-[24px] border border-white/10 bg-[radial-gradient(circle_at_top_left,rgba(226,109,90,0.14),transparent_36%),linear-gradient(180deg,rgba(255,255,255,0.035),rgba(255,255,255,0.015))] px-4 py-4">
                  <div className="text-[10px] font-semibold uppercase tracking-[0.18em] text-[#f2b077]">
                    Arena lane
                  </div>
                  <div className="mt-2 text-[20px] font-semibold tracking-[-0.05em] text-white">
                    {mobileListLabel}
                  </div>
                  <div className="mt-1 text-sm text-neutral-400">
                    Mobile-first battle browsing. Pick a card, read the bars,
                    vote, then join the replies.
                  </div>
                </div>

                <div className="grid gap-4 xl:grid-cols-[0.96fr_1.24fr]">
                  <div className="order-2 space-y-3 xl:order-1">
                    <div className="flex items-center justify-between gap-3">
                      <div>
                        <div className="text-sm font-semibold text-white">
                          {mobileListLabel}
                        </div>
                        <div className="mt-1 text-xs text-neutral-500">
                          Tap any battle to open its full thread.
                        </div>
                      </div>
                      <div className="rounded-full border border-white/10 bg-white/[0.04] px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.14em] text-neutral-300">
                        {challenges.length} battles
                      </div>
                    </div>

                    {challenges.map((challenge) => (
                      <ArenaChallengeCard
                        key={challenge.id}
                        challenge={challenge}
                        active={selectedChallenge?.challenge?.id === challenge.id}
                        onSelect={onSelectChallenge}
                      />
                    ))}

                    {challenges.length === 0 ? (
                      <ArenaEmptyState text="No challenges in this lane yet." />
                    ) : null}
                  </div>

                  <div className="order-1 xl:order-2">
                    <ArenaChallengeDetailCard
                      detail={selectedChallenge}
                      currentUserId={currentUserId}
                      actionBusy={actionBusy}
                      actionError={actionError}
                      onSubmitEntry={onSubmitEntry}
                      onVote={onVote}
                      onComment={onComment}
                    />
                  </div>
                </div>
              </>
              )
            ) : (
              <div className="rounded-[24px] border border-white/10 bg-[linear-gradient(180deg,rgba(255,255,255,0.03),rgba(255,255,255,0.015))] p-6 text-center text-sm text-neutral-500">
                Switch to a battle lane above to browse challenges.
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

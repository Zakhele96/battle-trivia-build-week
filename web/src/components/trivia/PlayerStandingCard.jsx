export default function PlayerStandingCard({
  playerRank,
  attemptsInfo,
  compact = false,
  showAttempts = false,
  title = "Your standing",
}) {
  const attemptsValue =
    attemptsInfo && typeof attemptsInfo.left === "number"
      ? attemptsInfo.left
      : "—";

  const shellClass = compact
    ? "rounded-[20px] border border-white/10 bg-neutral-950/80 p-3"
    : "rounded-[28px] border border-white/10 bg-neutral-950/80 p-5";

  if (compact) {
    return (
      <div className={shellClass}>
        <div className="flex items-start justify-between gap-3">
          <div>
            <h3 className="text-sm font-semibold text-white">{title}</h3>
            <div className="mt-1 text-[11px] text-neutral-500">
              Personal progress
            </div>
          </div>

          <span className="rounded-full border border-white/10 bg-white/[0.04] px-2.5 py-1 text-[10px] font-medium uppercase tracking-[0.14em] text-neutral-400">
            You
          </span>
        </div>

        <div className="mt-3 rounded-[20px] border border-white/6 bg-white/[0.03] p-3">
          <div className="text-[10px] uppercase tracking-[0.16em] text-neutral-500">
            Player
          </div>
          <div className="mt-1 truncate text-sm font-medium text-white">
            {playerRank
              ? playerRank.displayName || playerRank.username
              : "Score to unlock rank"}
          </div>

          <div
            className={`mt-3 grid gap-2 ${
              showAttempts ? "grid-cols-3" : "grid-cols-2"
            }`}
          >
            <div className="rounded-2xl bg-black/20 px-3 py-2.5">
              <div className="text-[10px] uppercase tracking-[0.14em] text-neutral-500">
                Rank
              </div>
              <div className="mt-1 text-base font-bold text-white">
                {playerRank ? `#${playerRank.rank}` : "—"}
              </div>
            </div>

            <div className="rounded-2xl bg-black/20 px-3 py-2.5">
              <div className="text-[10px] uppercase tracking-[0.14em] text-neutral-500">
                Score
              </div>
              <div className="mt-1 text-base font-bold text-blue-300">
                {playerRank ? playerRank.score : 0}
              </div>
            </div>

            {showAttempts ? (
              <div className="rounded-2xl bg-black/20 px-3 py-2.5">
                <div className="text-[10px] uppercase tracking-[0.14em] text-neutral-500">
                  Attempts
                </div>
                <div className="mt-1 text-base font-bold text-white">
                  {attemptsValue}
                </div>
              </div>
            ) : null}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={shellClass}>
      <div className="flex items-start justify-between gap-3">
        <div>
          <h3 className="text-sm font-semibold text-white">{title}</h3>
          <div className="mt-0.5 text-[11px] text-neutral-500">
            Personal progress
          </div>
        </div>

        <span className="rounded-full border border-white/10 bg-white/[0.04] px-2.5 py-1 text-[10px] font-medium uppercase tracking-[0.14em] text-neutral-400">
          You
        </span>
      </div>

      <div className="mt-4 overflow-hidden rounded-[22px] border border-white/6 bg-[linear-gradient(180deg,rgba(255,255,255,0.03),rgba(255,255,255,0.02))]">
        <div className="border-b border-white/6 px-4 py-4">
          <div className="text-[10px] uppercase tracking-[0.18em] text-neutral-500">
            Player
          </div>
          <div className="mt-1 text-base font-semibold text-white">
            {playerRank
              ? playerRank.displayName || playerRank.username
              : "Score to unlock rank"}
          </div>
        </div>

        <div className="grid grid-cols-2 gap-px bg-white/6">
          <div className="bg-neutral-950/70 px-4 py-4">
            <div className="text-[10px] uppercase tracking-[0.14em] text-neutral-500">
              Rank
            </div>
            <div className="mt-1 text-2xl font-bold tracking-[-0.03em] text-white">
              {playerRank ? `#${playerRank.rank}` : "—"}
            </div>
          </div>

          <div className="bg-neutral-950/70 px-4 py-4">
            <div className="text-[10px] uppercase tracking-[0.14em] text-neutral-500">
              Score
            </div>
            <div className="mt-1 text-2xl font-bold tracking-[-0.03em] text-blue-300">
              {playerRank ? playerRank.score : 0}
            </div>
          </div>
        </div>

        {showAttempts ? (
          <div className="border-t border-white/6 bg-neutral-950/70 px-4 py-3.5">
            <div className="flex items-center justify-between">
              <div className="text-[10px] uppercase tracking-[0.14em] text-neutral-500">
                Attempts left
              </div>
              <div className="text-sm font-semibold text-white">
                {attemptsValue}
              </div>
            </div>
          </div>
        ) : null}
      </div>
    </div>
  );
}
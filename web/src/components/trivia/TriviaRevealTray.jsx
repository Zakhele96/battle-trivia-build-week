import { useEffect, useState } from "react";

export default function TriviaRevealTray({
  correctAnswer,
  roundWinners = [],
  isRoundReveal,
  maxVisibleWinners = 3,
  lastRoundPlacement = null,
}) {
  const [isVisible, setIsVisible] = useState(false);

  const hasContent = !!correctAnswer || roundWinners.length > 0;

  useEffect(() => {
    if (!hasContent) {
      setIsVisible(false);
      return;
    }

    const id = requestAnimationFrame(() => {
      setIsVisible(true);
    });

    return () => cancelAnimationFrame(id);
  }, [hasContent, correctAnswer, roundWinners.length]);

  if (!hasContent) {
    return null;
  }

  const visibleWinners = roundWinners.slice(0, maxVisibleWinners);
  const hiddenCount = Math.max(0, roundWinners.length - visibleWinners.length);

  return (
    <div
      className={`h-full rounded-[16px] border px-3 py-2 shadow-lg shadow-black/20 backdrop-blur-md transition-all duration-300 ease-out ${
        isRoundReveal
          ? "border-emerald-400/20 bg-[linear-gradient(135deg,rgba(16,24,20,0.92)_0%,rgba(18,28,24,0.94)_50%,rgba(18,24,34,0.92)_100%)] ring-1 ring-emerald-400/10"
          : "border-white/8 bg-black/20"
      } ${
        isVisible
          ? "translate-y-0 scale-100 opacity-100"
          : "translate-y-1 scale-[0.992] opacity-0"
      }`}
    >
      <div className="grid h-full grid-rows-[auto_1fr] gap-1.5">
        <div className="flex min-w-0 items-start justify-between gap-3">
          <div className="min-w-0">
            <div className="flex min-w-0 items-center gap-2 text-[8px] uppercase tracking-[0.18em] text-neutral-400">
              <span
                className={`h-1.5 w-1.5 shrink-0 rounded-full transition-all duration-300 ${
                  isRoundReveal
                    ? "bg-emerald-300 shadow-[0_0_10px_rgba(110,231,183,0.7)]"
                    : "bg-blue-300 shadow-[0_0_10px_rgba(147,197,253,0.55)]"
                }`}
              />
              <span className="truncate">Answer revealed</span>
            </div>

            <div
              className={`mt-1 text-[12px] font-semibold tracking-[-0.01em] text-white transition-all duration-300 sm:text-[13px] ${
                isVisible ? "translate-y-0 opacity-100" : "translate-y-1 opacity-0"
              }`}
              style={{
                display: "-webkit-box",
                WebkitLineClamp: 1,
                WebkitBoxOrient: "vertical",
                overflow: "hidden",
                transitionDelay: "40ms",
              }}
            >
              {correctAnswer || "Answer locked"}
            </div>
          </div>

          <div
            className={`shrink-0 text-[8px] uppercase tracking-[0.16em] text-neutral-500 transition-all duration-300 ${
              isVisible ? "translate-y-0 opacity-100" : "translate-y-1 opacity-0"
            }`}
            style={{ transitionDelay: "60ms" }}
          >
            {roundWinners.length > 0
              ? `${roundWinners.length} winner${roundWinners.length === 1 ? "" : "s"}`
              : "Result"}
          </div>
        </div>

        <div className="flex min-h-[24px] items-center gap-1.5 overflow-x-auto pb-0.5">
          {lastRoundPlacement?.wasCorrect && lastRoundPlacement?.placement ? (
            <div
              className={`shrink-0 rounded-full border border-blue-400/20 bg-blue-500/10 px-2.5 py-1 text-[10px] leading-none text-blue-200 transition-all duration-300 ease-out ${
                isVisible
                  ? "translate-y-0 scale-100 opacity-100"
                  : "translate-y-1 scale-[0.985] opacity-0"
              }`}
              style={{ transitionDelay: "90ms" }}
            >
              You placed #{lastRoundPlacement.placement}
              {lastRoundPlacement.pointsAwarded > 0 ? (
                <span className="ml-1.5 font-semibold text-blue-300">
                  +{lastRoundPlacement.pointsAwarded}
                </span>
              ) : null}
            </div>
          ) : null}

          {lastRoundPlacement?.wasCorrect &&
          lastRoundPlacement?.streakAfterRound > 1 ? (
            <div
              className={`shrink-0 rounded-full border border-violet-400/20 bg-violet-500/10 px-2.5 py-1 text-[10px] leading-none text-violet-200 transition-all duration-300 ease-out ${
                isVisible
                  ? "translate-y-0 scale-100 opacity-100"
                  : "translate-y-1 scale-[0.985] opacity-0"
              }`}
              style={{ transitionDelay: "110ms" }}
            >
              Streak x{lastRoundPlacement.streakAfterRound}
            </div>
          ) : null}

          {!lastRoundPlacement?.wasCorrect &&
          lastRoundPlacement?.streakEndedAt > 1 ? (
            <div
              className={`shrink-0 rounded-full border border-amber-400/20 bg-amber-500/10 px-2.5 py-1 text-[10px] leading-none text-amber-200 transition-all duration-300 ease-out ${
                isVisible
                  ? "translate-y-0 scale-100 opacity-100"
                  : "translate-y-1 scale-[0.985] opacity-0"
              }`}
              style={{ transitionDelay: "110ms" }}
            >
              Streak ended at x{lastRoundPlacement.streakEndedAt}
            </div>
          ) : null}

          {visibleWinners.map((winner, index) => {
            const isMvp = winner.correctRank === 1;

            return (
              <div
                key={`${winner.userId}-${winner.correctRank}`}
                className={`shrink-0 rounded-full border px-2.5 py-1 text-[10px] leading-none transition-all duration-300 ease-out ${
                  isMvp
                    ? "border-amber-400/20 bg-amber-500/10 text-amber-100"
                    : "border-white/10 bg-white/[0.06] text-white"
                } ${
                  isVisible
                    ? "translate-y-0 scale-100 opacity-100"
                    : "translate-y-1 scale-[0.985] opacity-0"
                }`}
                style={{
                  transitionDelay: `${130 + index * 45}ms`,
                }}
              >
                {isMvp ? (
                  <>
                    <span className="mr-1">👑</span>
                    <span className="font-semibold">Fastest</span>
                    <span className="ml-1 text-neutral-200">
                      {winner.displayName || winner.username}
                    </span>
                    <span className="ml-2 font-semibold text-amber-200">
                      +{winner.pointsAwarded}
                    </span>
                  </>
                ) : (
                  <>
                    <span className="font-semibold text-white">
                      #{winner.correctRank}
                    </span>
                    <span className="ml-1 text-neutral-300">
                      {winner.displayName || winner.username}
                    </span>
                    <span className="ml-2 font-semibold text-blue-300">
                      +{winner.pointsAwarded}
                    </span>
                  </>
                )}
              </div>
            );
          })}

          {hiddenCount > 0 ? (
            <div
              className={`shrink-0 rounded-full border border-white/10 bg-white/[0.04] px-2.5 py-1 text-[10px] leading-none text-neutral-300 transition-all duration-300 ease-out ${
                isVisible
                  ? "translate-y-0 scale-100 opacity-100"
                  : "translate-y-1 scale-[0.985] opacity-0"
              }`}
              style={{
                transitionDelay: `${130 + visibleWinners.length * 45}ms`,
              }}
            >
              +{hiddenCount} more
            </div>
          ) : null}

          {visibleWinners.length === 0 &&
          !lastRoundPlacement?.wasCorrect &&
          !lastRoundPlacement?.streakEndedAt ? (
            <div
              className={`flex min-h-[24px] items-center text-[10px] text-neutral-500 transition-all duration-300 ${
                isVisible ? "translate-y-0 opacity-100" : "translate-y-1 opacity-0"
              }`}
              style={{ transitionDelay: "100ms" }}
            >
              Scores updated.
            </div>
          ) : null}
        </div>
      </div>
    </div>
  );
}
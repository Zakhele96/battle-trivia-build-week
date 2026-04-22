function formatMaskedWord(value) {
  if (!value) return "_______";
  return value.toUpperCase();
}

function getTimerTone(timeLeft, phase) {
  if (phase !== "active") {
    return "text-neutral-300";
  }

  if (timeLeft <= 5) return "text-red-300";
  if (timeLeft <= 10) return "text-orange-300";
  return "text-white";
}

function getTimerShellClass(timeLeft, phase) {
  if (phase !== "active") {
    return "border-white/8 bg-black/20";
  }

  if (timeLeft <= 5) {
    return "border-red-400/35 bg-red-500/10 ring-1 ring-red-400/20 shadow-[0_0_34px_rgba(248,113,113,0.18)]";
  }

  if (timeLeft <= 10) {
    return "border-amber-400/35 bg-amber-500/10 ring-1 ring-amber-400/20 shadow-[0_0_30px_rgba(251,191,36,0.16)]";
  }

  return "border-violet-400/20 bg-violet-500/10 ring-1 ring-violet-400/15 shadow-[0_0_28px_rgba(168,85,247,0.14)]";
}

export default function WordScrambleHeroCard({
  roundNumber,
  maskedWord,
  answerWord,
  category,
  hint,
  phase = "waiting",
  timeLeft = 0,
  winners = [],
  compact = false,
}) {
  const isActive = phase === "active";
  const isReveal = phase === "reveal";

  const showHint = !!hint && (isReveal || (isActive && timeLeft <= 10));
  const shouldBlinkWord = isActive && timeLeft > 10;
  const liveStateLabel = isReveal
    ? "Live state"
    : showHint
    ? "Hint"
    : "Live state";
  const liveStateBody = isReveal
    ? "Waiting for the next round."
    : showHint
    ? hint
    : isActive
    ? "Guess before the timer hits zero."
    : "Waiting for the next word.";
  const liveStateBodyClass = isReveal
    ? "text-neutral-300"
    : showHint
    ? "text-neutral-200"
    : "text-neutral-300";
  const liveStateShellClass = "border-white/8 bg-black/20";

  return (
    <div
      className={`relative overflow-hidden border shadow-[0_24px_60px_rgba(0,0,0,0.24)] ${
        compact ? "rounded-[20px] sm:rounded-[22px]" : "rounded-[24px] sm:rounded-[28px]"
      } ${
        isReveal
          ? "border-emerald-400/20 bg-[radial-gradient(circle_at_top_left,rgba(52,211,153,0.14),transparent_28%),linear-gradient(135deg,rgba(10,10,11,1)_0%,rgba(16,24,20,1)_50%,rgba(10,10,11,1)_100%)]"
          : "border-white/10 bg-[radial-gradient(circle_at_top_left,rgba(168,85,247,0.14),transparent_30%),linear-gradient(135deg,rgba(10,10,11,1)_0%,rgba(24,24,39,0.98)_55%,rgba(10,10,11,1)_100%)]"
      }`}
    >
      <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(180deg,rgba(255,255,255,0.03),transparent_18%,transparent_82%,rgba(255,255,255,0.02))]" />
      <div className="pointer-events-none h-px bg-white/10" />

      <div className={`relative ${compact ? "p-3 sm:p-3.5" : "p-3.5 sm:p-4 lg:p-5"}`}>
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-2">
              <span className="rounded-full border border-violet-400/20 bg-violet-500/10 px-2.5 py-1 text-[10px] font-medium uppercase tracking-[0.16em] text-violet-200">
                Word Scramble
              </span>

              {roundNumber ? (
                <span className="rounded-full border border-white/10 bg-white/[0.04] px-2.5 py-1 text-[10px] font-medium uppercase tracking-[0.16em] text-neutral-400">
                  Round {roundNumber}
                </span>
              ) : null}

              {category ? (
                <span className="rounded-full border border-white/10 bg-white/[0.04] px-2.5 py-1 text-[10px] font-medium uppercase tracking-[0.16em] text-neutral-400">
                  {category}
                </span>
              ) : null}

              <span
                className={`rounded-full px-2.5 py-1 text-[10px] font-medium uppercase tracking-[0.16em] ${
                  isActive
                    ? "bg-emerald-500/15 text-emerald-300"
                    : isReveal
                    ? "bg-amber-500/15 text-amber-300"
                    : "bg-white/[0.05] text-neutral-400"
                }`}
              >
                {isActive ? "Live now" : isReveal ? "Reveal" : "Waiting"}
              </span>
            </div>

            <div
              className={`uppercase tracking-[0.2em] text-violet-200/70 ${
                compact ? "mt-2 text-[9px]" : "mt-3 text-[10px]"
              }`}
            >
              {isActive
                ? "Unscramble the word"
                : isReveal
                ? "Round result"
                : "Waiting for next round"}
            </div>
          </div>

          <div className="relative shrink-0">
            {isActive && timeLeft <= 10 ? (
              <div
                className={`pointer-events-none absolute inset-0 rounded-[20px] blur-xl ${
                  timeLeft <= 5 ? "bg-red-400/25 animate-pulse" : "bg-amber-400/20"
                }`}
              />
            ) : null}

            <div
              className={`relative rounded-[18px] border text-center shadow-lg shadow-black/20 backdrop-blur-md ${
                compact
                  ? "min-w-[82px] px-3 py-1.5 sm:min-w-[92px]"
                  : "min-w-[96px] px-4 py-2 sm:min-w-[112px]"
              } ${getTimerShellClass(timeLeft, phase)}`}
            >
              <div className="text-[8px] uppercase tracking-[0.18em] text-neutral-400">
                Timer
              </div>
              <div
                className={`mt-1 font-bold leading-none tracking-[-0.04em] tabular-nums ${
                  compact ? "text-[22px] sm:text-[24px]" : "text-[26px] sm:text-[30px]"
                } ${getTimerTone(timeLeft, phase)}`}
              >
                {isActive ? timeLeft : 0}
              </div>
            </div>
          </div>
        </div>

        <div
          className={`rounded-[20px] border border-white/8 bg-black/20 ${
            compact ? "mt-3 px-3 py-3 sm:px-3.5 sm:py-3.5" : "mt-4 px-3.5 py-4 sm:px-4 sm:py-5"
          }`}
        >
          <div className="overflow-x-auto">
            <div
              className={`min-w-max text-center font-mono font-semibold uppercase ${
                compact
                  ? "text-[20px] tracking-[0.14em] sm:text-[24px] lg:text-[30px]"
                  : "text-[24px] tracking-[0.18em] sm:text-[32px] lg:text-[38px]"
              } ${isReveal ? "text-emerald-100" : "text-white"} ${
                shouldBlinkWord ? "animate-pulse" : ""
              }`}
            >
              {formatMaskedWord(isReveal ? answerWord || maskedWord : maskedWord)}
            </div>
          </div>
        </div>

        <div
          className={`rounded-[18px] border ${liveStateShellClass} ${
            compact ? "mt-2.5 px-3 py-2.5" : "mt-3 px-3.5 py-3"
          }`}
        >
          <div className="text-[9px] uppercase tracking-[0.16em] text-neutral-500">
            {liveStateLabel}
          </div>
          <div
            className={`mt-1 font-medium ${
              compact ? "text-[12px]" : "text-[12px]"
            } ${liveStateBodyClass}`}
          >
            {showHint && !isReveal ? (
              <>
                Hint: <span className="font-semibold">{liveStateBody}</span>
              </>
            ) : (
              liveStateBody
            )}
          </div>
        </div>

        {winners?.length > 0 ? (
          <div className={compact ? "mt-3" : "mt-4"}>
            <div
              className={`uppercase tracking-[0.16em] text-neutral-500 ${
                compact ? "mb-1.5 text-[9px]" : "mb-2 text-[10px]"
              }`}
            >
              Round winners
            </div>

            <div className="flex flex-wrap gap-1.5">
              {winners.map((winner) => (
                <div
                  key={`${winner.userId}-${winner.rank}`}
                  className={`inline-flex max-w-full items-center gap-1.5 rounded-full border px-2.5 py-1 ${
                    winner.rank === 1
                      ? "border-amber-400/20 bg-amber-500/10"
                      : "border-white/8 bg-white/[0.03]"
                  }`}
                >
                  <span
                    className={`inline-flex rounded-full px-1.5 py-0.5 text-[9px] font-medium uppercase tracking-[0.1em] ${
                      winner.rank === 1
                        ? "bg-amber-400/15 text-amber-200"
                        : "bg-white/[0.05] text-neutral-400"
                    }`}
                  >
                    #{winner.rank}
                  </span>

                  {winner.rank === 1 ? (
                    <span aria-hidden="true" className="emoji-native text-[10px]">
                      👑
                    </span>
                  ) : null}

                  <span className="max-w-[88px] truncate text-[11px] font-medium text-white sm:max-w-[120px]">
                    {winner.displayName || winner.username}
                  </span>

                  <span className="text-[10px] font-semibold text-blue-300">
                    {winner.score}
                  </span>
                </div>
              ))}
            </div>
          </div>
        ) : null}
      </div>
    </div>
  );
}

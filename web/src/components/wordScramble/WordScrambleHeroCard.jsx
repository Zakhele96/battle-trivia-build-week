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
}) {
  const isActive = phase === "active";
  const isReveal = phase === "reveal";

  const showHint = !!hint && (isReveal || (isActive && timeLeft <= 10));
  const shouldBlinkWord = isActive && timeLeft > 10;

  return (
    <div
      className={`relative overflow-hidden rounded-[24px] border shadow-[0_24px_60px_rgba(0,0,0,0.24)] sm:rounded-[28px] ${
        isReveal
          ? "border-emerald-400/20 bg-[radial-gradient(circle_at_top_left,rgba(52,211,153,0.14),transparent_28%),linear-gradient(135deg,rgba(10,10,11,1)_0%,rgba(16,24,20,1)_50%,rgba(10,10,11,1)_100%)]"
          : "border-white/10 bg-[radial-gradient(circle_at_top_left,rgba(168,85,247,0.14),transparent_30%),linear-gradient(135deg,rgba(10,10,11,1)_0%,rgba(24,24,39,0.98)_55%,rgba(10,10,11,1)_100%)]"
      }`}
    >
      <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(180deg,rgba(255,255,255,0.03),transparent_18%,transparent_82%,rgba(255,255,255,0.02))]" />
      <div className="pointer-events-none h-px bg-white/10" />

      <div className="relative p-3.5 sm:p-4 lg:p-5">
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
                {isActive
                  ? "Live now"
                  : isReveal
                  ? "Reveal"
                  : "Waiting"}
              </span>
            </div>

            <div className="mt-3 text-[10px] uppercase tracking-[0.2em] text-violet-200/70">
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
              className={`relative min-w-[96px] rounded-[20px] border px-4 py-2 text-center shadow-lg shadow-black/20 backdrop-blur-md sm:min-w-[112px] ${getTimerShellClass(
                timeLeft,
                phase
              )}`}
            >
              <div className="text-[8px] uppercase tracking-[0.18em] text-neutral-400">
                Timer
              </div>
              <div
                className={`mt-1 text-[26px] font-bold leading-none tracking-[-0.04em] tabular-nums sm:text-[30px] ${getTimerTone(
                  timeLeft,
                  phase
                )}`}
              >
                {isActive ? timeLeft : 0}
              </div>
            </div>
          </div>
        </div>

        <div className="mt-4 rounded-[22px] border border-white/8 bg-black/20 px-3.5 py-4 sm:px-4 sm:py-5">
          <div className="overflow-x-auto">
            <div
              className={`min-w-max text-center font-mono text-[24px] font-semibold uppercase tracking-[0.18em] text-white sm:text-[32px] lg:text-[38px] ${
                shouldBlinkWord ? "animate-pulse" : ""
              }`}
            >
              {formatMaskedWord(isReveal ? answerWord || maskedWord : maskedWord)}
            </div>
          </div>
        </div>

        {showHint ? (
          <div className="mt-3 rounded-[18px] border border-white/8 bg-white/[0.03] px-3.5 py-3 text-sm text-neutral-400">
            Hint: <span className="text-neutral-200">{hint}</span>
          </div>
        ) : null}

        {isReveal && answerWord ? (
          <div className="mt-3 rounded-[18px] border border-emerald-500/20 bg-emerald-500/10 px-3.5 py-3">
            <div className="text-[10px] uppercase tracking-[0.16em] text-emerald-200/80">
              Full answer
            </div>
            <div className="mt-1 text-sm font-semibold text-emerald-100 sm:text-base">
              {answerWord}
            </div>
          </div>
        ) : null}

        {winners?.length > 0 ? (
          <div className="mt-4">
            <div className="mb-2 text-[10px] uppercase tracking-[0.16em] text-neutral-500">
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
                    <span aria-hidden="true" className="text-[10px]">
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
        ) : (
          <div className="mt-4 rounded-[18px] border border-white/8 bg-black/20 px-3.5 py-3">
            <div className="text-[9px] uppercase tracking-[0.16em] text-neutral-500">
              Live state
            </div>
            <div className="mt-1 text-[12px] font-medium text-neutral-300">
              {isActive
                ? "Guess before the timer hits zero."
                : isReveal
                ? "Round complete."
                : "Waiting for the next word."}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
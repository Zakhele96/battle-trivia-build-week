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
  return "text-blue-300";
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
    <div className="overflow-hidden rounded-[24px] border border-white/10 bg-[linear-gradient(180deg,rgba(255,255,255,0.035),rgba(255,255,255,0.015))] shadow-[0_18px_44px_rgba(0,0,0,0.18)] sm:rounded-[28px]">
      <div className="pointer-events-none h-px bg-white/10" />

      <div className="p-3.5 sm:p-5">
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
            </div>

            <div className="mt-3 text-[10px] uppercase tracking-[0.18em] text-neutral-500 sm:mt-4 sm:text-[11px]">
              {isActive
                ? "Guess the word"
                : isReveal
                ? "Answer revealed"
                : "Waiting for next round"}
            </div>
          </div>

          <div className="shrink-0 sm:hidden">
            <div className="rounded-[16px] border border-white/10 bg-white/[0.04] px-3 py-2 text-right">
              <div className="text-[9px] uppercase tracking-[0.16em] text-neutral-500">
                Timer
              </div>
              <div
                className={`mt-0.5 text-[22px] font-semibold tabular-nums ${getTimerTone(
                  timeLeft,
                  phase
                )}`}
              >
                {isActive ? timeLeft : 0}
              </div>
            </div>
          </div>

          <div className="hidden min-w-[5.5rem] shrink-0 text-right sm:block">
            <div className="text-[10px] uppercase tracking-[0.16em] text-neutral-500">
              Timer
            </div>
            <div
              className={`mt-1 text-[28px] font-semibold tabular-nums lg:text-[32px] ${getTimerTone(
                timeLeft,
                phase
              )}`}
            >
              {isActive ? timeLeft : 0}
            </div>
          </div>
        </div>

        <div className="mt-4 rounded-[20px] border border-white/8 bg-black/20 px-3 py-4 sm:mt-5 sm:px-4 sm:py-5">
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
          <div className="mt-3 rounded-[18px] border border-white/8 bg-white/[0.03] px-3 py-2.5 text-sm text-neutral-400">
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
        ) : null}
      </div>
    </div>
  );
}
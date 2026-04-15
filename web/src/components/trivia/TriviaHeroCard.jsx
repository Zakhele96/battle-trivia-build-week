import TriviaRevealTray from "./TriviaRevealTray";

function formatWindowTime(value) {
  if (!value) return "Later";

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "Later";

  const now = new Date();
  const sameDay = date.toDateString() === now.toDateString();

  return new Intl.DateTimeFormat(
    undefined,
    sameDay
      ? { hour: "2-digit", minute: "2-digit" }
      : { weekday: "short", hour: "2-digit", minute: "2-digit" }
  ).format(date);
}

export default function TriviaHeroCard({
  currentRoundNumber,
  sessionStatus,
  timeLeft,
  currentQuestion,
  correctAnswer,
  roundWinners,
  isQuestionFresh,
  isRoundReveal,
  hasActiveRound,
  lastRoundPlacement,
}) {
  const isLive = !!sessionStatus?.isLiveNow;
  const runModeLabel =
    sessionStatus?.runMode === "scheduled" ? "Scheduled" : "Continuous";
  const hasRevealContent = !!correctAnswer || roundWinners.length > 0;

  const isWarning = !!hasActiveRound && timeLeft <= 10 && timeLeft > 5;
  const isDanger = !!hasActiveRound && timeLeft <= 5;

  const quietStateText = hasActiveRound
    ? "Answer now"
    : isLive
    ? "Next round soon"
    : sessionStatus?.nextWindowStart
    ? `Next: ${formatWindowTime(sessionStatus.nextWindowStart)}`
    : sessionStatus?.statusText || "Standby";

  const standbyText = isLive
    ? "Waiting for the next question."
    : sessionStatus?.nextWindowStart
    ? `Next live window starts ${formatWindowTime(sessionStatus.nextWindowStart)}`
    : sessionStatus?.statusText || "Battle Trivia is on standby.";

  const timerShellClass = hasActiveRound
    ? isDanger
      ? "border-red-400/35 bg-red-500/10 ring-1 ring-red-400/20 shadow-[0_0_34px_rgba(248,113,113,0.18)]"
      : isWarning
      ? "border-amber-400/35 bg-amber-500/10 ring-1 ring-amber-400/20 shadow-[0_0_30px_rgba(251,191,36,0.16)]"
      : "border-white/10 bg-black/25"
    : "border-white/8 bg-black/20";

  const timerTextClass = hasActiveRound
    ? isDanger
      ? "text-red-300"
      : isWarning
      ? "text-amber-300"
      : "text-white"
    : "text-neutral-300";

  return (
    <div
      className={`relative overflow-hidden rounded-[24px] border shadow-2xl shadow-black/25 transition-all duration-500 sm:rounded-[28px] ${
        isQuestionFresh
          ? "border-blue-400/25 bg-[radial-gradient(circle_at_top,rgba(96,165,250,0.16),transparent_35%),linear-gradient(135deg,rgba(10,10,11,1)_0%,rgba(17,24,39,1)_50%,rgba(10,10,11,1)_100%)] ring-1 ring-blue-400/15"
          : isRoundReveal
          ? "border-emerald-400/20 bg-[radial-gradient(circle_at_top,rgba(52,211,153,0.14),transparent_34%),linear-gradient(135deg,rgba(10,10,11,1)_0%,rgba(16,24,20,1)_50%,rgba(10,10,11,1)_100%)]"
          : "border-white/10 bg-[radial-gradient(circle_at_top,rgba(255,255,255,0.05),transparent_28%),linear-gradient(135deg,rgba(10,10,11,1)_0%,rgba(17,24,39,0.95)_55%,rgba(10,10,11,1)_100%)]"
      } h-[232px] sm:h-[240px] lg:h-[248px]`}
    >
      <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(180deg,rgba(255,255,255,0.03),transparent_18%,transparent_82%,rgba(255,255,255,0.02))]" />
      <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-white/10" />

      <div
        className={`pointer-events-none absolute -top-10 left-1/2 h-40 w-40 -translate-x-1/2 rounded-full bg-blue-400/20 blur-3xl transition-all duration-700 ${
          isQuestionFresh ? "scale-100 opacity-100" : "scale-75 opacity-0"
        }`}
      />

      <div
        className={`pointer-events-none absolute inset-x-8 top-0 h-px bg-blue-300/70 transition-all duration-700 ${
          isQuestionFresh ? "opacity-100" : "opacity-0"
        }`}
      />

      <div
        className={`pointer-events-none absolute inset-0 rounded-[24px] transition-opacity duration-700 sm:rounded-[28px] ${
          isQuestionFresh
            ? "opacity-100 shadow-[inset_0_0_0_1px_rgba(96,165,250,0.08)]"
            : "opacity-0"
        }`}
      />

      <div className="relative grid h-full grid-rows-[auto_1fr_72px] gap-2.5 p-3 sm:grid-rows-[auto_1fr_78px] sm:p-3.5 lg:grid-rows-[auto_1fr_82px] lg:p-4">
        <div className="flex items-start justify-between gap-3">
          <div className="flex min-w-0 flex-wrap items-center gap-2">
            <span className="rounded-full border border-white/10 bg-white/[0.05] px-2.5 py-1 text-[10px] font-medium uppercase tracking-[0.12em] text-neutral-300">
              {currentRoundNumber ? `Round ${currentRoundNumber}` : "Waiting"}
            </span>

            <span
              className={`rounded-full px-2.5 py-1 text-[10px] font-medium uppercase tracking-[0.12em] ${
                isLive
                  ? "bg-emerald-500/15 text-emerald-300"
                  : "bg-amber-500/15 text-amber-300"
              }`}
            >
              {isLive ? "Live now" : "Standby"}
            </span>

            <span className="rounded-full border border-white/10 bg-white/[0.05] px-2.5 py-1 text-[10px] font-medium uppercase tracking-[0.12em] text-neutral-400">
              {runModeLabel}
            </span>
          </div>

          <div className="relative shrink-0">
            {hasActiveRound && (isWarning || isDanger) ? (
              <div
                className={`pointer-events-none absolute inset-0 rounded-[20px] blur-xl transition-all duration-500 ${
                  isDanger
                    ? "bg-red-400/25 animate-pulse"
                    : "bg-amber-400/20"
                }`}
              />
            ) : null}

            <div
              className={`relative min-w-[108px] rounded-[20px] border px-4 py-2 text-center shadow-lg shadow-black/20 backdrop-blur-md transition-all duration-300 sm:min-w-[116px] ${timerShellClass}`}
            >
              <div className="text-[8px] uppercase tracking-[0.18em] text-neutral-400">
                {hasActiveRound ? "Timer" : "State"}
              </div>

              <div
                className={`mt-1 font-bold tracking-[-0.035em] transition-all duration-300 leading-none ${timerTextClass} ${
                  hasActiveRound
                    ? isDanger
                      ? "text-[31px] sm:text-[34px] scale-[1.04]"
                      : isWarning
                      ? "text-[30px] sm:text-[32px]"
                      : "text-[28px] sm:text-[30px]"
                    : "text-[18px]"
                }`}
              >
                {hasActiveRound ? `${timeLeft}s` : "Ready"}
              </div>
            </div>
          </div>
        </div>

        <div className="min-h-0 overflow-hidden">
          <div
            className={`text-[8px] uppercase tracking-[0.22em] transition-colors duration-500 sm:text-[9px] ${
              isQuestionFresh ? "text-blue-200/90" : "text-blue-300/70"
            }`}
          >
            Current question
          </div>

          <div className="mt-2 h-[104px] sm:h-[108px] lg:h-[114px]">
            {hasActiveRound ? (
              <div
                className={`max-w-[calc(100%-4px)] text-[15px] font-semibold tracking-[-0.02em] text-white transition-all duration-500 sm:text-[16px] lg:text-[20px] ${
                  isQuestionFresh
                    ? "translate-y-0 opacity-100 drop-shadow-[0_0_10px_rgba(96,165,250,0.16)]"
                    : "translate-y-0 opacity-100"
                }`}
                style={{
                  display: "-webkit-box",
                  WebkitLineClamp: 3,
                  WebkitBoxOrient: "vertical",
                  overflow: "hidden",
                  lineHeight: 1.32,
                }}
              >
                {currentQuestion || "Waiting for the next question..."}
              </div>
            ) : (
              <div
                className="max-w-[42rem] text-[13px] leading-6 text-neutral-400 sm:text-[14px]"
                style={{
                  display: "-webkit-box",
                  WebkitLineClamp: 2,
                  WebkitBoxOrient: "vertical",
                  overflow: "hidden",
                }}
              >
                {standbyText}
              </div>
            )}
          </div>
        </div>

        <div className="min-h-0">
          {hasRevealContent ? (
            <TriviaRevealTray
            correctAnswer={correctAnswer}
            roundWinners={roundWinners}
            isRoundReveal={isRoundReveal}
            maxVisibleWinners={3}
            lastRoundPlacement={lastRoundPlacement}
            />
          ) : (
            <div className="flex h-full items-center justify-between rounded-[16px] border border-white/8 bg-black/20 px-3">
              <div className="min-w-0">
                <div className="text-[8px] uppercase tracking-[0.16em] text-neutral-500">
                  Live state
                </div>
                <div
                  className="mt-0.5 text-[11px] font-medium text-neutral-300"
                  style={{
                    display: "-webkit-box",
                    WebkitLineClamp: 1,
                    WebkitBoxOrient: "vertical",
                    overflow: "hidden",
                  }}
                >
                  {quietStateText}
                </div>
              </div>

              <span
                className={`ml-3 h-2 w-2 shrink-0 rounded-full ${
                  hasActiveRound
                    ? "bg-blue-300 shadow-[0_0_10px_rgba(147,197,253,0.7)]"
                    : isLive
                    ? "bg-emerald-300 shadow-[0_0_10px_rgba(110,231,183,0.7)]"
                    : "bg-neutral-600"
                }`}
              />
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
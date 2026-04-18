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

function normaliseQuestion(currentQuestion) {
  if (!currentQuestion) {
    return {
      text: "",
      category: "",
      difficulty: "",
    };
  }

  if (typeof currentQuestion === "string") {
    return {
      text: currentQuestion,
      category: "",
      difficulty: "",
    };
  }

  return {
    text:
      currentQuestion.questionText ||
      currentQuestion.text ||
      currentQuestion.prompt ||
      "",
    category:
      currentQuestion.category ||
      currentQuestion.questionCategory ||
      "",
    difficulty:
      currentQuestion.difficulty ||
      currentQuestion.level ||
      currentQuestion.questionLevel ||
      "",
  };
}

function formatDifficulty(value) {
  if (!value) return "";
  const lower = String(value).toLowerCase();

  if (lower === "easy") return "Easy";
  if (lower === "medium") return "Medium";
  if (lower === "hard") return "Hard";

  return String(value);
}

function getDifficultyPillClass(value) {
  const lower = String(value || "").toLowerCase();

  if (lower === "easy") {
    return "border-emerald-400/20 bg-emerald-500/10 text-emerald-200";
  }

  if (lower === "medium") {
    return "border-amber-400/20 bg-amber-500/10 text-amber-200";
  }

  if (lower === "hard") {
    return "border-rose-400/20 bg-rose-500/10 text-rose-200";
  }

  return "border-white/10 bg-white/[0.05] text-neutral-300";
}

function MetaPill({ children, className = "" }) {
  return (
    <span
      className={`inline-flex items-center rounded-full border px-2 py-0.5 text-[9px] font-medium uppercase tracking-[0.12em] sm:px-2.5 sm:py-1 sm:text-[10px] ${className}`}
    >
      {children}
    </span>
  );
}

function TimerChip({ hasActiveRound, timeLeft, isWarning, isDanger }) {
  const shellClass = hasActiveRound
    ? isDanger
      ? "border-red-400/35 bg-red-500/10 shadow-[0_0_18px_rgba(248,113,113,0.18)]"
      : isWarning
      ? "border-amber-400/35 bg-amber-500/10 shadow-[0_0_16px_rgba(251,191,36,0.16)]"
      : "border-blue-400/20 bg-blue-500/10 shadow-[0_0_14px_rgba(96,165,250,0.14)]"
    : "border-white/8 bg-black/20";

  const textClass = hasActiveRound
    ? isDanger
      ? "text-red-300"
      : isWarning
      ? "text-amber-300"
      : "text-white"
    : "text-neutral-300";

  return (
    <div
      className={`shrink-0 rounded-[16px] border px-3 py-1.5 text-center backdrop-blur-md sm:rounded-[18px] sm:px-3.5 sm:py-2 ${shellClass}`}
    >
      <div className="text-[7px] uppercase tracking-[0.14em] text-neutral-400 sm:text-[8px]">
        {hasActiveRound ? "Timer" : "State"}
      </div>
      <div
        className={`mt-1 font-bold leading-none tracking-[-0.05em] ${textClass} ${
          hasActiveRound
            ? isDanger
              ? "text-[20px] sm:text-[24px]"
              : isWarning
              ? "text-[19px] sm:text-[23px]"
              : "text-[18px] sm:text-[22px]"
            : "text-[14px] sm:text-[16px]"
        }`}
      >
        {hasActiveRound ? `${timeLeft}s` : "Ready"}
      </div>
    </div>
  );
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

  const question = normaliseQuestion(currentQuestion);
  const questionText = question.text || "Waiting for the next question...";
  const questionCategory = question.category;
  const questionDifficulty = formatDifficulty(question.difficulty);

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

  return (
    <div
      className={`relative overflow-hidden rounded-[18px] border transition-all duration-500 sm:rounded-[24px] ${
        isQuestionFresh
          ? "border-blue-400/25 bg-[radial-gradient(circle_at_top_left,rgba(96,165,250,0.14),transparent_30%),linear-gradient(135deg,rgba(10,10,11,1)_0%,rgba(17,24,39,1)_52%,rgba(10,10,11,1)_100%)] shadow-[0_14px_28px_rgba(0,0,0,0.22)] ring-1 ring-blue-400/15"
          : isRoundReveal
          ? "border-emerald-400/20 bg-[radial-gradient(circle_at_top_left,rgba(52,211,153,0.14),transparent_28%),linear-gradient(135deg,rgba(10,10,11,1)_0%,rgba(16,24,20,1)_50%,rgba(10,10,11,1)_100%)] shadow-[0_14px_28px_rgba(0,0,0,0.2)]"
          : "border-white/10 bg-[radial-gradient(circle_at_top_left,rgba(255,255,255,0.05),transparent_28%),linear-gradient(135deg,rgba(10,10,11,1)_0%,rgba(17,24,39,0.96)_55%,rgba(10,10,11,1)_100%)] shadow-[0_14px_28px_rgba(0,0,0,0.2)]"
      }`}
    >
      <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(180deg,rgba(255,255,255,0.03),transparent_18%,transparent_82%,rgba(255,255,255,0.02))]" />

      <div className="relative p-2.5 sm:p-4">
        <div className="flex items-start justify-between gap-2.5">
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-1.5">
              <MetaPill className="border-white/10 bg-white/[0.05] text-neutral-300">
                {currentRoundNumber ? `Round ${currentRoundNumber}` : "Waiting"}
              </MetaPill>

              <MetaPill
                className={
                  isLive
                    ? "border-emerald-400/20 bg-emerald-500/10 text-emerald-300"
                    : "border-amber-400/20 bg-amber-500/10 text-amber-300"
                }
              >
                {isLive ? "Live now" : "Standby"}
              </MetaPill>

              <MetaPill className="border-white/10 bg-white/[0.05] text-neutral-400">
                {runModeLabel}
              </MetaPill>

              {questionCategory ? (
                <MetaPill className="border-white/10 bg-white/[0.05] text-neutral-300">
                  {questionCategory}
                </MetaPill>
              ) : null}

              {questionDifficulty ? (
                <MetaPill className={getDifficultyPillClass(questionDifficulty)}>
                  {questionDifficulty}
                </MetaPill>
              ) : null}
            </div>
          </div>

          <TimerChip
            hasActiveRound={hasActiveRound}
            timeLeft={timeLeft}
            isWarning={isWarning}
            isDanger={isDanger}
          />
        </div>

        <div className="mt-2.5 rounded-[16px] border border-white/8 bg-black/20 px-3 py-3 sm:mt-3 sm:rounded-[18px] sm:px-3.5 sm:py-3.5">
          <div className="text-[9px] uppercase tracking-[0.16em] text-blue-300/70">
            {hasActiveRound
              ? "Current question"
              : isRoundReveal
              ? "Round result"
              : "Trivia state"}
          </div>

          <div className="mt-2 min-h-[54px] sm:min-h-[64px]">
            {hasActiveRound ? (
              <div
                className={`text-[15px] font-semibold tracking-[-0.02em] text-white transition-all duration-500 sm:text-[17px] ${
                  isQuestionFresh
                    ? "translate-y-0 opacity-100 drop-shadow-[0_0_10px_rgba(96,165,250,0.16)]"
                    : "translate-y-0 opacity-100"
                }`}
                style={{
                  lineHeight: 1.34,
                  overflowWrap: "anywhere",
                }}
              >
                {questionText}
              </div>
            ) : (
              <div
                className="text-[12px] leading-5 text-neutral-400 sm:text-[14px] sm:leading-6"
                style={{ overflowWrap: "anywhere" }}
              >
                {standbyText}
              </div>
            )}
          </div>
        </div>

        <div className="mt-2.5 min-h-[48px] sm:mt-3 sm:min-h-[58px]">
          {hasRevealContent ? (
            <TriviaRevealTray
              correctAnswer={correctAnswer}
              roundWinners={roundWinners}
              isRoundReveal={isRoundReveal}
              maxVisibleWinners={3}
              lastRoundPlacement={lastRoundPlacement}
            />
          ) : (
            <div className="flex items-center justify-between rounded-[14px] border border-white/8 bg-black/20 px-3 py-2 sm:rounded-[16px] sm:px-3.5 sm:py-2.5">
              <div className="min-w-0">
                <div className="text-[8px] uppercase tracking-[0.14em] text-neutral-500">
                  Live state
                </div>
                <div className="mt-1 text-[11px] font-medium text-neutral-300 sm:text-[12px]">
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
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

  const timerShellClass = hasActiveRound
    ? isDanger
      ? "border-red-400/35 bg-red-500/10 ring-1 ring-red-400/20 shadow-[0_0_34px_rgba(248,113,113,0.18)]"
      : isWarning
      ? "border-amber-400/35 bg-amber-500/10 ring-1 ring-amber-400/20 shadow-[0_0_30px_rgba(251,191,36,0.16)]"
      : "border-blue-400/20 bg-blue-500/10 ring-1 ring-blue-400/15 shadow-[0_0_28px_rgba(96,165,250,0.14)]"
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
      className={`relative overflow-hidden rounded-[24px] border shadow-[0_24px_60px_rgba(0,0,0,0.28)] transition-all duration-500 sm:rounded-[28px] ${
        isQuestionFresh
          ? "border-blue-400/25 bg-[radial-gradient(circle_at_top_left,rgba(96,165,250,0.16),transparent_30%),linear-gradient(135deg,rgba(10,10,11,1)_0%,rgba(17,24,39,1)_52%,rgba(10,10,11,1)_100%)] ring-1 ring-blue-400/15"
          : isRoundReveal
          ? "border-emerald-400/20 bg-[radial-gradient(circle_at_top_left,rgba(52,211,153,0.14),transparent_28%),linear-gradient(135deg,rgba(10,10,11,1)_0%,rgba(16,24,20,1)_50%,rgba(10,10,11,1)_100%)]"
          : "border-white/10 bg-[radial-gradient(circle_at_top_left,rgba(255,255,255,0.055),transparent_28%),linear-gradient(135deg,rgba(10,10,11,1)_0%,rgba(17,24,39,0.96)_55%,rgba(10,10,11,1)_100%)]"
      }`}
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

      <div className="relative p-3.5 sm:p-4 lg:p-5">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <span className="rounded-full border border-white/10 bg-white/[0.05] px-2.5 py-1 text-[10px] font-medium uppercase tracking-[0.16em] text-neutral-300">
                {currentRoundNumber ? `Round ${currentRoundNumber}` : "Waiting"}
              </span>

              <span
                className={`rounded-full px-2.5 py-1 text-[10px] font-medium uppercase tracking-[0.16em] ${
                  isLive
                    ? "bg-emerald-500/15 text-emerald-300"
                    : "bg-amber-500/15 text-amber-300"
                }`}
              >
                {isLive ? "Live now" : "Standby"}
              </span>

              <span className="rounded-full border border-white/10 bg-white/[0.05] px-2.5 py-1 text-[10px] font-medium uppercase tracking-[0.16em] text-neutral-400">
                {runModeLabel}
              </span>

              {questionCategory ? (
                <span className="rounded-full border border-white/10 bg-white/[0.05] px-2.5 py-1 text-[10px] font-medium uppercase tracking-[0.16em] text-neutral-300">
                  {questionCategory}
                </span>
              ) : null}

              {questionDifficulty ? (
                <span
                  className={`rounded-full border px-2.5 py-1 text-[10px] font-medium uppercase tracking-[0.16em] ${getDifficultyPillClass(
                    questionDifficulty
                  )}`}
                >
                  {questionDifficulty}
                </span>
              ) : null}
            </div>

            <div className="mt-3 text-[10px] uppercase tracking-[0.2em] text-blue-300/70">
              {hasActiveRound
                ? "Current question"
                : isRoundReveal
                ? "Round result"
                : "Trivia state"}
            </div>
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
              className={`relative min-w-[100px] rounded-[20px] border px-4 py-2 text-center shadow-lg shadow-black/20 backdrop-blur-md transition-all duration-300 sm:min-w-[112px] ${timerShellClass}`}
            >
              <div className="text-[8px] uppercase tracking-[0.18em] text-neutral-400">
                {hasActiveRound ? "Timer" : "State"}
              </div>

              <div
                className={`mt-1 font-bold leading-none tracking-[-0.04em] transition-all duration-300 ${timerTextClass} ${
                  hasActiveRound
                    ? isDanger
                      ? "text-[30px] sm:text-[32px] scale-[1.04]"
                      : isWarning
                      ? "text-[28px] sm:text-[30px]"
                      : "text-[26px] sm:text-[28px]"
                    : "text-[18px]"
                }`}
              >
                {hasActiveRound ? `${timeLeft}s` : "Ready"}
              </div>
            </div>
          </div>
        </div>

        <div className="mt-4 rounded-[20px] border border-white/8 bg-black/20 px-3.5 py-3.5 sm:px-4 sm:py-4">
          <div className="max-h-[112px] overflow-y-auto pr-1 sm:max-h-[124px]">
            {hasActiveRound ? (
              <div
                className={`text-[15px] font-semibold tracking-[-0.02em] text-white transition-all duration-500 sm:text-[16px] lg:text-[18px] ${
                  isQuestionFresh
                    ? "translate-y-0 opacity-100 drop-shadow-[0_0_10px_rgba(96,165,250,0.16)]"
                    : "translate-y-0 opacity-100"
                }`}
                style={{
                  lineHeight: 1.35,
                  overflowWrap: "anywhere",
                }}
              >
                {questionText}
              </div>
            ) : (
              <div
                className="max-w-[42rem] text-[13px] leading-6 text-neutral-400 sm:text-[14px]"
                style={{
                  overflowWrap: "anywhere",
                }}
              >
                {standbyText}
              </div>
            )}
          </div>
        </div>

        <div className="mt-3 min-h-[64px] sm:min-h-[70px]">
          {hasRevealContent ? (
            <TriviaRevealTray
              correctAnswer={correctAnswer}
              roundWinners={roundWinners}
              isRoundReveal={isRoundReveal}
              maxVisibleWinners={3}
              lastRoundPlacement={lastRoundPlacement}
            />
          ) : (
            <div className="flex h-full items-center justify-between rounded-[18px] border border-white/8 bg-black/20 px-3.5 py-3">
              <div className="min-w-0">
                <div className="text-[9px] uppercase tracking-[0.16em] text-neutral-500">
                  Live state
                </div>
                <div
                  className="mt-1 text-[12px] font-medium text-neutral-300"
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
                className={`ml-3 h-2.5 w-2.5 shrink-0 rounded-full ${
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
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
      roundId: "",
      text: "",
      questionImageUrl: "",
      answerImageUrl: "",
      answerExplanation: "",
      sourceExcerpt: "",
      concept: "",
      totalQuestions: null,
      sessionTitle: "",
      category: "",
      difficulty: "",
    };
  }

  if (typeof currentQuestion === "string") {
    return {
      roundId: "",
      text: currentQuestion,
      questionImageUrl: "",
      answerImageUrl: "",
      answerExplanation: "",
      sourceExcerpt: "",
      concept: "",
      totalQuestions: null,
      sessionTitle: "",
      category: "",
      difficulty: "",
    };
  }

  return {
    roundId: currentQuestion.roundId || "",
    text:
      currentQuestion.questionText ||
      currentQuestion.text ||
      currentQuestion.prompt ||
      "",
    questionImageUrl:
      currentQuestion.questionImageUrl ||
      currentQuestion.imageUrl ||
      "",
    answerImageUrl: currentQuestion.answerImageUrl || "",
    answerExplanation: currentQuestion.answerExplanation || "",
    sourceExcerpt: currentQuestion.sourceExcerpt || "",
    concept: currentQuestion.concept || "",
    totalQuestions: currentQuestion.totalQuestions ?? null,
    sessionTitle: currentQuestion.sessionTitle || "",
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

function MetaPill({ children, className = "" }) {
  return (
    <span
      className={`inline-flex items-center rounded-full border px-2 py-0.5 text-[9px] font-medium uppercase tracking-[0.12em] sm:px-2.5 sm:py-1 sm:text-[10px] ${className}`}
    >
      {children}
    </span>
  );
}

const antiCopyProps = {
  onCopy: (event) => event.preventDefault(),
  onCut: (event) => event.preventDefault(),
  onContextMenu: (event) => event.preventDefault(),
  onDragStart: (event) => event.preventDefault(),
  style: {
    WebkitUserSelect: "none",
    userSelect: "none",
  },
};

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
  compact = false,
}) {
  const isLive = !!sessionStatus?.isLiveNow;
  const question = normaliseQuestion(currentQuestion);
  const isFiniteBattle = Number(question.totalQuestions) > 0;
  const runModeLabel = isFiniteBattle
    ? "Battle It"
    : sessionStatus?.runMode === "scheduled"
    ? "Scheduled"
    : "Continuous";
  const hasRevealContent = !!correctAnswer || roundWinners.length > 0;

  const isWarning = !!hasActiveRound && timeLeft <= 10 && timeLeft > 5;
  const isDanger = !!hasActiveRound && timeLeft <= 5;

  const questionText = question.text || "Waiting for the next question...";
  const questionImageUrl = question.questionImageUrl || "";
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
      className={`relative overflow-hidden border transition-all duration-500 ${
        compact ? "rounded-[18px] sm:rounded-[20px]" : "rounded-[18px] sm:rounded-[24px]"
      } ${
        isQuestionFresh
          ? "border-blue-400/25 bg-[radial-gradient(circle_at_top_left,rgba(96,165,250,0.14),transparent_30%),linear-gradient(135deg,rgba(10,10,11,1)_0%,rgba(17,24,39,1)_52%,rgba(10,10,11,1)_100%)] shadow-[0_14px_28px_rgba(0,0,0,0.22)] ring-1 ring-blue-400/15"
          : isRoundReveal
          ? "border-emerald-400/20 bg-[radial-gradient(circle_at_top_left,rgba(52,211,153,0.14),transparent_28%),linear-gradient(135deg,rgba(10,10,11,1)_0%,rgba(16,24,20,1)_50%,rgba(10,10,11,1)_100%)] shadow-[0_14px_28px_rgba(0,0,0,0.2)]"
          : "border-white/10 bg-[radial-gradient(circle_at_top_left,rgba(255,255,255,0.05),transparent_28%),linear-gradient(135deg,rgba(10,10,11,1)_0%,rgba(17,24,39,0.96)_55%,rgba(10,10,11,1)_100%)] shadow-[0_14px_28px_rgba(0,0,0,0.2)]"
      }`}
    >
      <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(180deg,rgba(255,255,255,0.03),transparent_18%,transparent_82%,rgba(255,255,255,0.02))]" />

      <div className={`relative ${compact ? "p-2.5 sm:p-3" : "p-2.5 sm:p-4"}`}>
        <div className={`flex items-start justify-between ${compact ? "gap-2" : "gap-2.5"}`}>
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-1.5">
              <MetaPill className="border-white/10 bg-white/[0.05] text-neutral-300">
                {currentRoundNumber
                  ? isFiniteBattle
                    ? `Question ${currentRoundNumber} of ${question.totalQuestions}`
                    : `Round ${currentRoundNumber}`
                  : "Waiting"}
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

            </div>

            {question.sessionTitle || questionCategory || questionDifficulty ? (
              <div className="mt-2 truncate text-[11px] font-medium text-neutral-400 sm:text-xs">
                {[question.sessionTitle, runModeLabel, questionCategory, questionDifficulty]
                  .filter(Boolean)
                  .join(" · ")}
              </div>
            ) : null}
          </div>

          <TimerChip
            hasActiveRound={hasActiveRound}
            timeLeft={timeLeft}
            isWarning={isWarning}
            isDanger={isDanger}
          />
        </div>

        <div
          className={`rounded-[16px] border border-white/8 bg-black/20 ${
            compact
              ? "mt-2 px-3 py-2.5 sm:rounded-[16px] sm:px-3 sm:py-3"
              : "mt-2 px-3 py-3 sm:mt-3 sm:rounded-[18px] sm:px-3.5 sm:py-3.5"
          }`}
        >
          <div className="text-[9px] uppercase tracking-[0.16em] text-blue-300/70">
            {hasActiveRound
              ? "Current question"
              : isRoundReveal
              ? "Round result"
              : "Trivia state"}
          </div>

          <div className={compact ? "mt-1.5 min-h-[44px] sm:min-h-[52px]" : "mt-2 min-h-[48px] sm:min-h-[64px]"}>
            {hasActiveRound ? (
              <div>
                {questionImageUrl ? (
                  <div className={compact ? "mb-2" : "mb-2.5"}>
                    <img
                      src={questionImageUrl}
                      alt="Trivia question"
                      className={`w-full rounded-[14px] border border-white/10 bg-[radial-gradient(circle_at_top,rgba(255,255,255,0.08),rgba(255,255,255,0.02))] object-contain ${
                        compact ? "max-h-40 p-2" : "max-h-60 p-2.5"
                      }`}
                      draggable={false}
                      onDragStart={antiCopyProps.onDragStart}
                      onContextMenu={antiCopyProps.onContextMenu}
                    />
                  </div>
                ) : null}

                <div
                  className={`font-semibold tracking-[-0.02em] text-white transition-all duration-500 ${
                    compact ? "text-[16px] sm:text-[18px]" : "text-[18px] sm:text-[22px]"
                  } ${
                    isQuestionFresh
                      ? "translate-y-0 opacity-100 drop-shadow-[0_0_10px_rgba(96,165,250,0.16)]"
                      : "translate-y-0 opacity-100"
                  }`}
                  style={{
                    lineHeight: 1.34,
                    overflowWrap: "anywhere",
                    ...antiCopyProps.style,
                  }}
                  onCopy={antiCopyProps.onCopy}
                  onCut={antiCopyProps.onCut}
                  onContextMenu={antiCopyProps.onContextMenu}
                  onDragStart={antiCopyProps.onDragStart}
                >
                  {questionText}
                </div>
              </div>
            ) : (
              <div
                className={`text-neutral-400 ${
                  compact ? "text-[11px] leading-5 sm:text-[13px] sm:leading-5" : "text-[12px] leading-5 sm:text-[14px] sm:leading-6"
                }`}
                style={{ overflowWrap: "anywhere" }}
              >
                {standbyText}
              </div>
            )}
          </div>
        </div>

        <div className={compact ? "mt-2 min-h-[40px] sm:min-h-[46px]" : "mt-2 min-h-[44px] sm:mt-3 sm:min-h-[58px]"}>
          {hasRevealContent ? (
            <div className="space-y-2">
              <TriviaRevealTray
                key={question.roundId || correctAnswer}
                roundId={question.roundId}
                correctAnswer={correctAnswer}
                roundWinners={roundWinners}
                isRoundReveal={isRoundReveal}
                answerImageUrl={question.answerImageUrl}
                answerExplanation={question.answerExplanation}
                maxVisibleWinners={3}
                lastRoundPlacement={lastRoundPlacement}
              />

              {correctAnswer && question.sourceExcerpt ? (
                <div className="rounded-[14px] border border-cyan-400/15 bg-cyan-500/[0.06] px-3 py-2.5">
                  <div className="text-[8px] font-semibold uppercase tracking-[0.16em] text-cyan-200/75">
                    Proof from the notes{question.concept ? ` · ${question.concept}` : ""}
                  </div>
                  <div className="mt-1.5 text-[11px] leading-5 text-neutral-300 sm:text-[12px]">
                    {question.sourceExcerpt}
                  </div>
                </div>
              ) : null}
            </div>
          ) : !hasActiveRound ? (
            <div
              className={`flex items-center justify-between rounded-[14px] border border-white/8 bg-black/20 ${
                compact ? "px-3 py-2 sm:rounded-[14px] sm:px-3 sm:py-2" : "px-3 py-2 sm:rounded-[16px] sm:px-3.5 sm:py-2.5"
              }`}
            >
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
          ) : (
            <div className="flex items-center gap-2 px-1 text-[11px] font-medium text-blue-200/80 sm:text-xs">
              <span className="h-2 w-2 shrink-0 rounded-full bg-blue-300 shadow-[0_0_10px_rgba(147,197,253,0.7)]" />
              Submit your answer below before the timer ends.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

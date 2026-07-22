function getWhisperTone(message) {
  const value = (message || "").toLowerCase();

  if (
    value.includes("correct") ||
    value.includes("points") ||
    value.includes("already answered correctly")
  ) {
    return {
      dot: "bg-emerald-300",
      text: "text-emerald-200",
      meta: "text-emerald-200/70",
    };
  }

  if (
    value.includes("incorrect") ||
    value.includes("slow down") ||
    value.includes("used all")
  ) {
    return {
      dot: "bg-amber-300",
      text: "text-amber-200",
      meta: "text-amber-200/70",
    };
  }

  return {
    dot: "bg-blue-300",
    text: "text-neutral-300",
    meta: "text-neutral-500",
  };
}

function getWhisperStatus(
  answerFeedback,
  attemptsInfo,
  currentRoundId,
  singleChoice
) {
  if (!currentRoundId) {
    return {
      text: "",
      meta: "",
    };
  }

  if (singleChoice) {
    return answerFeedback
      ? {
          text: answerFeedback,
          meta: "Answer locked",
        }
      : {
          text: "Choose one answer. Your choice is final.",
          meta: "Round live",
        };
  }

  const leftAttempts =
    typeof attemptsInfo?.left === "number"
      ? attemptsInfo.left
      : attemptsInfo?.max ?? 5;

  const value = (answerFeedback || "").toLowerCase();

  if (
    value.includes("correct") ||
    value.includes("points") ||
    value.includes("already answered correctly")
  ) {
    return {
      text: answerFeedback,
      meta: `${leftAttempts} left`,
    };
  }

  if (
    value.includes("incorrect") ||
    value.includes("slow down") ||
    value.includes("used all")
  ) {
    return {
      text: answerFeedback || `${leftAttempts} wrong attempts left.`,
      meta: `${leftAttempts} left`,
    };
  }

  if (typeof attemptsInfo?.left === "number") {
    return {
      text: `${leftAttempts} wrong attempt${
        leftAttempts === 1 ? "" : "s"
      } left.`,
      meta: "Round live",
    };
  }

  return {
    text: "5 wrong attempts per round.",
    meta: "Round live",
  };
}

export default function TriviaWhisperStatus({
  answerFeedback,
  attemptsInfo,
  currentRoundId,
  singleChoice = false,
}) {
  const status = getWhisperStatus(
    answerFeedback,
    attemptsInfo,
    currentRoundId,
    singleChoice
  );

  if (!status.text) {
    return null;
  }

  const tone = getWhisperTone(status.text);

  return (
    <div className="mb-1.5 flex items-center justify-between px-1">
      <div className="flex min-w-0 items-center gap-2">
        <span
          className={`h-1.5 w-1.5 shrink-0 rounded-full ${tone.dot}`}
        />
        <span className={`truncate text-[10px] ${tone.text}`}>
          {status.text}
        </span>
      </div>

      {status.meta ? (
        <span className={`shrink-0 text-[10px] ${tone.meta}`}>
          {status.meta}
        </span>
      ) : null}
    </div>
  );
}

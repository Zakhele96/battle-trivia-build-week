function getWhisperTone(message) {
  const value = (message || "").toLowerCase();

  if (
    value.includes("correct") ||
    value.includes("points") ||
    value.includes("already solved")
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
    dot: "bg-violet-300",
    text: "text-neutral-300",
    meta: "text-neutral-500",
  };
}

function getRemainingTries(guessFeedback) {
  if (typeof guessFeedback?.wrongAttemptsLeft === "number") {
    return guessFeedback.wrongAttemptsLeft;
  }

  if (typeof guessFeedback?.WrongAttemptsLeft === "number") {
    return guessFeedback.WrongAttemptsLeft;
  }

  if (typeof guessFeedback?.maxWrongAttempts === "number") {
    return guessFeedback.maxWrongAttempts;
  }

  if (typeof guessFeedback?.MaxWrongAttempts === "number") {
    return guessFeedback.MaxWrongAttempts;
  }

  return 5;
}

function getWhisperStatus(guessFeedback, currentRoundId) {
  if (!currentRoundId) {
    return {
      text: "",
      meta: "",
    };
  }

  const remainingTries = getRemainingTries(guessFeedback);
  const value = (guessFeedback?.message || "").toLowerCase();

  if (
    value.includes("correct") ||
    value.includes("points") ||
    value.includes("already solved")
  ) {
    return {
      text: guessFeedback?.message || "Correct guess!",
      meta: `${remainingTries} left`,
    };
  }

  if (
    value.includes("incorrect") ||
    value.includes("slow down") ||
    value.includes("used all")
  ) {
    return {
      text:
        guessFeedback?.message ||
        `${remainingTries} wrong ${remainingTries === 1 ? "try" : "tries"} left.`,
      meta: `${remainingTries} left`,
    };
  }

  return {
    text: `${remainingTries} wrong ${remainingTries === 1 ? "try" : "tries"} left.`,
    meta: "Round live",
  };
}

export default function WordScrambleWhisperStatus({
  guessFeedback,
  currentRoundId,
}) {
  const status = getWhisperStatus(guessFeedback, currentRoundId);

  if (!status.text) {
    return null;
  }

  const tone = getWhisperTone(status.text);

  return (
    <div className="mb-1.5 flex items-center justify-between px-1">
      <div className="flex min-w-0 items-center gap-2">
        <span className={`h-1.5 w-1.5 shrink-0 rounded-full ${tone.dot}`} />
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

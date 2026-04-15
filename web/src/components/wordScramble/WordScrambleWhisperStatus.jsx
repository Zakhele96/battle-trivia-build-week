export default function WordScrambleWhisperStatus({
  guessFeedback,
  currentRoundId,
}) {
  if (!currentRoundId) {
    return (
      <div className="rounded-[16px] border border-white/10 bg-white/[0.04] px-3 py-2 text-sm text-neutral-300">
        Waiting for the next word...
      </div>
    );
  }

  if (!guessFeedback) {
    return (
      <div className="rounded-[16px] border border-white/10 bg-white/[0.04] px-3 py-2 text-sm text-neutral-300">
        Type your best guess before the word is fully revealed.
      </div>
    );
  }

  if (guessFeedback.isCorrect) {
    return (
      <div className="rounded-[16px] border border-emerald-500/20 bg-emerald-500/10 px-3 py-2 text-sm text-emerald-200">
        {guessFeedback.message}
      </div>
    );
  }

  return (
    <div className="rounded-[16px] border border-amber-500/20 bg-amber-500/10 px-3 py-2 text-sm text-amber-200">
      {guessFeedback.message}
    </div>
  );
}
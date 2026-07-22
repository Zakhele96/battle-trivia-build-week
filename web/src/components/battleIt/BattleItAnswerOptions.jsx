import { useState } from "react";

const optionLabels = ["A", "B", "C", "D"];

export default function BattleItAnswerOptions({
  roundId,
  options = [],
  onSelect,
  answerResult,
  disabled = false,
}) {
  const [selected, setSelected] = useState("");
  const [busy, setBusy] = useState("");

  const handleSelect = async (option) => {
    if (!roundId || selected || busy || disabled) return;
    setBusy(option);
    const submitted = await onSelect(option);
    if (submitted) setSelected(option);
    setBusy("");
  };

  if (!roundId || options.length !== 4) {
    return (
      <div className="rounded-[16px] border border-white/10 bg-white/[0.04] px-4 py-3 text-center text-sm text-neutral-400">
        Waiting for the next four-option question...
      </div>
    );
  }

  return (
    <div>
      <div className="mb-2 flex items-center justify-between gap-3 px-1 text-[11px] font-semibold uppercase tracking-[0.14em] text-neutral-500">
        <span>Choose one answer</span>
        <span>{selected ? "Answer locked" : "One choice only"}</span>
      </div>
      <div className="grid grid-cols-1 gap-2 min-[460px]:grid-cols-2">
        {options.map((option, index) => {
          const isSelected = selected === option;
          const selectedIsWrong =
            isSelected &&
            answerResult?.roundId === roundId &&
            answerResult?.isCorrect === false;
          return (
            <button
              key={`${option}-${index}`}
              type="button"
              onClick={() => handleSelect(option)}
              disabled={disabled || Boolean(selected) || Boolean(busy)}
              aria-pressed={isSelected}
              className={`flex min-h-12 items-center gap-3 rounded-[16px] border px-3 py-2.5 text-left text-sm font-medium transition ${
                selectedIsWrong
                  ? "border-rose-400/60 bg-rose-500/15 text-rose-50 shadow-[0_0_0_1px_rgba(251,113,133,0.08)]"
                  : isSelected
                  ? "border-cyan-300/50 bg-cyan-300/15 text-cyan-50"
                  : "border-white/10 bg-white/[0.045] text-white hover:border-cyan-300/30 hover:bg-cyan-300/[0.08]"
              } disabled:cursor-not-allowed disabled:opacity-65`}
            >
              <span className={`grid h-8 w-8 shrink-0 place-items-center rounded-full text-xs font-bold ${
                selectedIsWrong
                  ? "bg-rose-400 text-rose-950"
                  : isSelected
                  ? "bg-cyan-300 text-neutral-950"
                  : "bg-white/10 text-neutral-300"
              }`}>
                {optionLabels[index]}
              </span>
              <span className="min-w-0 leading-5">
                {busy === option ? "Submitting..." : option}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}

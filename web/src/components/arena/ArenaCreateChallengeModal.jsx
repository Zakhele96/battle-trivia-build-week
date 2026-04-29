import { useEffect, useState } from "react";

const challengeTypes = [
  "Rap Battle",
  "Poetry Battle",
  "Freestyle Prompt",
  "Love Poem",
  "Diss Battle",
  "Storytelling Verse",
  "Gospel/Inspirational",
  "Political/Social Commentary",
  "Comedy Bars",
  "Kasi Slang Challenge",
];

const inputClass =
  "w-full rounded-xl border border-white/10 bg-black/25 px-3 py-3 text-sm text-white outline-none transition placeholder:text-neutral-600 focus:border-[#f2b077]/40 focus:bg-black/35";

const initialForm = {
  title: "",
  challengeType: "Rap Battle",
  theme: "",
  rules: "",
  maxEntries: 8,
  submissionDurationHours: 24,
  votingDurationHours: 24,
};

function FieldLabel({ children }) {
  return (
    <span className="mb-2 block text-[10px] font-semibold uppercase tracking-[0.14em] text-neutral-500">
      {children}
    </span>
  );
}

export default function ArenaCreateChallengeModal({
  open,
  onClose,
  onSubmit,
  busy = false,
  error = "",
}) {
  const [form, setForm] = useState(initialForm);

  useEffect(() => {
    if (!open) {
      setForm(initialForm);
    }
  }, [open]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[80] bg-black/80 backdrop-blur-md">
      <div className="h-[100dvh] w-full bg-neutral-950 sm:flex sm:items-center sm:justify-center sm:bg-black/40 sm:p-4">
        <form
          className="flex h-full w-full flex-col overflow-hidden sm:h-auto sm:max-h-[46rem] sm:max-w-2xl sm:rounded-[28px] sm:border sm:border-white/10 sm:bg-neutral-950 sm:shadow-[0_30px_70px_rgba(0,0,0,0.4)]"
          onSubmit={(event) => {
            event.preventDefault();
            onSubmit?.({
              ...form,
              maxEntries: Number(form.maxEntries) || 8,
              submissionDurationHours:
                Number(form.submissionDurationHours) || 24,
              votingDurationHours: Number(form.votingDurationHours) || 24,
            });
          }}
        >
          <div className="shrink-0 border-b border-white/8 bg-neutral-950 px-4 pb-3 pt-[calc(env(safe-area-inset-top)+0.9rem)] sm:px-5 sm:pt-5">
            <div className="flex items-start justify-between gap-3">
              <div>
                <div className="text-[10px] font-semibold uppercase tracking-[0.16em] text-blue-300/70">
                  RapNometry Arena
                </div>
                <h2 className="mt-1 text-[28px] font-semibold tracking-[-0.05em] text-white sm:text-2xl">
                  Create challenge
                </h2>
                <div className="mt-1 max-w-xl text-sm leading-6 text-neutral-400">
                  Keep it simple on mobile. Clear title, clear theme, clear timing.
                </div>
              </div>

              <button
                type="button"
                onClick={onClose}
                className="shrink-0 rounded-full border border-white/10 px-3 py-1.5 text-sm text-neutral-300 hover:bg-white/[0.06]"
              >
                Close
              </button>
            </div>
          </div>

          <div className="min-h-0 flex-1 overflow-y-auto px-4 py-4 pb-28 sm:px-5 sm:py-5 sm:pb-6">
            <div className="space-y-4">
              <label className="block">
                <FieldLabel>Challenge title</FieldLabel>
                <input
                  value={form.title}
                  onChange={(e) =>
                    setForm((prev) => ({ ...prev, title: e.target.value }))
                  }
                  placeholder="Example: 8 bars about hustle"
                  className={inputClass}
                />
              </label>

              <label className="block">
                <FieldLabel>Challenge type</FieldLabel>
                <select
                  value={form.challengeType}
                  onChange={(e) =>
                    setForm((prev) => ({
                      ...prev,
                      challengeType: e.target.value,
                    }))
                  }
                  className={inputClass}
                >
                  {challengeTypes.map((item) => (
                    <option key={item} value={item}>
                      {item}
                    </option>
                  ))}
                </select>
              </label>

              <label className="block">
                <FieldLabel>Theme</FieldLabel>
                <input
                  value={form.theme}
                  onChange={(e) =>
                    setForm((prev) => ({ ...prev, theme: e.target.value }))
                  }
                  placeholder="Kasi life, betrayal, love..."
                  className={inputClass}
                />
              </label>

              <label className="block">
                <FieldLabel>Rules</FieldLabel>
                <textarea
                  rows="4"
                  value={form.rules}
                  onChange={(e) =>
                    setForm((prev) => ({ ...prev, rules: e.target.value }))
                  }
                  placeholder="Lines max, no swearing, allowed languages..."
                  className={inputClass}
                />
              </label>

              <div className="rounded-[20px] border border-white/8 bg-white/[0.03] p-4">
                <div className="text-[10px] font-semibold uppercase tracking-[0.16em] text-[#f2b077]">
                  Battle timing
                </div>
                <div className="mt-1 text-sm leading-6 text-neutral-400">
                  Voting can start early if all entry slots fill up before the submit window ends.
                </div>

                <div className="mt-4 grid gap-3">
                  <label className="block">
                    <FieldLabel>Max entries</FieldLabel>
                    <input
                      type="number"
                      min="2"
                      max="20"
                      value={form.maxEntries}
                      onChange={(e) =>
                        setForm((prev) => ({
                          ...prev,
                          maxEntries: e.target.value,
                        }))
                      }
                      className={inputClass}
                    />
                  </label>

                  <div className="grid gap-3 sm:grid-cols-2">
                    <label className="block">
                      <FieldLabel>Submit hours</FieldLabel>
                      <input
                        type="number"
                        min="1"
                        max="72"
                        value={form.submissionDurationHours}
                        onChange={(e) =>
                          setForm((prev) => ({
                            ...prev,
                            submissionDurationHours: e.target.value,
                          }))
                        }
                        className={inputClass}
                      />
                    </label>

                    <label className="block">
                      <FieldLabel>Voting hours</FieldLabel>
                      <input
                        type="number"
                        min="1"
                        max="72"
                        value={form.votingDurationHours}
                        onChange={(e) =>
                          setForm((prev) => ({
                            ...prev,
                            votingDurationHours: e.target.value,
                          }))
                        }
                        className={inputClass}
                      />
                    </label>
                  </div>
                </div>
              </div>

              {error ? (
                <div className="rounded-xl border border-red-900/40 bg-red-950/30 px-3 py-2 text-sm text-red-300">
                  {error}
                </div>
              ) : null}
            </div>
          </div>

          <div className="shrink-0 border-t border-white/8 bg-neutral-950/98 px-4 py-3 pb-[calc(env(safe-area-inset-bottom)+0.9rem)] backdrop-blur sm:px-5 sm:pb-4">
            <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
              <div className="text-xs text-neutral-500">
                Your challenge goes live to the room immediately.
              </div>

              <button
                type="submit"
                disabled={busy}
                className="w-full rounded-xl bg-white px-4 py-3 text-sm font-semibold text-neutral-950 disabled:opacity-60 sm:w-auto sm:min-w-[11rem]"
              >
                {busy ? "Posting..." : "Post challenge"}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}

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
  "w-full rounded-xl border border-white/10 bg-black/25 px-3 py-2 text-sm text-white outline-none transition placeholder:text-neutral-600 focus:border-blue-400/40 focus:bg-black/35";

const initialForm = {
  title: "",
  challengeType: "Rap Battle",
  theme: "",
  rules: "",
  maxEntries: 8,
  submissionDurationHours: 24,
  votingDurationHours: 24,
};

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
    <div className="fixed inset-0 z-[80] flex items-end justify-center bg-black/75 px-3 py-3 backdrop-blur-md sm:items-center sm:py-6">
      <div className="max-h-[92vh] w-full max-w-2xl overflow-hidden rounded-[28px] border border-white/10 bg-neutral-950 shadow-[0_30px_70px_rgba(0,0,0,0.4)]">
        <div className="flex items-start justify-between gap-3">
          <div className="px-5 pt-5">
            <div className="text-[10px] font-semibold uppercase tracking-[0.16em] text-blue-300/70">
              RapNometry Arena
            </div>
            <h2 className="mt-1 text-xl font-semibold tracking-[-0.03em] text-white">
              Create challenge
            </h2>
            <div className="mt-1 text-sm text-neutral-400">
              Make it easy for people to jump in. Clear theme, clear rules, clean time windows.
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="mr-5 mt-5 rounded-full border border-white/10 px-3 py-1 text-sm text-neutral-300 hover:bg-white/[0.06]"
          >
            Close
          </button>
        </div>

        <form
          className="mt-5"
          onSubmit={(event) => {
            event.preventDefault();
            onSubmit?.({
              ...form,
              maxEntries: Number(form.maxEntries) || 8,
              submissionDurationHours: Number(form.submissionDurationHours) || 24,
              votingDurationHours: Number(form.votingDurationHours) || 24,
            });
          }}
        >
          <div className="max-h-[calc(92vh-10.5rem)] overflow-y-auto px-5 pb-5">
            <div className="space-y-4">
              <label className="block">
                <span className="mb-2 block text-[10px] font-semibold uppercase tracking-[0.14em] text-neutral-500">
                  Challenge title
                </span>
                <input
                  value={form.title}
                  onChange={(e) =>
                    setForm((prev) => ({ ...prev, title: e.target.value }))
                  }
                  placeholder="Example: 8 bars about hustle"
                  className={inputClass}
                />
              </label>

              <div className="grid gap-4 sm:grid-cols-2">
                <label className="block">
                  <span className="mb-2 block text-[10px] font-semibold uppercase tracking-[0.14em] text-neutral-500">
                    Challenge type
                  </span>
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
                  <span className="mb-2 block text-[10px] font-semibold uppercase tracking-[0.14em] text-neutral-500">
                    Theme
                  </span>
                  <input
                    value={form.theme}
                    onChange={(e) =>
                      setForm((prev) => ({ ...prev, theme: e.target.value }))
                    }
                    placeholder="Kasi life, betrayal, love..."
                    className={inputClass}
                  />
                </label>
              </div>

              <label className="block">
                <span className="mb-2 block text-[10px] font-semibold uppercase tracking-[0.14em] text-neutral-500">
                  Rules
                </span>
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
                <div className="mt-1 text-sm text-neutral-400">
                  Voting can start earlier if all entries fill up before the submit window ends.
                </div>

                <div className="mt-4 grid gap-3 sm:grid-cols-3">
                  <label>
                    <span className="mb-1 block text-[10px] font-semibold uppercase tracking-[0.14em] text-neutral-500">
                      Max entries
                    </span>
                    <input
                      type="number"
                      min="2"
                      max="20"
                      value={form.maxEntries}
                      onChange={(e) =>
                        setForm((prev) => ({ ...prev, maxEntries: e.target.value }))
                      }
                      className={inputClass}
                    />
                  </label>
                  <label>
                    <span className="mb-1 block text-[10px] font-semibold uppercase tracking-[0.14em] text-neutral-500">
                      Submit hours
                    </span>
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
                  <label>
                    <span className="mb-1 block text-[10px] font-semibold uppercase tracking-[0.14em] text-neutral-500">
                      Voting hours
                    </span>
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

              {error ? (
                <div className="rounded-xl border border-red-900/40 bg-red-950/30 px-3 py-2 text-sm text-red-300">
                  {error}
                </div>
              ) : null}
            </div>
          </div>

          <div className="border-t border-white/8 px-5 py-4">
            <div className="flex justify-end">
              <button
                type="submit"
                disabled={busy}
                className="w-full rounded-xl bg-white px-4 py-3 text-sm font-semibold text-neutral-950 disabled:opacity-60 sm:w-auto"
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

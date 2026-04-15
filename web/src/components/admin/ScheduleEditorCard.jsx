export default function ScheduleEditorCard({
  windows = [],
  isSaving = false,
  onChangeWindow,
  onAddWindow,
  onRemoveWindow,
  onSave,
}) {
  return (
    <div className="rounded-[26px] border border-white/10 bg-neutral-950/80 p-5">
      <div className="flex items-center justify-between gap-3">
        <div>
          <h3 className="text-sm font-semibold text-white">Daily live windows</h3>
          <div className="mt-0.5 text-[11px] text-neutral-500">
            Used when scheduled mode is active
          </div>
        </div>

        <button
          type="button"
          onClick={onAddWindow}
          className="rounded-[16px] border border-white/10 bg-white/[0.04] px-3 py-2 text-sm font-medium text-white transition-all duration-200 hover:bg-white/[0.07]"
        >
          Add window
        </button>
      </div>

      <div className="mt-4 space-y-3">
        {windows.length === 0 ? (
          <div className="rounded-[20px] border border-white/6 bg-white/[0.03] px-4 py-6 text-sm text-neutral-500">
            No scheduled windows yet.
          </div>
        ) : (
          windows.map((window, index) => (
            <div
              key={window.id ?? index}
              className="rounded-[20px] border border-white/6 bg-white/[0.03] p-4"
            >
              <div className="grid gap-3 md:grid-cols-[1fr_1fr_auto]">
                <div>
                  <label className="mb-2 block text-[10px] uppercase tracking-[0.16em] text-neutral-500">
                    Start
                  </label>
                  <input
                    type="time"
                    value={window.startTime || ""}
                    onChange={(e) =>
                      onChangeWindow?.(index, {
                        ...window,
                        startTime: e.target.value,
                      })
                    }
                    className="h-[46px] w-full rounded-[16px] border border-white/10 bg-black/20 px-3 text-sm text-white outline-none focus:border-blue-400/20"
                  />
                </div>

                <div>
                  <label className="mb-2 block text-[10px] uppercase tracking-[0.16em] text-neutral-500">
                    End
                  </label>
                  <input
                    type="time"
                    value={window.endTime || ""}
                    onChange={(e) =>
                      onChangeWindow?.(index, {
                        ...window,
                        endTime: e.target.value,
                      })
                    }
                    className="h-[46px] w-full rounded-[16px] border border-white/10 bg-black/20 px-3 text-sm text-white outline-none focus:border-blue-400/20"
                  />
                </div>

                <div className="flex items-end">
                  <button
                    type="button"
                    onClick={() => onRemoveWindow?.(index)}
                    className="h-[46px] rounded-[16px] border border-red-500/15 bg-red-500/10 px-4 text-sm font-medium text-red-200 transition-all duration-200 hover:bg-red-500/15"
                  >
                    Remove
                  </button>
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      <div className="mt-4 flex justify-end">
        <button
          type="button"
          onClick={onSave}
          disabled={isSaving}
          className="rounded-[18px] bg-[linear-gradient(180deg,rgba(64,156,255,1)_0%,rgba(10,132,255,1)_100%)] px-4 py-2.5 text-sm font-semibold text-white shadow-[0_12px_28px_rgba(37,99,235,0.28)] transition-all duration-200 hover:-translate-y-[1px] disabled:cursor-not-allowed disabled:opacity-60"
        >
          {isSaving ? "Saving..." : "Save schedule"}
        </button>
      </div>
    </div>
  );
}
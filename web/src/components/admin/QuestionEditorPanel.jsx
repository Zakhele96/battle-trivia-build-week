export default function QuestionEditorPanel({
  form,
  isEditing = false,
  isSaving = false,
  onChange,
  onSubmit,
  onCancel,
}) {
  return (
    <div className="rounded-[26px] border border-white/10 bg-neutral-950/80 p-5">
      <div className="flex items-center justify-between gap-3">
        <div>
          <h3 className="text-sm font-semibold text-white">
            {isEditing ? "Edit question" : "Create question"}
          </h3>
          <div className="mt-0.5 text-[11px] text-neutral-500">
            Keep wording short, clear, and answerable fast
          </div>
        </div>

        <span className="rounded-full border border-white/10 bg-white/[0.04] px-3 py-1 text-[10px] uppercase tracking-[0.16em] text-neutral-400">
          Editor
        </span>
      </div>

      <form onSubmit={onSubmit} className="mt-4 space-y-4">
        <div>
          <label className="mb-2 block text-[10px] uppercase tracking-[0.16em] text-neutral-500">
            Question text
          </label>
          <textarea
            value={form.questionText || ""}
            onChange={(e) => onChange?.("questionText", e.target.value)}
            rows={4}
            className="w-full rounded-[18px] border border-white/10 bg-black/20 px-4 py-3 text-sm text-white outline-none focus:border-blue-400/20"
          />
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          <div>
            <label className="mb-2 block text-[10px] uppercase tracking-[0.16em] text-neutral-500">
              Correct answer
            </label>
            <input
              type="text"
              value={form.correctAnswer || ""}
              onChange={(e) => onChange?.("correctAnswer", e.target.value)}
              className="h-[46px] w-full rounded-[16px] border border-white/10 bg-black/20 px-3 text-sm text-white outline-none focus:border-blue-400/20"
            />
          </div>

          <div>
            <label className="mb-2 block text-[10px] uppercase tracking-[0.16em] text-neutral-500">
              Order / weight
            </label>
            <input
              type="number"
              value={form.sortOrder ?? 0}
              onChange={(e) => onChange?.("sortOrder", e.target.value)}
              className="h-[46px] w-full rounded-[16px] border border-white/10 bg-black/20 px-3 text-sm text-white outline-none focus:border-blue-400/20"
            />
          </div>
        </div>

        <div className="flex items-center gap-3">
          <label className="inline-flex items-center gap-2 text-sm text-neutral-300">
            <input
              type="checkbox"
              checked={!!form.isActive}
              onChange={(e) => onChange?.("isActive", e.target.checked)}
              className="h-4 w-4 rounded border-white/20 bg-black/20"
            />
            Active
          </label>
        </div>

        <div className="flex flex-wrap items-center justify-end gap-3">
          {isEditing ? (
            <button
              type="button"
              onClick={onCancel}
              className="rounded-[18px] border border-white/10 bg-white/[0.04] px-4 py-2.5 text-sm font-medium text-white transition-all duration-200 hover:bg-white/[0.07]"
            >
              Cancel
            </button>
          ) : null}

          <button
            type="submit"
            disabled={isSaving}
            className="rounded-[18px] bg-[linear-gradient(180deg,rgba(64,156,255,1)_0%,rgba(10,132,255,1)_100%)] px-4 py-2.5 text-sm font-semibold text-white shadow-[0_12px_28px_rgba(37,99,235,0.28)] transition-all duration-200 hover:-translate-y-[1px] disabled:cursor-not-allowed disabled:opacity-60"
          >
            {isSaving
              ? "Saving..."
              : isEditing
              ? "Save changes"
              : "Create question"}
          </button>
        </div>
      </form>
    </div>
  );
}
export default function QuestionTable({
  questions = [],
  onEdit,
  onToggleActive,
}) {
  return (
    <div className="rounded-[26px] border border-white/10 bg-neutral-950/80 p-5">
      <div className="flex items-center justify-between gap-3">
        <div>
          <h3 className="text-sm font-semibold text-white">Questions</h3>
          <div className="mt-0.5 text-[11px] text-neutral-500">
            Live question bank
          </div>
        </div>

        <span className="rounded-full border border-white/10 bg-white/[0.04] px-3 py-1 text-[10px] uppercase tracking-[0.16em] text-neutral-400">
          {questions.length} total
        </span>
      </div>

      <div className="mt-4 overflow-hidden rounded-[22px] border border-white/6">
        <div className="hidden grid-cols-[1.5fr_1fr_auto_auto] gap-3 border-b border-white/6 bg-white/[0.03] px-4 py-3 text-[10px] uppercase tracking-[0.16em] text-neutral-500 md:grid">
          <div>Question</div>
          <div>Answer</div>
          <div>Status</div>
          <div>Actions</div>
        </div>

        {questions.length === 0 ? (
          <div className="px-4 py-8 text-sm text-neutral-500">
            No questions available yet.
          </div>
        ) : (
          <div className="divide-y divide-white/6">
            {questions.map((question) => (
              <div
                key={question.id}
                className="grid gap-3 px-4 py-4 md:grid-cols-[1.5fr_1fr_auto_auto] md:items-center"
              >
                <div>
                  <div className="text-sm font-medium text-white">
                    {question.questionText}
                  </div>
                  {question.sortOrder != null ? (
                    <div className="mt-1 text-[11px] text-neutral-500">
                      Sort: {question.sortOrder}
                    </div>
                  ) : null}
                </div>

                <div className="text-sm text-neutral-300">
                  {question.correctAnswer}
                </div>

                <div>
                  <span
                    className={`rounded-full px-3 py-1 text-[10px] font-medium uppercase tracking-[0.14em] ${
                      question.isActive
                        ? "bg-emerald-500/15 text-emerald-300"
                        : "bg-white/[0.05] text-neutral-400"
                    }`}
                  >
                    {question.isActive ? "Active" : "Inactive"}
                  </span>
                </div>

                <div className="flex flex-wrap gap-2">
                  <button
                    type="button"
                    onClick={() => onEdit?.(question)}
                    className="rounded-[14px] border border-white/10 bg-white/[0.04] px-3 py-2 text-sm font-medium text-white transition-all duration-200 hover:bg-white/[0.07]"
                  >
                    Edit
                  </button>

                  <button
                    type="button"
                    onClick={() => onToggleActive?.(question)}
                    className={`rounded-[14px] px-3 py-2 text-sm font-medium transition-all duration-200 ${
                      question.isActive
                        ? "border border-amber-500/15 bg-amber-500/10 text-amber-200 hover:bg-amber-500/15"
                        : "border border-emerald-500/15 bg-emerald-500/10 text-emerald-200 hover:bg-emerald-500/15"
                    }`}
                  >
                    {question.isActive ? "Deactivate" : "Activate"}
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
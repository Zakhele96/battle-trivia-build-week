import { useState } from "react";

const inputClass =
  "w-full rounded-xl border border-white/10 bg-black/25 px-3 py-2 text-sm text-white outline-none transition placeholder:text-neutral-600 focus:border-[#f2b077]/40 focus:bg-black/35";

function formatDate(value) {
  if (!value) return "-";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "-";
  return date.toLocaleString(undefined, {
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function getInitials(value) {
  if (!value) return "RP";

  const parts = String(value).trim().split(/\s+/).filter(Boolean);
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();

  return `${parts[0][0] || ""}${parts[1][0] || ""}`.toUpperCase();
}

function IdentityBubble({ label, tone = "default" }) {
  const toneClassName =
    tone === "winner"
      ? "bg-amber-200 text-amber-950"
      : tone === "own"
      ? "bg-blue-200 text-blue-950"
      : "bg-white/10 text-white";

  return (
    <div
      className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-xs font-semibold uppercase tracking-[0.12em] ${toneClassName}`}
    >
      {getInitials(label)}
    </div>
  );
}

export default function ArenaChallengeDetailCard({
  detail,
  currentUserId,
  actionBusy = false,
  actionError = "",
  onSubmitEntry,
  onVote,
  onComment,
}) {
  const [entryText, setEntryText] = useState("");
  const [commentText, setCommentText] = useState("");

  const challenge = detail?.challenge;
  const entries = detail?.entries || [];
  const comments = detail?.comments || [];

  if (!challenge) {
    return (
      <div className="rounded-[24px] border border-dashed border-white/10 bg-white/[0.02] p-6 text-center text-sm text-neutral-500">
        Pick a battle to see the verses, votes, and replies.
      </div>
    );
  }

  const canSubmit =
    challenge.status === "open" &&
    !challenge.userHasSubmitted &&
    challenge.entryCount < challenge.maxEntries;

  const canVote = challenge.status === "voting" && !challenge.userHasVoted;
  const canComment =
    challenge.status !== "open" || challenge.entryCount >= challenge.maxEntries;

  return (
    <div className="overflow-hidden rounded-[24px] border border-white/10 bg-[radial-gradient(circle_at_top_right,rgba(226,109,90,0.12),transparent_34%),linear-gradient(180deg,rgba(255,255,255,0.035),rgba(255,255,255,0.015))]">
      <div className="border-b border-white/6 px-4 py-4 sm:px-5 sm:py-5">
        <div className="flex flex-wrap items-center gap-2">
          <span className="rounded-full border border-[#f2b077]/20 bg-[#f2b077]/10 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.14em] text-[#ffd3a4]">
            RapNometry
          </span>
          <span className="rounded-full border border-blue-400/20 bg-blue-500/10 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.14em] text-blue-200">
            {challenge.status}
          </span>
          <span className="rounded-full border border-white/10 bg-white/[0.04] px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.14em] text-neutral-300">
            {challenge.entryCount}/{challenge.maxEntries} entries
          </span>
        </div>

        <div className="mt-3 text-[22px] font-semibold tracking-[-0.05em] text-white sm:text-2xl">
          {challenge.title}
        </div>
        <div className="mt-2 text-sm text-neutral-300">
          Theme: <span className="font-medium text-white">{challenge.theme}</span>
        </div>
        <div className="mt-2 text-sm leading-6 text-neutral-400">
          {challenge.rules ||
            "No extra rules posted. Keep it sharp, lyrical, and respectful."}
        </div>

        <div className="mt-4 grid gap-2 text-xs text-neutral-400 sm:grid-cols-2">
          <div>By {challenge.createdByDisplayName || challenge.createdByUsername}</div>
          <div>Votes so far: {challenge.voteCount}</div>
          <div>Submit window: {formatDate(challenge.submissionEndsAt)}</div>
          <div>Voting ends: {formatDate(challenge.votingEndsAt)}</div>
        </div>
      </div>

      <div className="px-4 py-4 sm:px-5 sm:py-5">
        {canSubmit ? (
          <div className="rounded-[20px] border border-emerald-400/15 bg-emerald-500/10 p-4">
            <div className="text-[10px] font-semibold uppercase tracking-[0.14em] text-emerald-200/80">
              Submit your piece
            </div>
            <div className="mt-1 text-xs leading-5 text-emerald-100/70">
              Drop your verse like a top comment. Keep it clean, sharp, and easy
              to read.
            </div>
            <textarea
              rows="6"
              value={entryText}
              onChange={(e) => setEntryText(e.target.value)}
              placeholder="Drop your bars, poem, or spoken-word piece here..."
              className={`${inputClass} mt-3`}
            />
            <div className="mt-3 flex justify-end">
              <button
                type="button"
                disabled={actionBusy}
                onClick={() => {
                  onSubmitEntry?.(entryText);
                  setEntryText("");
                }}
                className="rounded-xl bg-white px-4 py-2 text-sm font-semibold text-neutral-950 disabled:opacity-60"
              >
                {actionBusy ? "Submitting..." : "Submit entry"}
              </button>
            </div>
          </div>
        ) : null}

        {actionError ? (
          <div className="mt-4 rounded-xl border border-red-900/40 bg-red-950/30 px-3 py-2 text-sm text-red-300">
            {actionError}
          </div>
        ) : null}

        <div className="mt-5">
          <div className="mb-3 flex items-center justify-between gap-3">
            <div>
              <div className="text-sm font-semibold text-white">Battle entries</div>
              <div className="mt-1 text-xs text-neutral-500">
                Built like a mobile comment thread so the bars are easy to read.
              </div>
            </div>
            <div className="rounded-full border border-white/10 bg-white/[0.04] px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.14em] text-neutral-300">
              {entries.length} drops
            </div>
          </div>

          <div className="space-y-3">
            {entries.map((entry, index) => {
              const isOwn = entry.userId === currentUserId;
              const voteDisabled = actionBusy || !canVote || isOwn;
              const tone = entry.isWinner ? "winner" : isOwn ? "own" : "default";

              return (
                <div
                  key={entry.id}
                  className={`rounded-[22px] border p-3.5 sm:p-4 ${
                    entry.isWinner
                      ? "border-amber-400/25 bg-amber-500/10"
                      : "border-white/8 bg-black/20"
                  }`}
                >
                  <div className="flex items-start gap-3">
                    <IdentityBubble
                      label={entry.displayName || entry.username}
                      tone={tone}
                    />

                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
                        <div className="text-sm font-semibold text-white">
                          {entry.displayName || entry.username}
                        </div>
                        <div className="text-[11px] text-neutral-500">
                          @{entry.username}
                        </div>
                        <div className="text-[11px] text-neutral-500">
                          {formatDate(entry.submittedAt)}
                        </div>
                      </div>

                      <div className="mt-3 whitespace-pre-wrap text-[14px] leading-6 text-neutral-200 sm:text-sm sm:leading-7">
                        {entry.content}
                      </div>

                      <div className="mt-4 flex flex-wrap items-center gap-2">
                        <div className="rounded-full border border-white/10 bg-white/[0.04] px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.12em] text-neutral-300">
                          #{index + 1}
                        </div>
                        <div className="rounded-full border border-white/10 bg-white/[0.04] px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.12em] text-blue-200">
                          {entry.voteCount} votes
                        </div>
                        {entry.isWinner ? (
                          <div className="rounded-full border border-amber-400/20 bg-amber-500/10 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.12em] text-amber-200">
                            Winner
                          </div>
                        ) : null}
                        {challenge.status === "voting" ? (
                          <button
                            type="button"
                            disabled={voteDisabled}
                            onClick={() => onVote?.(entry.id)}
                            className="ml-auto rounded-full border border-white/10 bg-white/[0.05] px-3 py-1.5 text-[11px] font-semibold text-white disabled:opacity-40"
                          >
                            {entry.hasCurrentUserVoted
                              ? "Voted"
                              : isOwn
                              ? "Your entry"
                              : "Vote"}
                          </button>
                        ) : null}
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}

            {entries.length === 0 ? (
              <div className="rounded-[20px] border border-dashed border-white/10 bg-white/[0.02] p-5 text-center text-sm text-neutral-500">
                No entries yet. The first pen sets the tone.
              </div>
            ) : null}
          </div>
        </div>

        <div className="mt-6 rounded-[22px] border border-white/8 bg-[linear-gradient(180deg,rgba(255,255,255,0.03),rgba(255,255,255,0.015))] p-4">
          <div className="flex items-center justify-between gap-3">
            <div>
              <div className="text-sm font-semibold text-white">
                Battle comments
              </div>
              <div className="mt-1 text-xs text-neutral-500">
                Think YouTube replies: quick reactions, praise, takes, and
                debate.
              </div>
            </div>
            <div className="rounded-full border border-white/10 bg-white/[0.04] px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.14em] text-neutral-300">
              {comments.length} comments
            </div>
          </div>

          {canComment ? (
            <div className="mt-4 rounded-[18px] border border-white/8 bg-black/20 p-3">
              <textarea
                rows="3"
                value={commentText}
                onChange={(e) => setCommentText(e.target.value)}
                placeholder="Talk about the bars, the theme, the wordplay..."
                className={inputClass}
              />
              <div className="mt-3 flex justify-end">
                <button
                  type="button"
                  disabled={actionBusy}
                  onClick={() => {
                    onComment?.(commentText);
                    setCommentText("");
                  }}
                  className="rounded-full border border-white/10 bg-white/[0.05] px-4 py-2 text-sm font-semibold text-white disabled:opacity-40"
                >
                  {actionBusy ? "Posting..." : "Post comment"}
                </button>
              </div>
            </div>
          ) : (
            <div className="mt-4 rounded-[18px] border border-dashed border-white/10 bg-white/[0.02] p-4 text-sm text-neutral-500">
              Comments unlock once all entries are in or the battle moves into
              voting.
            </div>
          )}

          <div className="mt-4 space-y-3">
            {comments.map((comment) => {
              const tone = comment.userId === currentUserId ? "own" : "default";

              return (
                <div key={comment.id} className="flex items-start gap-3">
                  <IdentityBubble
                    label={comment.displayName || comment.username}
                    tone={tone}
                  />

                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
                      <div className="text-sm font-semibold text-white">
                        {comment.displayName || comment.username}
                      </div>
                      <div className="text-[11px] text-neutral-500">
                        @{comment.username}
                      </div>
                      <div className="text-[11px] text-neutral-500">
                        {formatDate(comment.createdAt)}
                      </div>
                    </div>
                    <div className="mt-1 whitespace-pre-wrap text-[14px] leading-6 text-neutral-200 sm:text-sm">
                      {comment.content}
                    </div>
                  </div>
                </div>
              );
            })}

            {comments.length === 0 ? (
              <div className="rounded-[18px] border border-dashed border-white/10 bg-white/[0.02] p-4 text-center text-sm text-neutral-500">
                No battle comments yet.
              </div>
            ) : null}
          </div>
        </div>
      </div>
    </div>
  );
}

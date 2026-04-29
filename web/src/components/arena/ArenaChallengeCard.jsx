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

function getStatusTone(status) {
  switch (status) {
    case "open":
      return "border-emerald-400/20 bg-emerald-500/10 text-emerald-200";
    case "voting":
      return "border-amber-400/20 bg-amber-500/10 text-amber-200";
    case "closed":
      return "border-violet-400/20 bg-violet-500/10 text-violet-200";
    default:
      return "border-white/10 bg-white/[0.04] text-neutral-300";
  }
}

function getEntryStatusLabel(challenge) {
  if (!challenge) return "";
  if (challenge.status === "open") {
    return `${challenge.entryCount}/${challenge.maxEntries} entries`;
  }

  if (challenge.status === "voting") {
    return `${challenge.voteCount} votes live`;
  }

  return `${challenge.voteCount} total votes`;
}

export default function ArenaChallengeCard({
  challenge,
  active = false,
  onSelect,
}) {
  if (!challenge) return null;

  return (
    <button
      type="button"
      onClick={() => onSelect?.(challenge)}
      className={`w-full rounded-[22px] border p-4 text-left transition sm:p-4 ${
        active
          ? "border-[#e26d5a]/45 bg-[radial-gradient(circle_at_top_right,rgba(226,109,90,0.14),transparent_42%),linear-gradient(180deg,rgba(255,255,255,0.045),rgba(255,255,255,0.02))] shadow-[0_18px_44px_rgba(226,109,90,0.14)]"
          : "border-white/8 bg-[linear-gradient(180deg,rgba(255,255,255,0.03),rgba(255,255,255,0.016))] hover:border-white/12 hover:bg-[linear-gradient(180deg,rgba(255,255,255,0.045),rgba(255,255,255,0.02))]"
      }`}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <span
              className={`inline-flex rounded-full border px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.14em] ${getStatusTone(
                challenge.status
              )}`}
            >
              {challenge.status}
            </span>
            <span className="inline-flex rounded-full border border-white/10 bg-white/[0.04] px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.14em] text-neutral-300">
              {challenge.challengeType}
            </span>
          </div>

          <div className="mt-3 text-[17px] font-semibold tracking-[-0.03em] text-white sm:text-lg">
            {challenge.title}
          </div>

          <div className="mt-1 text-[13px] text-neutral-300 sm:text-sm">
            Theme: <span className="font-medium text-white">{challenge.theme}</span>
          </div>
        </div>

        <div className="rounded-full border border-white/10 bg-black/20 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.12em] text-neutral-300">
          Tap in
        </div>
      </div>

      <div className="mt-3 text-xs text-neutral-500">
        By {challenge.createdByDisplayName || challenge.createdByUsername}
      </div>

      <div className="mt-4 flex flex-wrap items-center gap-2">
        <div className="rounded-full border border-white/10 bg-white/[0.035] px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.12em] text-neutral-300">
          {getEntryStatusLabel(challenge)}
        </div>
        <div className="rounded-full border border-white/10 bg-white/[0.035] px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.12em] text-neutral-400">
          Submit by {formatDate(challenge.submissionEndsAt)}
        </div>
      </div>

      {challenge.winnerDisplayName ? (
        <div className="mt-3 rounded-xl border border-amber-400/15 bg-amber-500/10 px-3 py-2 text-sm text-amber-100">
          Winner: {challenge.winnerDisplayName}
        </div>
      ) : null}

      <div className="mt-4 flex items-center justify-between">
        <div className="text-[11px] text-neutral-500">
          Voting ends {formatDate(challenge.votingEndsAt)}
        </div>
        <div className="text-[11px] font-semibold uppercase tracking-[0.14em] text-[#f2b077]">
          Open battle
        </div>
      </div>
    </button>
  );
}

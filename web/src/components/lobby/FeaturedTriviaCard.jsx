import { Link } from "react-router-dom";

function formatWindowTime(value) {
  if (!value) return "Later";

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "Later";

  const now = new Date();
  const sameDay = date.toDateString() === now.toDateString();

  return new Intl.DateTimeFormat(
    undefined,
    sameDay
      ? { hour: "2-digit", minute: "2-digit" }
      : { weekday: "short", hour: "2-digit", minute: "2-digit" }
  ).format(date);
}

function InfoPill({ label, value }) {
  return (
    <div className="rounded-[18px] border border-white/10 bg-black/20 px-3.5 py-3 backdrop-blur-sm">
      <div className="text-[10px] uppercase tracking-[0.16em] text-neutral-500">
        {label}
      </div>
      <div className="mt-1.5 text-sm font-semibold text-white sm:text-[15px]">
        {value}
      </div>
    </div>
  );
}

export default function FeaturedTriviaCard({ room }) {
  const status = room?.sessionStatus || null;

  const isLive = !!status?.isLiveNow;
  const hasActiveRound = !!status?.hasActiveRound;
  const runMode = status?.runMode === "scheduled" ? "Scheduled" : "Continuous";

  const statusText = isLive
    ? hasActiveRound
      ? "Questions are running right now"
      : "Live room is open"
    : status?.statusText || "Waiting for next window";

  const nextWindowText = isLive
    ? status?.currentWindowEnd
      ? `Live until ${formatWindowTime(status.currentWindowEnd)}`
      : "Happening now"
    : status?.nextWindowStart
    ? formatWindowTime(status.nextWindowStart)
    : "Later";

  return (
    <div className="relative overflow-hidden rounded-[28px] border border-white/10 bg-[radial-gradient(circle_at_top_left,rgba(59,130,246,0.18),transparent_28%),radial-gradient(circle_at_bottom_right,rgba(168,85,247,0.12),transparent_26%),linear-gradient(135deg,rgba(10,10,11,1)_0%,rgba(17,24,39,0.985)_52%,rgba(10,10,11,1)_100%)] shadow-[0_24px_60px_rgba(0,0,0,0.3)]">
      <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(180deg,rgba(255,255,255,0.04),transparent_18%,transparent_80%,rgba(255,255,255,0.02))]" />
      <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-white/10" />

      <div className="relative p-4 sm:p-6 lg:p-7">
        <div className="flex flex-wrap items-center gap-2">
          <span className="rounded-full border border-blue-400/20 bg-blue-500/10 px-3 py-1 text-[10px] font-medium uppercase tracking-[0.18em] text-blue-200">
            Featured
          </span>

          <span
            className={`rounded-full px-3 py-1 text-[10px] font-medium uppercase tracking-[0.18em] ${
              isLive
                ? "bg-emerald-500/15 text-emerald-300"
                : "bg-amber-500/15 text-amber-300"
            }`}
          >
            {isLive ? "Live now" : "Standby"}
          </span>

          <span className="rounded-full border border-white/10 bg-white/[0.05] px-3 py-1 text-[10px] font-medium uppercase tracking-[0.18em] text-neutral-300">
            {runMode}
          </span>
        </div>

        <div className="mt-5 grid gap-5 lg:grid-cols-[1.3fr_0.9fr] lg:items-end">
          <div className="min-w-0">
            <div className="text-[11px] uppercase tracking-[0.22em] text-blue-300/70">
              Battle Trivia
            </div>

            <h2 className="mt-3 text-[26px] font-semibold tracking-[-0.04em] text-white sm:text-[32px] lg:text-[38px]">
              {room?.name || "Battle Trivia"}
            </h2>

            <p className="mt-3 max-w-[38rem] text-sm leading-7 text-neutral-300 sm:text-[15px]">
              {room?.description ||
                "Jump into the flagship live room, answer fast, climb the leaderboard, and keep your streak alive."}
            </p>

            <div className="mt-5 flex flex-wrap items-center gap-3">
              <Link
                to={`/rooms/${room?.id}`}
                className="inline-flex items-center justify-center rounded-[20px] bg-[linear-gradient(180deg,rgba(64,156,255,1)_0%,rgba(10,132,255,1)_100%)] px-5 py-3 text-sm font-semibold text-white shadow-[0_16px_36px_rgba(37,99,235,0.32)] transition-all duration-300 hover:-translate-y-[1px] hover:shadow-[0_20px_42px_rgba(37,99,235,0.38)]"
              >
                Enter Battle Trivia
              </Link>

              <div className="text-[11px] uppercase tracking-[0.16em] text-neutral-500">
                Fast answers. Weekly bragging rights.
              </div>
            </div>
          </div>

          <div className="grid gap-3 sm:grid-cols-3 lg:grid-cols-1">
            <InfoPill label="Status" value={statusText} />
            <InfoPill label="Next window" value={nextWindowText} />
            <InfoPill label="Experience" value="Live competition room" />
          </div>
        </div>
      </div>
    </div>
  );
}
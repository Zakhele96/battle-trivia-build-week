import { Link } from "react-router-dom";

function getRoomMeta(room) {
  if (room?.slug === "battle-trivia" || room?.roomType === "trivia") {
    return {
      badge: "Featured game",
      accent: "text-blue-300 border-blue-400/20 bg-blue-500/10",
      cta: "Enter trivia",
    };
  }

  if (room?.slug === "word-scramble" || room?.roomType === "game") {
    return {
      badge: "Game room",
      accent: "text-violet-300 border-violet-400/20 bg-violet-500/10",
      cta: "Enter game",
    };
  }

  if (room?.roomType === "chat") {
    return {
      badge: "Community",
      accent: "text-emerald-300 border-emerald-400/20 bg-emerald-500/10",
      cta: "Enter room",
    };
  }

  return {
    badge: "Room",
    accent: "text-neutral-300 border-white/10 bg-white/[0.045]",
    cta: "Enter room",
  };
}

export default function RoomCard({ room }) {
  const isLive = !!room?.isLiveNow;
  const meta = getRoomMeta(room);

  return (
    <div className="group h-full overflow-hidden rounded-[24px] border border-white/10 bg-[linear-gradient(180deg,rgba(255,255,255,0.03),rgba(255,255,255,0.015))] shadow-[0_16px_36px_rgba(0,0,0,0.14)] transition-all duration-300 hover:-translate-y-[2px] hover:border-white/15 hover:bg-[linear-gradient(180deg,rgba(255,255,255,0.04),rgba(255,255,255,0.02))]">
      <div className="pointer-events-none h-px bg-white/10" />

      <div className="flex h-full flex-col p-4 sm:p-5">
        <div className="flex items-start justify-between gap-3">
          <span
            className={`inline-flex rounded-full border px-2.5 py-1 text-[10px] font-medium uppercase tracking-[0.16em] ${meta.accent}`}
          >
            {meta.badge}
          </span>

          <div className="flex items-center gap-2 pt-0.5">
            <span className="text-[10px] uppercase tracking-[0.16em] text-neutral-500">
              {isLive ? "Live" : "Open"}
            </span>
            <span
              className={`h-2.5 w-2.5 shrink-0 rounded-full ${
                isLive
                  ? "bg-emerald-400 shadow-[0_0_10px_rgba(52,211,153,0.55)]"
                  : "bg-neutral-600"
              }`}
            />
          </div>
        </div>

        <div className="mt-4 min-w-0">
          <h3 className="truncate text-[18px] font-semibold tracking-[-0.03em] text-white">
            {room?.name || "Room"}
          </h3>

          <p className="mt-2 min-h-[3rem] text-sm leading-6 text-neutral-400">
            {room?.description || "Join the room and start chatting live."}
          </p>
        </div>

        <div className="mt-5 flex items-center justify-between gap-3 border-t border-white/6 pt-4">
          <div className="text-[11px] uppercase tracking-[0.16em] text-neutral-500">
            {isLive ? "Active now" : "Ready to join"}
          </div>

          <Link
            to={`/rooms/${room?.id}`}
            className="inline-flex items-center gap-2 rounded-[18px] border border-white/10 bg-white/[0.04] px-4 py-2.5 text-sm font-medium text-white transition-all duration-300 hover:border-white/15 hover:bg-white/[0.07]"
          >
            {meta.cta}
            <span aria-hidden="true">→</span>
          </Link>
        </div>
      </div>
    </div>
  );
}
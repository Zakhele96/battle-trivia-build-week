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
    <div className="group h-full overflow-hidden rounded-[20px] border border-white/10 bg-[linear-gradient(180deg,rgba(255,255,255,0.03),rgba(255,255,255,0.015))] shadow-[0_10px_24px_rgba(0,0,0,0.12)] transition-all duration-300 hover:-translate-y-[2px] hover:border-white/15 hover:bg-[linear-gradient(180deg,rgba(255,255,255,0.04),rgba(255,255,255,0.02))] sm:rounded-[24px] sm:shadow-[0_16px_36px_rgba(0,0,0,0.14)]">
      <div className="pointer-events-none h-px bg-white/10" />

      <div className="flex h-full flex-col p-3 sm:p-5">
        <div className="flex items-start justify-between gap-3">
          <span
            className={`inline-flex rounded-full border px-2.5 py-1 text-[9px] font-medium uppercase tracking-[0.16em] sm:text-[10px] ${meta.accent}`}
          >
            {meta.badge}
          </span>

          <div className="flex items-center gap-2 pt-0.5">
            <span className="text-[9px] uppercase tracking-[0.16em] text-neutral-500 sm:text-[10px]">
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

        <div className="mt-3 min-w-0 sm:mt-4">
          <h3 className="truncate text-[15px] font-semibold tracking-[-0.03em] text-white sm:text-[18px]">
            {room?.name || "Room"}
          </h3>

          <p className="mt-1.5 min-h-[2.5rem] text-[13px] leading-5 text-neutral-400 sm:mt-2 sm:min-h-[3rem] sm:text-sm sm:leading-6">
            {room?.description || "Join the room and start chatting live."}
          </p>
        </div>

        <div className="mt-3.5 flex items-center justify-between gap-3 border-t border-white/6 pt-3 sm:mt-5 sm:pt-4">
          <div className="text-[10px] uppercase tracking-[0.16em] text-neutral-500 sm:text-[11px]">
            {isLive ? "Active now" : "Ready"}
          </div>

          <Link
            to={`/rooms/${room?.id}`}
            className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.04] px-3.5 py-2 text-[12px] font-medium text-white transition-all duration-300 hover:border-white/15 hover:bg-white/[0.07] sm:rounded-[18px] sm:px-4 sm:py-2.5 sm:text-sm"
          >
            {meta.cta}
            <span aria-hidden="true">→</span>
          </Link>
        </div>
      </div>
    </div>
  );
}
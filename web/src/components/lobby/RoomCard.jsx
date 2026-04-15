import { Link } from "react-router-dom";

function getRoomBadge(room) {
  if (room?.roomType === "trivia" || room?.slug === "battle-trivia") {
    return "Trivia";
  }

  if (room?.roomType) {
    return room.roomType;
  }

  return "Room";
}

export default function RoomCard({ room }) {
  const isLive = !!room?.isLiveNow;

  return (
    <div className="group h-full overflow-hidden rounded-[24px] border border-white/10 bg-[linear-gradient(180deg,rgba(255,255,255,0.035),rgba(255,255,255,0.018))] shadow-[0_16px_36px_rgba(0,0,0,0.16)] transition-all duration-300 hover:-translate-y-[2px] hover:border-white/15 hover:bg-[linear-gradient(180deg,rgba(255,255,255,0.045),rgba(255,255,255,0.022))]">
      <div className="pointer-events-none h-px bg-white/10" />

      <div className="flex h-full flex-col p-4 sm:p-5">
        <div className="flex items-center justify-between gap-3">
          <span className="inline-flex rounded-full border border-white/10 bg-white/[0.045] px-2.5 py-1 text-[10px] font-medium uppercase tracking-[0.16em] text-neutral-400">
            {getRoomBadge(room)}
          </span>

          <div className="flex items-center gap-2">
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
          <h3 className="truncate text-[17px] font-semibold tracking-[-0.025em] text-white sm:text-[18px]">
            {room?.name || "Room"}
          </h3>

          <p className="mt-2 min-h-[3rem] text-sm leading-6 text-neutral-400">
            {room?.description || "Join the room and start chatting live."}
          </p>
        </div>

        <div className="mt-auto pt-5">
          <Link
            to={`/rooms/${room?.id}`}
            className="inline-flex w-full items-center justify-center rounded-[18px] border border-white/10 bg-white/[0.04] px-4 py-2.5 text-sm font-medium text-white transition-all duration-300 hover:border-white/15 hover:bg-white/[0.07]"
          >
            Enter room
          </Link>
        </div>
      </div>
    </div>
  );
}
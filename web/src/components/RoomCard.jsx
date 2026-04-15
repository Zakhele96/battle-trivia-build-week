import { Link } from "react-router-dom";

export default function RoomCard({ room }) {
  return (
    <div className="rounded-2xl border border-neutral-800 bg-neutral-900 p-5 shadow-lg transition hover:border-blue-500/40 hover:bg-neutral-800">
      <div className="mb-3 flex items-start justify-between gap-3">
        <div>
          <h3 className="text-lg font-semibold text-white">{room.name}</h3>
          <p className="mt-1 text-sm text-neutral-400">
            {room.description || "No description"}
          </p>
        </div>

        <span className="shrink-0 rounded-full bg-blue-500/15 px-3 py-1 text-xs font-medium uppercase tracking-wide text-blue-300">
          {room.roomType}
        </span>
      </div>

      <Link
        to={`/rooms/${room.id}`}
        className="inline-flex rounded-xl bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-500"
      >
        Enter room
      </Link>
    </div>
  );
}
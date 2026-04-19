import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import FeaturedTriviaCard from "../components/lobby/FeaturedTriviaCard";
import RoomCard from "../components/lobby/RoomCard";
import AppTopBar from "../components/layout/AppTopBar";
import AppSectionNav from "../components/layout/AppSectionNav";
import { getRoomSessionStatus, getRooms } from "../api/roomsApi";
import { useMentions } from "../context/MentionContext";

function SectionHeader({ eyebrow, title, description, action }) {
  return (
    <div className="mb-3 flex flex-wrap items-end justify-between gap-2.5 sm:mb-4">
      <div>
        <div className="text-[10px] uppercase tracking-[0.18em] text-neutral-500 sm:text-[11px]">
          {eyebrow}
        </div>
        <div className="mt-1 text-[16px] font-semibold tracking-[-0.03em] text-white sm:text-[19px]">
          {title}
        </div>
        {description ? (
          <div className="mt-1 text-[12px] leading-5 text-neutral-400 sm:mt-1.5 sm:text-[13px]">
            {description}
          </div>
        ) : null}
      </div>

      {action ? action : null}
    </div>
  );
}

function formatMentionCount(count) {
  return `${count} mention${count === 1 ? "" : "s"}`;
}

export default function RoomsPage() {
  const [rawRooms, setRawRooms] = useState([]);
  const [featuredRoomStatus, setFeaturedRoomStatus] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");

  const { syncRoomsFromPayload, mergeRooms } = useMentions();

  useEffect(() => {
    let isMounted = true;

    async function loadRooms() {
      setError("");
      setIsLoading(true);

      try {
        const data = await getRooms();
        if (!isMounted) return;

        const nextRooms = Array.isArray(data) ? data : [];
        setRawRooms(nextRooms);
        syncRoomsFromPayload(nextRooms);

        const battleTriviaRoom =
          nextRooms.find((room) => room.slug === "battle-trivia") ||
          nextRooms.find((room) => room.roomType === "trivia") ||
          null;

        if (battleTriviaRoom) {
          const status = await getRoomSessionStatus(battleTriviaRoom.id).catch(
            () => null
          );

          if (!isMounted) return;
          setFeaturedRoomStatus(status || null);
        } else {
          setFeaturedRoomStatus(null);
        }
      } catch {
        if (!isMounted) return;
        setError("Failed to load game rooms.");
      } finally {
        if (!isMounted) return;
        setIsLoading(false);
      }
    }

    loadRooms();

    return () => {
      isMounted = false;
    };
  }, [syncRoomsFromPayload]);

  const rooms = useMemo(() => mergeRooms(rawRooms), [rawRooms, mergeRooms]);

  const featuredRoom = useMemo(() => {
    const baseRoom =
      rooms.find((room) => room.slug === "battle-trivia") ||
      rooms.find((room) => room.roomType === "trivia") ||
      null;

    if (!baseRoom) return null;

    return {
      ...baseRoom,
      sessionStatus: featuredRoomStatus,
    };
  }, [rooms, featuredRoomStatus]);

  const gameRooms = useMemo(() => {
    return rooms.filter((room) => {
      const isGameLike =
        room.roomType === "game" ||
        room.roomType === "trivia" ||
        room.slug === "word-scramble";

      if (!isGameLike) return false;
      if (featuredRoom && room.id === featuredRoom.id) return false;

      return true;
    });
  }, [rooms, featuredRoom]);

  const sortedGameRooms = useMemo(() => {
    return [...gameRooms].sort((a, b) => {
      const mentionDelta =
        (Number(b?.unreadMentionCount) || 0) -
        (Number(a?.unreadMentionCount) || 0);

      if (mentionDelta !== 0) return mentionDelta;

      return String(a?.name || "").localeCompare(String(b?.name || ""));
    });
  }, [gameRooms]);

  const roomsWithUnreadMentions = useMemo(() => {
    return sortedGameRooms.filter(
      (room) => (Number(room?.unreadMentionCount) || 0) > 0
    );
  }, [sortedGameRooms]);

  const totalUnreadMentions = useMemo(() => {
    return roomsWithUnreadMentions.reduce(
      (sum, room) => sum + (Number(room?.unreadMentionCount) || 0),
      0
    );
  }, [roomsWithUnreadMentions]);

  const priorityRoom = roomsWithUnreadMentions[0] || null;

  return (
    <div className="min-h-screen bg-neutral-950 text-white">
      <div className="mx-auto w-full max-w-[76rem] px-4 py-4 pb-24 sm:px-5 sm:py-7 sm:pb-7 lg:px-6 lg:py-9">
        <AppSectionNav />

        <AppTopBar
          eyebrow="Rooms"
          title="Game rooms"
          description="Competitive spaces and structured sessions live here."
          actions={[]}
        />

        {totalUnreadMentions > 0 ? (
          <div className="mb-5 rounded-[20px] border border-amber-400/18 bg-[radial-gradient(circle_at_top_right,rgba(245,158,11,0.12),transparent_36%),linear-gradient(180deg,rgba(245,158,11,0.1),rgba(245,158,11,0.04))] px-4 py-4 shadow-[0_14px_30px_rgba(0,0,0,0.12)] sm:mb-6 sm:rounded-[22px]">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <div className="text-[10px] uppercase tracking-[0.18em] text-amber-200/80 sm:text-[11px]">
                  Mentions waiting
                </div>
                <div className="mt-1 text-[15px] font-semibold text-white sm:text-[17px]">
                  You have {formatMentionCount(totalUnreadMentions)} across{" "}
                  {roomsWithUnreadMentions.length} room
                  {roomsWithUnreadMentions.length === 1 ? "" : "s"}.
                </div>
                <div className="mt-1.5 text-[12px] leading-5 text-amber-50/80 sm:text-[13px]">
                  Open the highlighted room cards below to clear them.
                </div>
              </div>

              {priorityRoom ? (
                <Link
                  to={`/rooms/${priorityRoom.id}`}
                  className="inline-flex items-center gap-2 rounded-full border border-amber-300/18 bg-amber-300/10 px-3 py-1.5 text-[11px] font-medium text-white transition hover:bg-amber-300/14 sm:px-4 sm:py-2 sm:text-sm"
                >
                  Open latest mention
                  <span aria-hidden="true">→</span>
                </Link>
              ) : null}
            </div>
          </div>
        ) : null}

        {error ? (
          <div className="mb-5 rounded-[20px] border border-red-900/35 bg-red-950/25 px-4 py-3 text-sm text-red-300/90 sm:mb-6 sm:rounded-[22px]">
            {error}
          </div>
        ) : null}

        {isLoading ? (
          <div className="rounded-[22px] border border-white/10 bg-white/[0.03] px-4 py-10 text-center text-sm text-neutral-500 sm:rounded-[24px] sm:py-12">
            Loading game rooms...
          </div>
        ) : (
          <>
            {featuredRoom ? (
              <section className="mb-6 sm:mb-8">
                <SectionHeader
                  eyebrow="Featured"
                  title="Main competition"
                  description="The flagship live room stays pinned here for fast access."
                  action={
                    <Link
                      to={`/rooms/${featuredRoom.id}`}
                      className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.035] px-3 py-1.5 text-[11px] font-medium text-white transition hover:border-white/15 hover:bg-white/[0.05] sm:rounded-[18px] sm:px-4 sm:py-2 sm:text-sm"
                    >
                      Open room
                      <span aria-hidden="true">→</span>
                    </Link>
                  }
                />

                <FeaturedTriviaCard room={featuredRoom} />
              </section>
            ) : null}

            <section>
              <SectionHeader
                eyebrow="Browse"
                title="All game rooms"
                description="Every competitive room in one place."
              />

              {sortedGameRooms.length === 0 ? (
                <div className="rounded-[22px] border border-white/10 bg-white/[0.03] px-4 py-10 text-center text-sm text-neutral-500 sm:rounded-[24px] sm:py-12">
                  No game rooms available yet.
                </div>
              ) : (
                <div className="grid gap-3 sm:grid-cols-2 sm:gap-4 xl:grid-cols-3">
                  {sortedGameRooms.map((room) => (
                    <RoomCard key={room.id} room={room} />
                  ))}
                </div>
              )}
            </section>
          </>
        )}
      </div>
    </div>
  );
}
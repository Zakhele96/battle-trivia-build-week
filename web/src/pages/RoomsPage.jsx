import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import FeaturedTriviaCard from "../components/lobby/FeaturedTriviaCard";
import RoomCard from "../components/lobby/RoomCard";
import AppTopBar from "../components/layout/AppTopBar";
import AppSectionNav from "../components/layout/AppSectionNav";
import { getRoomSessionStatus, getRooms } from "../api/roomsApi";
import { useMentions } from "../context/MentionContext";
import { useTheme } from "../hooks/useTheme";

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

      {action || null}
    </div>
  );
}

function MobileRoomsHero({
  totalUnreadMentions,
  roomCount,
  creativeCount,
  priorityRoom,
}) {
  return (
    <section className="mb-5 sm:hidden">
      <div className="overflow-hidden rounded-[30px] border border-white/10 bg-[radial-gradient(circle_at_top_left,rgba(59,130,246,0.12),transparent_30%),radial-gradient(circle_at_top_right,rgba(251,191,36,0.1),transparent_24%),linear-gradient(180deg,rgba(20,24,34,0.98),rgba(8,10,16,0.98))] p-4 shadow-[0_22px_48px_rgba(0,0,0,0.24)]">
        <div className="flex items-start justify-between gap-3">
          <div>
            <div className="text-[10px] uppercase tracking-[0.18em] text-blue-200/70">
              Competition rooms
            </div>
            <h1 className="mt-2 text-[29px] font-semibold tracking-[-0.05em] text-white">
              Pick a room and jump in live.
            </h1>
            <p className="mt-2 max-w-[22rem] text-[13px] leading-6 text-neutral-400">
              Trivia, word battles, and RapNometry all live here with a tighter mobile layout.
            </p>
          </div>

          <div className="rounded-[18px] border border-white/10 bg-white/[0.04] px-3 py-2 text-right shadow-[0_12px_24px_rgba(0,0,0,0.14)]">
            <div className="text-[10px] uppercase tracking-[0.16em] text-neutral-500">
              Rooms
            </div>
            <div className="mt-1 text-[20px] font-semibold tracking-[-0.04em] text-white">
              {roomCount}
            </div>
          </div>
        </div>

        <div className="mt-4 grid grid-cols-3 gap-2.5">
          <div className="rounded-[20px] border border-white/8 bg-white/[0.03] px-3 py-3">
            <div className="text-[9px] uppercase tracking-[0.16em] text-neutral-500">
              Featured
            </div>
            <div className="mt-1 text-[16px] font-semibold text-white">Trivia</div>
          </div>
          <div className="rounded-[20px] border border-white/8 bg-white/[0.03] px-3 py-3">
            <div className="text-[9px] uppercase tracking-[0.16em] text-neutral-500">
              Arena
            </div>
            <div className="mt-1 text-[16px] font-semibold text-white">{creativeCount}</div>
          </div>
          <div className="rounded-[20px] border border-white/8 bg-white/[0.03] px-3 py-3">
            <div className="text-[9px] uppercase tracking-[0.16em] text-neutral-500">
              Mentions
            </div>
            <div className="mt-1 text-[16px] font-semibold text-white">
              {totalUnreadMentions}
            </div>
          </div>
        </div>

        {priorityRoom ? (
          <Link
            to={`/rooms/${priorityRoom.id}`}
            className="mt-4 inline-flex w-full items-center justify-between rounded-[20px] border border-blue-400/18 bg-blue-500/10 px-4 py-3 text-sm font-medium text-white shadow-[0_14px_28px_rgba(37,99,235,0.14)]"
          >
            <span>Open latest room activity</span>
            <span aria-hidden="true">&rarr;</span>
          </Link>
        ) : null}
      </div>
    </section>
  );
}

function MobileSectionShell({ eyebrow, title, description, children }) {
  return (
    <section className="rounded-[28px] border border-white/10 bg-[linear-gradient(180deg,rgba(18,22,31,0.98),rgba(8,10,16,0.98))] p-4 shadow-[0_18px_40px_rgba(0,0,0,0.2)] sm:rounded-none sm:border-0 sm:bg-transparent sm:p-0 sm:shadow-none">
      <div className="sm:hidden">
        <div className="text-[10px] uppercase tracking-[0.18em] text-blue-200/70">
          {eyebrow}
        </div>
        <h2 className="mt-2 text-[24px] font-semibold tracking-[-0.05em] text-white">
          {title}
        </h2>
        {description ? (
          <p className="mt-1.5 text-[13px] leading-6 text-neutral-400">{description}</p>
        ) : null}
      </div>

      <div className="mt-4 sm:mt-0">{children}</div>
    </section>
  );
}

function formatMentionCount(count) {
  return `${count} mention${count === 1 ? "" : "s"}`;
}

export default function RoomsPage() {
  const { resolvedTheme } = useTheme();
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

  const creativeBattleRooms = useMemo(() => {
    return rooms
      .filter((room) => room.slug === "rapnometry-arena")
      .sort((a, b) => {
        const mentionDelta =
          (Number(b?.unreadMentionCount) || 0) -
          (Number(a?.unreadMentionCount) || 0);

        if (mentionDelta !== 0) return mentionDelta;

        return String(a?.name || "").localeCompare(String(b?.name || ""));
      });
  }, [rooms]);

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
  const isLight = resolvedTheme === "light";
  const lightModeUndoFilter = isLight
    ? {
        filter:
          "invert(1) hue-rotate(180deg) saturate(1.08) contrast(1.08) brightness(0.97)",
      }
    : undefined;

  const totalRoomCount =
    sortedGameRooms.length + creativeBattleRooms.length + (featuredRoom ? 1 : 0);

  return (
    <div
      className={`rooms-page min-h-screen bg-neutral-950 text-white ${
        isLight ? "rooms-page--light" : ""
      }`}
      style={lightModeUndoFilter}
    >
      <div className="mx-auto w-full max-w-[76rem] px-4 py-4 pb-24 sm:px-5 sm:py-7 sm:pb-7 lg:px-6 lg:py-9">
        <AppSectionNav />

        <MobileRoomsHero
          totalUnreadMentions={totalUnreadMentions}
          roomCount={totalRoomCount}
          creativeCount={creativeBattleRooms.length}
          priorityRoom={priorityRoom}
        />

        <div className="hidden sm:block">
          <AppTopBar
            eyebrow="Rooms"
            title="Competition rooms"
            description="Game rooms and battle spaces live here."
            actions={[]}
          />
        </div>

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
                  <span aria-hidden="true">&rarr;</span>
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
                <MobileSectionShell
                  eyebrow="Featured"
                  title="Main competition"
                  description="The flagship live room stays pinned here for fast access."
                >
                  <div className="hidden sm:block">
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
                          <span aria-hidden="true">&rarr;</span>
                        </Link>
                      }
                    />
                  </div>

                  <FeaturedTriviaCard room={featuredRoom} />
                </MobileSectionShell>
              </section>
            ) : null}

            <section>
              <MobileSectionShell
                eyebrow="Browse"
                title="Game rooms"
                description="Trivia and game-based competition rooms."
              >
                <div className="hidden sm:block">
                  <SectionHeader
                    eyebrow="Browse"
                    title="Game rooms"
                    description="Trivia and game-based competition rooms."
                  />
                </div>

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
              </MobileSectionShell>
            </section>

            {creativeBattleRooms.length > 0 ? (
              <section className="mt-6 sm:mt-8">
                <MobileSectionShell
                  eyebrow="Creative"
                  title="Battle arenas"
                  description="Open mic, rap, and poetry challenge rooms."
                >
                  <div className="hidden sm:block">
                    <SectionHeader
                      eyebrow="Creative"
                      title="Battle arenas"
                      description="Open mic, rap, and poetry challenge rooms."
                    />
                  </div>

                  <div className="grid gap-3 sm:grid-cols-2 sm:gap-4 xl:grid-cols-3">
                    {creativeBattleRooms.map((room) => (
                      <RoomCard key={room.id} room={room} />
                    ))}
                  </div>
                </MobileSectionShell>
              </section>
            ) : null}
          </>
        )}
      </div>
    </div>
  );
}

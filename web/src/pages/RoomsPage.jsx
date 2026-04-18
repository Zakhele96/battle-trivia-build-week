import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import FeaturedTriviaCard from "../components/lobby/FeaturedTriviaCard";
import RoomCard from "../components/lobby/RoomCard";
import AppTopBar from "../components/layout/AppTopBar";
import AppSectionNav from "../components/layout/AppSectionNav";
import { getRoomSessionStatus, getRooms } from "../api/roomsApi";

function SectionHeader({ eyebrow, title, description, action }) {
  return (
    <div className="mb-4 flex flex-wrap items-end justify-between gap-3 sm:mb-5">
      <div>
        <div className="text-[10px] uppercase tracking-[0.2em] text-neutral-500 sm:text-[11px]">
          {eyebrow}
        </div>
        <div className="mt-1 text-[17px] font-semibold tracking-[-0.03em] text-white sm:text-xl">
          {title}
        </div>
        {description ? (
          <div className="mt-1.5 text-[13px] text-neutral-400 sm:mt-2 sm:text-sm">
            {description}
          </div>
        ) : null}
      </div>

      {action ? action : null}
    </div>
  );
}

export default function RoomsPage() {
  const [rooms, setRooms] = useState([]);
  const [featuredRoomStatus, setFeaturedRoomStatus] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let isMounted = true;

    async function loadRooms() {
      setError("");
      setIsLoading(true);

      try {
        const data = await getRooms();
        if (!isMounted) return;

        const nextRooms = Array.isArray(data) ? data : [];
        setRooms(nextRooms);

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
  }, []);

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

  return (
    <div className="min-h-screen bg-neutral-950 text-white">
      <div className="mx-auto w-full max-w-[76rem] px-4 py-4 pb-24 sm:px-5 sm:py-7 sm:pb-7 lg:px-6 lg:py-9">
        <AppSectionNav />
        <AppTopBar
          eyebrow="Rooms"
          title="Game rooms"
          description="Competitive spaces and structured game sessions live here. Use the dashboard for a quick start, then browse game rooms here when you want more options."
          actions={[
            {
              to: "/leaderboards?mode=combined&period=current",
              label: "Standings",
              sublabel: "Weekly rankings",
            },
            {
              to: "/profile",
              label: "Profile",
              sublabel: "Your account",
            },
          ]}
        />

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
              <section className="mb-8 sm:mb-10">
                <SectionHeader
                  eyebrow="Featured"
                  title="Main competition"
                  description="The flagship live room stays pinned here for fast access."
                  action={
                    <Link
                      to={`/rooms/${featuredRoom.id}`}
                      className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.035] px-3.5 py-2 text-[12px] font-medium text-white transition hover:border-white/15 hover:bg-white/[0.05] sm:rounded-[18px] sm:px-4 sm:py-2.5 sm:text-sm"
                    >
                      Open featured room
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
                description="Every competitive room in one place, without stretching the dashboard."
              />

              {gameRooms.length === 0 ? (
                <div className="rounded-[22px] border border-white/10 bg-white/[0.03] px-4 py-10 text-center text-sm text-neutral-500 sm:rounded-[24px] sm:py-12">
                  No game rooms available yet.
                </div>
              ) : (
                <div className="grid gap-3 sm:grid-cols-2 sm:gap-4 xl:grid-cols-3">
                  {gameRooms.map((room) => (
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
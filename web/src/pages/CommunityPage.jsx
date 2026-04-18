import { useEffect, useMemo, useState } from "react";
import RoomCard from "../components/lobby/RoomCard";
import AppTopBar from "../components/layout/AppTopBar";
import AppSectionNav from "../components/layout/AppSectionNav";
import { getRooms } from "../api/roomsApi";

function SectionHeader({ eyebrow, title, description }) {
  return (
    <div className="mb-4 sm:mb-5">
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
  );
}

export default function CommunityPage() {
  const [rooms, setRooms] = useState([]);
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
        setRooms(Array.isArray(data) ? data : []);
      } catch {
        if (!isMounted) return;
        setError("Failed to load community spaces.");
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

  const communityRooms = useMemo(() => {
    return rooms.filter(
      (room) =>
        !(
          room.roomType === "game" ||
          room.roomType === "trivia" ||
          room.slug === "word-scramble" ||
          room.slug === "battle-trivia"
        )
    );
  }, [rooms]);

  return (
    <div className="min-h-screen bg-neutral-950 text-white">
      <div className="mx-auto w-full max-w-[76rem] px-4 py-4 pb-24 sm:px-5 sm:py-7 sm:pb-7 lg:px-6 lg:py-9">
        <AppSectionNav />
        <AppTopBar
          eyebrow="Community"
          title="Community spaces"
          description="These are the lighter, social spaces outside competitive play. Use them for general conversation and room-based community activity."
          actions={[
            {
              to: "/rooms",
              label: "Game rooms",
              sublabel: "Competitive spaces",
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
            Loading community spaces...
          </div>
        ) : (
          <section>
            <SectionHeader
              eyebrow="Browse"
              title="All community rooms"
              description="General hangout rooms and non-competitive spaces live here."
            />

            {communityRooms.length === 0 ? (
              <div className="rounded-[22px] border border-white/10 bg-white/[0.03] px-4 py-10 text-center text-sm text-neutral-500 sm:rounded-[24px] sm:py-12">
                No community rooms available yet.
              </div>
            ) : (
              <div className="grid gap-3 sm:grid-cols-2 sm:gap-4 xl:grid-cols-3">
                {communityRooms.map((room) => (
                  <RoomCard key={room.id} room={room} />
                ))}
              </div>
            )}
          </section>
        )}
      </div>
    </div>
  );
}
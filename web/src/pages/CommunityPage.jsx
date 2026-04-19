import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import RoomCard from "../components/lobby/RoomCard";
import AppTopBar from "../components/layout/AppTopBar";
import AppSectionNav from "../components/layout/AppSectionNav";
import MentionInboxCard from "../components/mentions/MentionInboxCard";
import { getRooms, getUnreadMentions } from "../api/roomsApi";
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

// function formatMentionCount(count) {
//   return `${count} mention${count === 1 ? "" : "s"}`;
// }

export default function CommunityPage() {
  const [rawRooms, setRawRooms] = useState([]);
  const [unreadMentions, setUnreadMentions] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");

  const { syncRoomsFromPayload, mergeRooms } = useMentions();

  useEffect(() => {
    let isMounted = true;

    async function loadRooms() {
      setError("");
      setIsLoading(true);

      try {
        const [roomsData, mentionsData] = await Promise.all([
          getRooms(),
          getUnreadMentions(12).catch(() => []),
        ]);

        if (!isMounted) return;

        const nextRooms = Array.isArray(roomsData) ? roomsData : [];
        setRawRooms(nextRooms);
        setUnreadMentions(Array.isArray(mentionsData) ? mentionsData : []);
        syncRoomsFromPayload(nextRooms);
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
  }, [syncRoomsFromPayload]);

  const rooms = useMemo(() => mergeRooms(rawRooms), [rawRooms, mergeRooms]);

  const communityRooms = useMemo(() => {
    return rooms
      .filter(
        (room) =>
          !(
            room.roomType === "game" ||
            room.roomType === "trivia" ||
            room.slug === "word-scramble" ||
            room.slug === "battle-trivia"
          )
      )
      .sort((a, b) => {
        const mentionDelta =
          (Number(b?.unreadMentionCount) || 0) -
          (Number(a?.unreadMentionCount) || 0);

        if (mentionDelta !== 0) return mentionDelta;

        return String(a?.name || "").localeCompare(String(b?.name || ""));
      });
  }, [rooms]);

//  const roomsWithUnreadMentions = useMemo(() => {
  //   return communityRooms.filter(
  //     (room) => (Number(room?.unreadMentionCount) || 0) > 0
  //   );
  // }, [communityRooms]);

  // const totalUnreadMentions = useMemo(() => {
  //   return roomsWithUnreadMentions.reduce(
  //     (sum, room) => sum + (Number(room?.unreadMentionCount) || 0),
  //     0
  //   );
  // }, [roomsWithUnreadMentions]);

  // const priorityRoom = roomsWithUnreadMentions[0] || null;

  return (
    <div className="min-h-screen bg-neutral-950 text-white">
      <div className="mx-auto w-full max-w-[76rem] px-4 py-4 pb-24 sm:px-5 sm:py-7 sm:pb-7 lg:px-6 lg:py-9">
        <AppSectionNav />

        <AppTopBar
          eyebrow="Community"
          title="Community spaces"
          description="Lighter social spaces outside competitive play."
          actions={[]}
        />

        <MentionInboxCard
          title="Unread community mentions"
          description="Open a mention and jump into the exact message even if it is older than the latest chat slice."
          items={unreadMentions}
        />
{/* 
        {totalUnreadMentions > 0 ? (
          <div className="mb-5 rounded-[20px] border border-amber-400/18 bg-[radial-gradient(circle_at_top_right,rgba(245,158,11,0.12),transparent_36%),linear-gradient(180deg,rgba(245,158,11,0.1),rgba(245,158,11,0.04))] px-4 py-4 shadow-[0_14px_30px_rgba(0,0,0,0.12)] sm:mb-6 sm:rounded-[22px]">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <div className="text-[10px] uppercase tracking-[0.18em] text-amber-200/80 sm:text-[11px]">
                  Mentions waiting
                </div>
                <div className="mt-1 text-[15px] font-semibold text-white sm:text-[17px]">
                  You have {formatMentionCount(totalUnreadMentions)} across{" "}
                  {roomsWithUnreadMentions.length} community room
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
        ) : null} */}

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
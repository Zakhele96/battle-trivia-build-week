import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import { getRooms } from "../api/roomsApi";
import { useAuth } from "../hooks/useAuth";
import { scheduleIdleTask } from "../utils/scheduleIdleTask";

const MentionContext = createContext(null);

function normalizeCount(value) {
  const number = Number(value);
  return Number.isFinite(number) && number > 0 ? Math.floor(number) : 0;
}

function extractCountsFromRooms(rooms) {
  const next = {};

  for (const room of Array.isArray(rooms) ? rooms : []) {
    if (!room?.id) continue;
    next[room.id] = normalizeCount(room.unreadMentionCount);
  }

  return next;
}

function mergeRoomsWithCounts(rooms, counts) {
  return (Array.isArray(rooms) ? rooms : []).map((room) => ({
    ...room,
    unreadMentionCount: normalizeCount(counts?.[room.id] ?? room?.unreadMentionCount),
  }));
}

export function MentionProvider({ children }) {
  const { isAuthenticated, isInitializing } = useAuth();
  const [roomMentionCounts, setRoomMentionCounts] = useState({});

  const syncRoomsFromPayload = useCallback((rooms) => {
    setRoomMentionCounts(extractCountsFromRooms(rooms));
  }, []);

  const refreshMentionCounts = useCallback(async () => {
    if (!isAuthenticated) {
      setRoomMentionCounts({});
      return [];
    }

    const data = await getRooms();
    const rooms = Array.isArray(data) ? data : [];
    setRoomMentionCounts(extractCountsFromRooms(rooms));
    return rooms;
  }, [isAuthenticated]);

  const mergeRooms = useCallback(
    (rooms) => mergeRoomsWithCounts(rooms, roomMentionCounts),
    [roomMentionCounts]
  );

  const clearRoomMentions = useCallback((roomId) => {
    if (!roomId) return;

    setRoomMentionCounts((prev) => ({
      ...prev,
      [roomId]: 0,
    }));
  }, []);

  const incrementRoomMentions = useCallback((roomId, amount = 1) => {
    if (!roomId) return;

    setRoomMentionCounts((prev) => ({
      ...prev,
      [roomId]: normalizeCount(prev?.[roomId]) + Math.max(1, normalizeCount(amount) || 1),
    }));
  }, []);

  useEffect(() => {
    if (isInitializing) return;

    if (!isAuthenticated) {
      setRoomMentionCounts({});
      return;
    }

    const pathname = window.location.pathname;
    const needsImmediateRoomData =
      pathname === "/rooms" || pathname === "/community" || pathname.startsWith("/rooms/");

    if (needsImmediateRoomData) {
      refreshMentionCounts().catch(() => {
        // ignore initial mention count sync errors
      });
      return;
    }

    const cancelIdleRefresh = scheduleIdleTask(() => {
      refreshMentionCounts().catch(() => {
        // ignore initial mention count sync errors
      });
    });

    return cancelIdleRefresh;
  }, [isAuthenticated, isInitializing, refreshMentionCounts]);

  const totalUnreadMentions = useMemo(() => {
    return Object.values(roomMentionCounts).reduce(
      (sum, value) => sum + normalizeCount(value),
      0
    );
  }, [roomMentionCounts]);

  const value = useMemo(
    () => ({
      roomMentionCounts,
      totalUnreadMentions,
      syncRoomsFromPayload,
      refreshMentionCounts,
      mergeRooms,
      clearRoomMentions,
      incrementRoomMentions,
    }),
    [
      roomMentionCounts,
      totalUnreadMentions,
      syncRoomsFromPayload,
      refreshMentionCounts,
      mergeRooms,
      clearRoomMentions,
      incrementRoomMentions,
    ]
  );

  return (
    <MentionContext.Provider value={value}>
      {children}
    </MentionContext.Provider>
  );
}

export function useMentions() {
  const context = useContext(MentionContext);

  if (!context) {
    throw new Error("useMentions must be used inside MentionProvider.");
  }

  return context;
}

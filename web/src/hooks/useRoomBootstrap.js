import { useCallback, useEffect, useState } from "react";
import { getOlderRoomMessages, getRoom, getRoomMessages } from "../api/roomsApi";

const PAGE_SIZE = 50;

function normalizeMessages(data) {
  return Array.isArray(data) ? data : [];
}

function extractMessage(payload) {
  if (!payload) return null;
  if (payload.message && typeof payload.message === "object") {
    return payload.message;
  }
  return payload;
}

function mergeMessage(existing, incoming) {
  if (!existing) return incoming;
  if (!incoming) return existing;

  return {
    ...existing,
    ...incoming,
    reactions:
      incoming.reactions !== undefined
        ? incoming.reactions
        : existing.reactions || [],
  };
}

function mergeUniqueById(messages) {
  const map = new Map();

  for (const message of messages) {
    if (!message?.id) continue;
    map.set(message.id, message);
  }

  return Array.from(map.values()).sort((a, b) => {
    const aTime = new Date(a.sentAt).getTime();
    const bTime = new Date(b.sentAt).getTime();

    if (aTime !== bTime) return aTime - bTime;
    return String(a.id).localeCompare(String(b.id));
  });
}

export default function useRoomBootstrap(roomId) {
  const [room, setRoom] = useState(null);
  const [messages, setMessages] = useState([]);
  const [isLoadingRoom, setIsLoadingRoom] = useState(true);
  const [isLoadingOlder, setIsLoadingOlder] = useState(false);
  const [hasOlderMessages, setHasOlderMessages] = useState(true);
  const [bootstrapError, setBootstrapError] = useState("");

  useEffect(() => {
    let isMounted = true;

    async function loadInitial() {
      setBootstrapError("");
      setIsLoadingRoom(true);
      setIsLoadingOlder(false);
      setHasOlderMessages(true);
      setRoom(null);
      setMessages([]);

      try {
        const [roomData, messageData] = await Promise.all([
          getRoom(roomId),
          getRoomMessages(roomId, PAGE_SIZE),
        ]);

        if (!isMounted) return;

        const normalized = normalizeMessages(messageData);

        setRoom(roomData);
        setMessages(normalized);
        setHasOlderMessages(normalized.length >= PAGE_SIZE);
      } catch {
        if (!isMounted) return;
        setBootstrapError("Failed to load room.");
      } finally {
        if (!isMounted) return;
        setIsLoadingRoom(false);
      }
    }

    if (roomId) {
      loadInitial();
    }

    return () => {
      isMounted = false;
    };
  }, [roomId]);

  const loadOlderMessages = useCallback(async () => {
    if (!roomId || isLoadingOlder || !hasOlderMessages || messages.length === 0) {
      return;
    }

    const oldestMessage = messages[0];
    if (!oldestMessage?.id) return;

    setIsLoadingOlder(true);

    try {
      const olderData = await getOlderRoomMessages(
        roomId,
        oldestMessage.id,
        PAGE_SIZE
      );

      const olderMessages = normalizeMessages(olderData);

      setMessages((prev) => mergeUniqueById([...olderMessages, ...prev]));
      setHasOlderMessages(olderMessages.length >= PAGE_SIZE);
    } finally {
      setIsLoadingOlder(false);
    }
  }, [roomId, isLoadingOlder, hasOlderMessages, messages]);

  const replaceMessages = useCallback((nextMessages) => {
    const normalized = normalizeMessages(nextMessages);
    setMessages(normalized);
    setHasOlderMessages(normalized.length >= PAGE_SIZE);
  }, []);

  const appendMessage = useCallback((message) => {
    if (!message?.id) return;

    setMessages((prev) => {
      const exists = prev.some((m) => m.id === message.id);
      if (exists) return prev;
      return mergeUniqueById([...prev, message]);
    });
  }, []);

  const removeMessage = useCallback((messageId) => {
    if (!messageId) return;
    setMessages((prev) => prev.filter((message) => message.id !== messageId));
  }, []);

  const updateMessage = useCallback((payload) => {
    const incoming = extractMessage(payload);
    if (!incoming?.id) return;

    setMessages((prev) => {
      let found = false;

      const next = prev.map((message) => {
        if (message.id !== incoming.id) return message;
        found = true;
        return mergeMessage(message, incoming);
      });

      return found ? next : mergeUniqueById([...next, incoming]);
    });
  }, []);

  const updateMessageReactions = useCallback((payload) => {
    const messageId = payload?.messageId || payload?.id || payload?.message?.id;
    const reactions = payload?.reactions ?? payload?.message?.reactions ?? [];

    if (!messageId) return;

    setMessages((prev) =>
      prev.map((message) =>
        message.id === messageId
          ? {
              ...message,
              reactions,
            }
          : message
      )
    );
  }, []);

  const setPinnedMessage = useCallback((messageOrNull) => {
    const pinnedMessage = extractMessage(messageOrNull);

    setMessages((prev) => {
      if (!pinnedMessage?.id) {
        return prev.map((message) =>
          message.isPinned
            ? {
                ...message,
                isPinned: false,
              }
            : message
        );
      }

      let found = false;

      const next = prev.map((message) => {
        if (message.id === pinnedMessage.id) {
          found = true;
          return {
            ...message,
            ...pinnedMessage,
            isPinned: true,
          };
        }

        if (message.isPinned) {
          return {
            ...message,
            isPinned: false,
          };
        }

        return message;
      });

      if (found) return next;

      return mergeUniqueById([
        ...next.map((message) =>
          message.isPinned
            ? {
                ...message,
                isPinned: false,
              }
            : message
        ),
        {
          ...pinnedMessage,
          isPinned: true,
        },
      ]);
    });
  }, []);

  return {
    room,
    messages,
    isLoadingRoom,
    isLoadingOlder,
    hasOlderMessages,
    bootstrapError,
    setBootstrapError,
    setMessages: replaceMessages,
    appendMessage,
    removeMessage,
    updateMessage,
    updateMessageReactions,
    setPinnedMessage,
    loadOlderMessages,
  };
}
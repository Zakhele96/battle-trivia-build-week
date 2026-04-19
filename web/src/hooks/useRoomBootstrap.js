import { useCallback, useEffect, useState } from "react";
import { getRoom, getRoomMessages } from "../api/roomsApi";

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

export default function useRoomBootstrap(roomId) {
  const [room, setRoom] = useState(null);
  const [messages, setMessages] = useState([]);
  const [isLoadingRoom, setIsLoadingRoom] = useState(true);
  const [bootstrapError, setBootstrapError] = useState("");

  useEffect(() => {
    let isMounted = true;

    async function loadInitial() {
      setBootstrapError("");
      setIsLoadingRoom(true);
      setRoom(null);
      setMessages([]);

      try {
        const [roomData, messageData] = await Promise.all([
          getRoom(roomId),
          getRoomMessages(roomId),
        ]);

        if (!isMounted) return;

        setRoom(roomData);
        setMessages(normalizeMessages(messageData));
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

  const appendMessage = useCallback((message) => {
    if (!message?.id) return;

    setMessages((prev) => {
      const exists = prev.some((m) => m.id === message.id);
      if (exists) return prev;
      return [...prev, message];
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

      return found ? next : [...next, incoming];
    });
  }, []);

  const updateMessageReactions = useCallback((payload) => {
    const messageId = payload?.messageId || payload?.id || payload?.message?.id;
    const reactions =
      payload?.reactions ??
      payload?.message?.reactions ??
      [];

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

      return [
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
      ];
    });
  }, []);

  return {
    room,
    messages,
    isLoadingRoom,
    bootstrapError,
    setBootstrapError,
    setMessages,
    appendMessage,
    removeMessage,
    updateMessage,
    updateMessageReactions,
    setPinnedMessage,
  };
}
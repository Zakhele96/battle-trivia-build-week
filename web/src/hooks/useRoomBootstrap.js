import { useCallback, useEffect, useState } from "react";
import { getRoom, getRoomMessages } from "../api/roomsApi";

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
        setMessages(messageData);
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
    setMessages((prev) => {
      const exists = prev.some((m) => m.id === message.id);
      if (exists) return prev;
      return [...prev, message];
    });
  }, []);

  const removeMessage = useCallback((messageId) => {
  setMessages((prev) => prev.filter((message) => message.id !== messageId));
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
  };
}
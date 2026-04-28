import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import {
  getDirectConversations,
  markDirectConversationRead,
} from "../api/directMessagesApi";
import { createChatConnection } from "../services/chatConnection";
import { useAuth } from "../hooks/useAuth";
import { scheduleIdleTask } from "../utils/scheduleIdleTask";

const DirectMessagesContext = createContext(null);

function sortConversations(items) {
  return [...items].sort(
    (left, right) =>
      new Date(right.lastMessageAt || 0).getTime() -
      new Date(left.lastMessageAt || 0).getTime()
  );
}

export function DirectMessagesProvider({ children }) {
  const { user, isAuthenticated, isInitializing } = useAuth();
  const token = localStorage.getItem("bts_token") || "";
  const [conversations, setConversations] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");
  const [connectionStatus, setConnectionStatus] = useState("idle");
  const [activeConversationId, setActiveConversationId] = useState("");

  const connectionRef = useRef(null);
  const activeConversationIdRef = useRef("");

  const refreshConversations = useCallback(async () => {
    if (!isAuthenticated || !user?.id) {
      setConversations([]);
      setError("");
      setIsLoading(false);
      return [];
    }

    setIsLoading(true);
    setError("");

    try {
      const data = await getDirectConversations();
      const next = Array.isArray(data) ? sortConversations(data) : [];
      setConversations(next);
      return next;
    } catch {
      setError("Failed to load direct messages.");
      return [];
    } finally {
      setIsLoading(false);
    }
  }, [isAuthenticated, user?.id]);

  useEffect(() => {
    if (isInitializing) return;

    if (!isAuthenticated || !user?.id) {
      setConversations([]);
      setError("");
      setIsLoading(false);
      setActiveConversationId("");
      return;
    }

    const isMessagesPage = window.location.pathname === "/messages";

    if (isMessagesPage) {
      refreshConversations().catch(() => null);
      return;
    }

    const cancelIdleRefresh = scheduleIdleTask(() => {
      refreshConversations().catch(() => null);
    });

    return cancelIdleRefresh;
  }, [isAuthenticated, isInitializing, refreshConversations, user?.id]);

  useEffect(() => {
    activeConversationIdRef.current = activeConversationId;
  }, [activeConversationId]);

  useEffect(() => {
    if (!token || !isAuthenticated || !user?.id) {
      setConnectionStatus("idle");
      return;
    }

    let isCancelled = false;
    let connection;
    let startPromise;

    async function startConnection() {
      if (isCancelled) return;

      connection = createChatConnection(token);
      connectionRef.current = connection;
      setConnectionStatus("connecting");

      connection.on("DirectMessageReceived", (payload) => {
        if (isCancelled || !payload?.conversationId) return;

        setConversations((previous) => {
          const existing = previous.find(
            (item) => item.conversationId === payload.conversationId
          );

          if (!existing) {
            refreshConversations().catch(() => null);
            return previous;
          }

          const next = previous.map((item) =>
            item.conversationId === payload.conversationId
              ? {
                  ...item,
                  lastMessageText: payload.messageText,
                  lastMessageAt: payload.sentAt,
                  lastMessageSenderUserId: payload.senderUserId,
                  unreadCount:
                    payload.senderUserId === user?.id ||
                    activeConversationIdRef.current === payload.conversationId
                      ? 0
                      : (item.unreadCount || 0) + 1,
                }
              : item
          );

          return sortConversations(next);
        });
      });

      connection.on("DirectPresenceUpdated", (payload) => {
        if (isCancelled || !payload?.userId) return;

        setConversations((previous) =>
          previous.map((item) =>
            item.otherUserId === payload.userId
              ? {
                  ...item,
                  isOnline: Boolean(payload.isOnline),
                  lastSeenAt: payload.lastSeenAt || item.lastSeenAt,
                }
              : item
          )
        );
      });

      try {
        await connection.start();
        if (isCancelled) return;
        setConnectionStatus("connected");
      } catch {
        if (isCancelled) return;
        setConnectionStatus("error");
      }
    }

    const isMessagesPage = window.location.pathname === "/messages";
    const cancelIdleStart = isMessagesPage
      ? null
      : scheduleIdleTask(() => {
          startPromise = startConnection();
        }, 2000);

    if (isMessagesPage) {
      startPromise = startConnection();
    }

    return () => {
      isCancelled = true;
      cancelIdleStart?.();
      connectionRef.current = null;

      Promise.resolve(startPromise)
        .catch(() => null)
        .finally(async () => {
          try {
            if (connection && connection.state !== "Disconnected") {
              await connection.stop();
            }
          } catch {}
        });
    };
  }, [isAuthenticated, refreshConversations, token, user?.id]);

  useEffect(() => {
    const connection = connectionRef.current;
    if (!connection || connectionStatus !== "connected") return;

    const watchIds = conversations.map((item) => item.otherUserId).filter(Boolean);
    if (watchIds.length === 0) return;

    connection.invoke("WatchPresence", watchIds).catch(() => null);
    return () => {
      connection.invoke("UnwatchPresence", watchIds).catch(() => null);
    };
  }, [conversations, connectionStatus]);

  const markConversationRead = useCallback(async (conversationId) => {
    if (!conversationId) return;

    setConversations((previous) =>
      previous.map((item) =>
        item.conversationId === conversationId
          ? { ...item, unreadCount: 0 }
          : item
      )
    );

    await markDirectConversationRead(conversationId).catch(() => null);
  }, []);

  const upsertConversation = useCallback((conversation) => {
    if (!conversation?.conversationId) return;

    setConversations((previous) => {
      const existingIndex = previous.findIndex(
        (item) => item.conversationId === conversation.conversationId
      );

      if (existingIndex < 0) {
        return sortConversations([conversation, ...previous]);
      }

      const next = [...previous];
      next[existingIndex] = {
        ...next[existingIndex],
        ...conversation,
      };
      return sortConversations(next);
    });
  }, []);

  const unreadCount = useMemo(
    () =>
      conversations.reduce(
        (total, conversation) => total + (Number(conversation.unreadCount) || 0),
        0
      ),
    [conversations]
  );

  const value = useMemo(
    () => ({
      conversations,
      unreadCount,
      isLoading,
      error,
      connectionStatus,
      activeConversationId,
      setActiveConversationId,
      refreshConversations,
      markConversationRead,
      upsertConversation,
    }),
    [
      conversations,
      unreadCount,
      isLoading,
      error,
      connectionStatus,
      activeConversationId,
      refreshConversations,
      markConversationRead,
      upsertConversation,
    ]
  );

  return (
    <DirectMessagesContext.Provider value={value}>
      {children}
    </DirectMessagesContext.Provider>
  );
}

export function useDirectMessages() {
  const context = useContext(DirectMessagesContext);

  if (!context) {
    throw new Error("useDirectMessages must be used inside DirectMessagesProvider.");
  }

  return context;
}

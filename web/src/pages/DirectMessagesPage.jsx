import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useSearchParams } from "react-router-dom";
import AppSectionNav from "../components/layout/AppSectionNav";
import AppTopBar from "../components/layout/AppTopBar";
import ChatStream from "../components/chat/ChatStream";
import { getMyFriendNetwork } from "../api/friendsApi";
import {
  getDirectConversations,
  getDirectMessages,
  getOrCreateDirectConversation,
  markDirectConversationRead,
} from "../api/directMessagesApi";
import { createChatConnection } from "../services/chatConnection";
import { useAuth } from "../hooks/useAuth";
import { useTheme } from "../hooks/useTheme";

function formatPresence(conversation) {
  if (!conversation) return "";
  if (conversation.isOnline) return "Online now";
  if (!conversation.lastSeenAt) return "Offline";

  return `Last seen ${new Intl.DateTimeFormat(undefined, {
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(conversation.lastSeenAt))}`;
}

function ConversationRow({ item, active, onClick }) {
  return (
    <button
      type="button"
      onClick={() => onClick?.(item)}
      className={`w-full rounded-[18px] border p-3 text-left transition ${
        active
          ? "border-blue-300/20 bg-blue-500/10"
          : "border-white/8 bg-white/[0.03] hover:border-white/12 hover:bg-white/[0.05]"
      }`}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="truncate text-sm font-semibold text-white">
            {item.otherDisplayName || item.otherUsername}
          </div>
          <div className="mt-1 text-[11px] text-neutral-500">
            @{item.otherUsername}
          </div>
          <div
            className={`mt-1 text-[11px] ${
              item.isOnline ? "text-emerald-300" : "text-neutral-500"
            }`}
          >
            {formatPresence(item)}
          </div>
        </div>

        {item.unreadCount > 0 ? (
          <div className="rounded-full border border-blue-300/18 bg-blue-400/10 px-2 py-0.5 text-[10px] font-semibold text-blue-100">
            {item.unreadCount}
          </div>
        ) : null}
      </div>

      <div className="mt-3 truncate text-[12px] text-neutral-400">
        {item.lastMessageText || "Start the conversation."}
      </div>
    </button>
  );
}

export default function DirectMessagesPage() {
  const { user } = useAuth();
  const { resolvedTheme } = useTheme();
  const [searchParams, setSearchParams] = useSearchParams();
  const token = localStorage.getItem("bts_token") || "";

  const [friendNetwork, setFriendNetwork] = useState(null);
  const [conversations, setConversations] = useState([]);
  const [messages, setMessages] = useState([]);
  const [messageText, setMessageText] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [isLoadingMessages, setIsLoadingMessages] = useState(false);
  const [error, setError] = useState("");
  const [sendError, setSendError] = useState("");
  const [connectionStatus, setConnectionStatus] = useState("connecting");

  const containerRef = useRef(null);
  const connectionRef = useRef(null);

  const selectedConversationId = searchParams.get("conversationId") || "";

  const selectedConversation = useMemo(
    () =>
      conversations.find(
        (conversation) => conversation.conversationId === selectedConversationId
      ) || null,
    [conversations, selectedConversationId]
  );

  const acceptedFriends = useMemo(
    () => friendNetwork?.friends || [],
    [friendNetwork]
  );

  const refreshConversations = useCallback(async () => {
    const data = await getDirectConversations();
    setConversations(Array.isArray(data) ? data : []);
    return Array.isArray(data) ? data : [];
  }, []);

  const loadMessages = useCallback(
    async (conversationId) => {
      if (!conversationId) {
        setMessages([]);
        return;
      }

      setIsLoadingMessages(true);

      try {
        const rows = await getDirectMessages(conversationId, 80);
        setMessages(Array.isArray(rows) ? rows : []);
        await markDirectConversationRead(conversationId).catch(() => null);
        await refreshConversations();
      } catch {
        setMessages([]);
        setError("Failed to load direct messages.");
      } finally {
        setIsLoadingMessages(false);
      }
    },
    [refreshConversations]
  );

  useEffect(() => {
    let isMounted = true;

    async function load() {
      setIsLoading(true);
      setError("");

      try {
        const [network, nextConversations] = await Promise.all([
          getMyFriendNetwork(),
          refreshConversations(),
        ]);

        if (!isMounted) return;

        setFriendNetwork(network);

        const selectedId =
          selectedConversationId ||
          nextConversations[0]?.conversationId ||
          "";

        if (selectedId) {
          setSearchParams({ conversationId: selectedId });
        }
      } catch {
        if (!isMounted) return;
        setError("Failed to load your inbox.");
      } finally {
        if (!isMounted) return;
        setIsLoading(false);
      }
    }

    load();

    return () => {
      isMounted = false;
    };
  }, [refreshConversations, selectedConversationId, setSearchParams]);

  useEffect(() => {
    loadMessages(selectedConversationId).catch(() => null);
  }, [selectedConversationId, loadMessages]);

  useEffect(() => {
    if (!token) return;

    let isCancelled = false;
    const connection = createChatConnection(token);
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
                  selectedConversationId === payload.conversationId ||
                  payload.senderUserId === user?.id
                    ? 0
                    : (item.unreadCount || 0) + 1,
              }
            : item
        );

        return next.sort(
          (left, right) =>
            new Date(right.lastMessageAt || 0).getTime() -
            new Date(left.lastMessageAt || 0).getTime()
        );
      });

      if (selectedConversationId === payload.conversationId) {
        setMessages((previous) =>
          previous.some((item) => item.id === payload.id)
            ? previous
            : [...previous, payload]
        );
        markDirectConversationRead(payload.conversationId).catch(() => null);
      }
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

    const start = (async () => {
      try {
        await connection.start();
        if (isCancelled) return;
        setConnectionStatus("connected");
      } catch {
        if (isCancelled) return;
        setConnectionStatus("error");
      }
    })();

    return () => {
      isCancelled = true;
      connectionRef.current = null;

      Promise.resolve(start)
        .catch(() => null)
        .finally(async () => {
          try {
            if (connection.state !== "Disconnected") {
              await connection.stop();
            }
          } catch {}
        });
    };
  }, [token, refreshConversations, selectedConversationId, user?.id]);

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

  const handleOpenConversation = async (conversation) => {
    if (!conversation?.conversationId) return;
    setSearchParams({ conversationId: conversation.conversationId });
  };

  const handleStartConversation = async (friend) => {
    try {
      const conversation = await getOrCreateDirectConversation(friend.userId);
      const nextId = conversation?.conversationId;
      const nextConversations = await refreshConversations();
      const selectedId = nextId || nextConversations[0]?.conversationId;
      if (selectedId) {
        setSearchParams({ conversationId: selectedId });
      }
    } catch (err) {
      setError(err?.response?.data?.message || "Could not start chat.");
    }
  };

  const handleSend = async (event) => {
    event.preventDefault();
    setSendError("");

    if (!selectedConversation || !messageText.trim()) return;

    const connection = connectionRef.current;
    if (!connection || connectionStatus !== "connected") {
      setSendError("DM connection is not ready yet.");
      return;
    }

    try {
      const result = await connection.invoke(
        "SendDirectMessage",
        selectedConversation.otherUserId,
        messageText.trim()
      );

      if (result && typeof result === "object" && result.success === false) {
        throw new Error(result.message || "Could not send message.");
      }

      setMessageText("");
    } catch (err) {
      setSendError(err?.message || "Could not send message.");
    }
  };

  const dmMessages = useMemo(
    () =>
      messages.map((message) => ({
        ...message,
        userId: message.senderUserId,
        username: message.senderUsername,
        displayName: message.senderDisplayName,
        messageType: "user",
      })),
    [messages]
  );

  const isLight = resolvedTheme === "light";
  const lightModeUndoFilter = isLight
    ? {
        filter:
          "invert(1) hue-rotate(180deg) saturate(1.08) contrast(1.08) brightness(0.97)",
      }
    : undefined;

  return (
    <div
      className={`messages-page min-h-screen bg-neutral-950 text-white ${
        isLight ? "messages-page--light" : ""
      }`}
      style={lightModeUndoFilter}
    >
      <div className="mx-auto w-full max-w-[76rem] px-4 py-4 pb-24 sm:px-5 sm:py-7 sm:pb-7 lg:px-6 lg:py-9">
        <AppSectionNav />

        <AppTopBar
          eyebrow="Messages"
          title="Direct messages"
          description="Private chats with your friends, with live online and last-seen presence."
          actions={[]}
        />

        {error ? (
          <div className="mb-4 rounded-[20px] border border-red-900/35 bg-red-950/25 px-4 py-3 text-sm text-red-300/90">
            {error}
          </div>
        ) : null}

        <div className="grid gap-4 lg:grid-cols-[21rem_minmax(0,1fr)]">
          <section className="space-y-4">
            <div className="rounded-[24px] border border-white/10 bg-white/[0.03] p-4">
              <div className="mb-3 flex items-center justify-between gap-3">
                <div>
                  <div className="text-sm font-semibold text-white">Inbox</div>
                  <div className="mt-1 text-[12px] text-neutral-400">
                    {connectionStatus === "connected"
                      ? "Live now"
                      : connectionStatus === "connecting"
                      ? "Connecting..."
                      : "Live connection unavailable"}
                  </div>
                </div>
              </div>

              {isLoading ? (
                <div className="text-sm text-neutral-500">Loading conversations...</div>
              ) : conversations.length === 0 ? (
                <div className="text-sm text-neutral-500">
                  No chats yet. Start with a friend below.
                </div>
              ) : (
                <div className="space-y-2.5">
                  {conversations.map((conversation) => (
                    <ConversationRow
                      key={conversation.conversationId}
                      item={conversation}
                      active={conversation.conversationId === selectedConversationId}
                      onClick={handleOpenConversation}
                    />
                  ))}
                </div>
              )}
            </div>

            <div className="rounded-[24px] border border-white/10 bg-white/[0.03] p-4">
              <div className="mb-3 text-sm font-semibold text-white">Start a chat</div>
              <div className="space-y-2.5">
                {acceptedFriends.length === 0 ? (
                  <div className="text-sm text-neutral-500">
                    Add friends first, then they can show up here for DMs.
                  </div>
                ) : (
                  acceptedFriends.map((friend) => (
                    <button
                      key={friend.userId}
                      type="button"
                      onClick={() => handleStartConversation(friend)}
                      className="flex w-full items-center justify-between rounded-[16px] border border-white/8 bg-black/20 px-3 py-2.5 text-left transition hover:border-white/12 hover:bg-white/[0.05]"
                    >
                      <div>
                        <div className="text-sm font-medium text-white">
                          {friend.displayName || friend.username}
                        </div>
                        <div className="mt-1 text-[11px] text-neutral-500">
                          @{friend.username}
                        </div>
                      </div>
                      <span className="rounded-full border border-blue-300/18 bg-blue-400/10 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.14em] text-blue-100">
                        Message
                      </span>
                    </button>
                  ))
                )}
              </div>
            </div>
          </section>

          <section className="flex min-h-[38rem] flex-col overflow-hidden rounded-[28px] border border-white/10 bg-[linear-gradient(180deg,rgba(255,255,255,0.03),rgba(255,255,255,0.012))]">
            <div className="border-b border-white/8 px-4 py-4 sm:px-5">
              {selectedConversation ? (
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <div className="text-[18px] font-semibold tracking-[-0.03em] text-white">
                      {selectedConversation.otherDisplayName ||
                        selectedConversation.otherUsername}
                    </div>
                    <div
                      className={`mt-1 text-[12px] ${
                        selectedConversation.isOnline
                          ? "text-emerald-300"
                          : "text-neutral-400"
                      }`}
                    >
                      {formatPresence(selectedConversation)}
                    </div>
                  </div>
                </div>
              ) : (
                <div className="text-sm text-neutral-500">
                  Pick a conversation to start chatting.
                </div>
              )}
            </div>

            <div className="min-h-0 flex-1">
              <ChatStream
                messages={dmMessages}
                currentUserId={user?.id}
                currentUsername={user?.username}
                error=""
                isLoading={isLoadingMessages}
                containerRef={containerRef}
                variant="default"
                bottomAlign
                compact
              />
            </div>

            <form
              onSubmit={handleSend}
              className="border-t border-white/8 px-4 py-3 sm:px-5"
            >
              {sendError ? (
                <div className="mb-2 text-[12px] text-red-300/90">{sendError}</div>
              ) : null}

              <div className="flex gap-2">
                <input
                  value={messageText}
                  onChange={(event) => setMessageText(event.target.value)}
                  disabled={!selectedConversation}
                  placeholder={
                    selectedConversation
                      ? "Type a private message..."
                      : "Pick a conversation first"
                  }
                  className="flex-1 rounded-[16px] border border-white/10 bg-white/[0.03] px-4 py-3 text-sm text-white outline-none focus:border-blue-400/20 disabled:cursor-not-allowed disabled:opacity-60"
                />
                <button
                  type="submit"
                  disabled={!selectedConversation || !messageText.trim()}
                  className="rounded-[16px] bg-blue-600 px-4 py-3 text-sm font-semibold text-white transition hover:bg-blue-500 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  Send
                </button>
              </div>
            </form>
          </section>
        </div>
      </div>
    </div>
  );
}

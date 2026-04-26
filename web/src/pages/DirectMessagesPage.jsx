import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useSearchParams } from "react-router-dom";
import AppSectionNav from "../components/layout/AppSectionNav";
import AppTopBar from "../components/layout/AppTopBar";
import ChatStream from "../components/chat/ChatStream";
import { getMyFriendNetwork } from "../api/friendsApi";
import {
  getDirectMessages,
  getOrCreateDirectConversation,
} from "../api/directMessagesApi";
import { createChatConnection } from "../services/chatConnection";
import { useDirectMessages } from "../context/DirectMessagesContext";
import { useAuth } from "../hooks/useAuth";
import { useTheme } from "../hooks/useTheme";

function applyOptimisticReaction(messages, messageId, emoji) {
  return messages.map((message) => {
    if (message.id !== messageId) return message;

    const existingReactions = Array.isArray(message.reactions) ? message.reactions : [];
    const targetReaction = existingReactions.find((reaction) => reaction.emoji === emoji);

    let nextReactions;

    if (targetReaction?.reactedByMe) {
      nextReactions = existingReactions
        .map((reaction) =>
          reaction.emoji === emoji
            ? {
                ...reaction,
                count: Math.max(0, Number(reaction.count || 0) - 1),
                reactedByMe: false,
              }
            : reaction
        )
        .filter((reaction) => Number(reaction.count || 0) > 0);
    } else if (targetReaction) {
      nextReactions = existingReactions.map((reaction) =>
        reaction.emoji === emoji
          ? {
              ...reaction,
              count: Number(reaction.count || 0) + 1,
              reactedByMe: true,
            }
          : reaction
      );
    } else {
      nextReactions = [
        ...existingReactions,
        {
          emoji,
          count: 1,
          reactedByMe: true,
        },
      ];
    }

    return {
      ...message,
      reactions: nextReactions,
    };
  });
}

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

function formatMessageTime(value) {
  if (!value) return "";

  return new Intl.DateTimeFormat(undefined, {
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(value));
}

function ConversationRow({ item, active, onClick }) {
  const isSentByMe =
    item.lastMessageSenderUserId && item.lastMessageSenderUserId !== item.otherUserId;

  return (
    <button
      type="button"
      onClick={() => onClick?.(item)}
      className={`w-full rounded-[18px] border px-3 py-3 text-left transition ${
        active
          ? "border-blue-300/22 bg-blue-500/10 shadow-[0_14px_28px_rgba(37,99,235,0.12)]"
          : "border-white/8 bg-white/[0.03] hover:border-white/12 hover:bg-white/[0.05]"
      }`}
    >
      <div className="flex items-start gap-3">
        <div className="relative mt-0.5 flex h-11 w-11 shrink-0 items-center justify-center rounded-full border border-white/10 bg-[radial-gradient(circle_at_top_left,rgba(59,130,246,0.2),transparent_38%),linear-gradient(180deg,rgba(255,255,255,0.08),rgba(255,255,255,0.03))] text-sm font-semibold text-white">
          {(item.otherDisplayName || item.otherUsername || "U").charAt(0).toUpperCase()}
          <span
            className={`absolute -bottom-0.5 -right-0.5 h-3.5 w-3.5 rounded-full border-2 border-neutral-950 ${
              item.isOnline ? "bg-emerald-400" : "bg-neutral-600"
            }`}
          />
        </div>

        <div className="min-w-0 flex-1">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <div className="truncate text-sm font-semibold text-white">
                {item.otherDisplayName || item.otherUsername}
              </div>
              <div
                className={`mt-1 text-[11px] ${
                  item.isOnline ? "text-emerald-300" : "text-neutral-500"
                }`}
              >
                {formatPresence(item)}
              </div>
            </div>

            <div className="shrink-0 text-right">
              <div className="text-[10px] text-neutral-500">
                {formatMessageTime(item.lastMessageAt)}
              </div>
              {item.unreadCount > 0 ? (
                <div className="mt-1 inline-flex rounded-full border border-blue-300/18 bg-blue-400/10 px-2 py-0.5 text-[10px] font-semibold text-blue-100">
                  {item.unreadCount}
                </div>
              ) : null}
            </div>
          </div>

          <div className="mt-2 truncate text-[12px] text-neutral-400">
            {item.lastMessageText
              ? `${isSentByMe ? "You: " : ""}${item.lastMessageText}`
              : "Start the conversation."}
          </div>
        </div>
      </div>
    </button>
  );
}

function FriendStarterRow({ friend, onStart }) {
  const preview = friend.conversation?.lastMessageText || "Tap to open chat";
  const lastSeen = friend.conversation?.lastMessageAt
    ? formatMessageTime(friend.conversation.lastMessageAt)
    : "";

  return (
    <button
      type="button"
      onClick={() => onStart?.(friend)}
      className="flex w-full min-w-0 items-center gap-3 overflow-hidden rounded-[18px] border border-white/8 bg-black/20 px-3 py-3 text-left transition hover:border-white/12 hover:bg-white/[0.05]"
    >
      <div className="relative flex h-11 w-11 shrink-0 items-center justify-center rounded-full border border-white/10 bg-[radial-gradient(circle_at_top_left,rgba(59,130,246,0.2),transparent_38%),linear-gradient(180deg,rgba(255,255,255,0.08),rgba(255,255,255,0.03))] text-sm font-semibold text-white">
        {(friend.displayName || friend.username || "U").charAt(0).toUpperCase()}
        <span
          className={`absolute -bottom-0.5 -right-0.5 h-3.5 w-3.5 rounded-full border-2 border-neutral-950 ${
            friend.conversation?.isOnline ? "bg-emerald-400" : "bg-neutral-600"
          }`}
        />
      </div>

      <div className="min-w-0 flex-1 overflow-hidden">
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0 flex-1 overflow-hidden">
            <div className="flex min-w-0 items-center gap-2">
              <div className="truncate text-sm font-medium text-white">
                {friend.displayName || friend.username}
              </div>
              {friend.conversation?.unreadCount > 0 ? (
                <div className="inline-flex shrink-0 rounded-full border border-blue-300/18 bg-blue-400/10 px-2 py-0.5 text-[10px] font-semibold text-blue-100">
                  {friend.conversation.unreadCount}
                </div>
              ) : null}
            </div>
            <div className="mt-1 truncate text-[11px] text-neutral-500">
              @{friend.username}
            </div>
          </div>

          <div className="hidden shrink-0 text-right sm:block">
            {lastSeen ? (
              <div className="max-w-full truncate text-[10px] text-neutral-500">
                {lastSeen}
              </div>
            ) : null}
          </div>
        </div>

        <div className="mt-2 block max-w-[11rem] min-w-0 truncate text-[12px] text-neutral-400 sm:max-w-none">
          {preview}
        </div>
      </div>
    </button>
  );
}

function ReplyingToBar({ message, onCancel }) {
  if (!message) return null;

  return (
    <div className="mb-2 rounded-[16px] border border-blue-300/18 bg-blue-500/10 px-3 py-2.5">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="text-[10px] font-semibold uppercase tracking-[0.14em] text-blue-100/75">
            Replying to {message.displayName || message.username || "message"}
          </div>
          <div className="mt-1 truncate text-[12px] text-blue-50/90">
            {message.messageText}
          </div>
        </div>

        <button
          type="button"
          onClick={onCancel}
          className="shrink-0 rounded-full border border-white/12 bg-white/[0.05] px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.14em] text-white transition hover:bg-white/[0.08]"
        >
          Clear
        </button>
      </div>
    </div>
  );
}

export default function DirectMessagesPage() {
  const { user } = useAuth();
  const {
    conversations,
    isLoading: isLoadingConversations,
    error: conversationsError,
    connectionStatus,
    refreshConversations,
    markConversationRead,
    setActiveConversationId,
    upsertConversation,
  } = useDirectMessages();
  const { resolvedTheme } = useTheme();
  const [searchParams, setSearchParams] = useSearchParams();
  const token = localStorage.getItem("bts_token") || "";

  const [friendNetwork, setFriendNetwork] = useState(null);
  const [messages, setMessages] = useState([]);
  const [messageText, setMessageText] = useState("");
  const [replyingToMessage, setReplyingToMessage] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isLoadingMessages, setIsLoadingMessages] = useState(false);
  const [error, setError] = useState("");
  const [sendError, setSendError] = useState("");
  const [friendSearch, setFriendSearch] = useState("");

  const containerRef = useRef(null);
  const connectionRef = useRef(null);
  const joinedConversationIdRef = useRef("");

  const scrollToLatestMessage = useCallback((behavior = "auto") => {
    const node = containerRef.current;
    if (!node) return;

    const scrollToBottom = () => {
      node.scrollTop = node.scrollHeight;
      node.scrollTo({
        top: node.scrollHeight,
        behavior,
      });
    };

    requestAnimationFrame(() => {
      scrollToBottom();
      requestAnimationFrame(scrollToBottom);
    });
  }, []);

  const selectedConversationId = searchParams.get("conversationId") || "";

  const selectedConversation = useMemo(
    () =>
      conversations.find(
        (conversation) => conversation.conversationId === selectedConversationId
      ) || null,
    [conversations, selectedConversationId]
  );

  const acceptedFriends = useMemo(() => friendNetwork?.friends || [], [friendNetwork]);

  const conversationsByUserId = useMemo(
    () =>
      new Map(
        conversations
          .filter((item) => item?.otherUserId)
          .map((item) => [item.otherUserId, item])
      ),
    [conversations]
  );

  const filteredFriends = useMemo(() => {
    const query = friendSearch.trim().toLowerCase();
    const rankedFriends = [...acceptedFriends]
      .map((friend) => ({
        ...friend,
        conversation: conversationsByUserId.get(friend.userId) || null,
      }))
      .sort((left, right) => {
        const rightTime = new Date(
          right.conversation?.lastMessageAt || 0
        ).getTime();
        const leftTime = new Date(left.conversation?.lastMessageAt || 0).getTime();

        if (rightTime !== leftTime) return rightTime - leftTime;

        const leftLabel = (left.displayName || left.username || "").toLowerCase();
        const rightLabel = (right.displayName || right.username || "").toLowerCase();
        return leftLabel.localeCompare(rightLabel);
      });

    if (!query) return rankedFriends;

    return rankedFriends.filter((friend) => {
      const name = `${friend.displayName || ""} ${friend.username || ""}`.toLowerCase();
      return name.includes(query);
    });
  }, [acceptedFriends, conversationsByUserId, friendSearch]);

  const loadMessages = useCallback(
    async (conversationId) => {
      if (!conversationId) {
        setMessages([]);
        setReplyingToMessage(null);
        return;
      }

      setIsLoadingMessages(true);

      try {
        const rows = await getDirectMessages(conversationId, 80);
        setMessages(Array.isArray(rows) ? rows : []);
        setReplyingToMessage(null);
        await markConversationRead(conversationId);
      } catch {
        setMessages([]);
        setError("Failed to load direct messages.");
      } finally {
        setIsLoadingMessages(false);
      }
    },
    [markConversationRead]
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
    setActiveConversationId(selectedConversationId);
    return () => {
      setActiveConversationId("");
    };
  }, [selectedConversationId, setActiveConversationId]);

  useEffect(() => {
    if (!token) return;

    let isCancelled = false;
    const connection = createChatConnection(token);
    connectionRef.current = connection;

    connection.on("DirectMessageReceived", (payload) => {
      if (isCancelled || !payload?.conversationId) return;

      if (selectedConversationId === payload.conversationId) {
        setMessages((previous) =>
          previous.some((item) => item.id === payload.id)
            ? previous
            : [...previous, payload]
        );
        markConversationRead(payload.conversationId).catch(() => null);
      } else {
        refreshConversations().catch(() => null);
      }
    });

    connection.on("DirectMessageReactionUpdated", (payload) => {
      if (isCancelled || !payload?.messageId) return;

      setMessages((previous) =>
        previous.map((item) =>
          item.id === payload.messageId
            ? {
                ...item,
                reactions: Array.isArray(payload.reactions) ? payload.reactions : [],
              }
            : item
        )
      );
    });

    const start = (async () => {
      try {
        await connection.start();
      } catch {
        if (!isCancelled) {
          setSendError("Live DM connection is unavailable right now.");
        }
      }
    })();

    return () => {
      isCancelled = true;
      connectionRef.current = null;

      Promise.resolve(start)
        .catch(() => null)
        .finally(async () => {
          try {
            if (joinedConversationIdRef.current && connection.state === "Connected") {
              await connection.invoke(
                "LeaveDirectConversation",
                joinedConversationIdRef.current
              );
            }
          } catch {}

          try {
            if (connection.state !== "Disconnected") {
              await connection.stop();
            }
          } catch {}
        });
    };
  }, [token, selectedConversationId, refreshConversations, markConversationRead]);

  useEffect(() => {
    const connection = connectionRef.current;
    if (!connection || connectionStatus !== "connected") return;

    const previousId = joinedConversationIdRef.current;
    const nextId = selectedConversationId;

    (async () => {
      try {
        if (previousId && previousId !== nextId) {
          await connection.invoke("LeaveDirectConversation", previousId);
        }

        if (nextId) {
          await connection.invoke("JoinDirectConversation", nextId);
          joinedConversationIdRef.current = nextId;
        } else {
          joinedConversationIdRef.current = "";
        }
      } catch {}
    })();
  }, [selectedConversationId, connectionStatus]);

  const handleOpenConversation = (conversation) => {
    if (!conversation?.conversationId) return;
    setSearchParams({ conversationId: conversation.conversationId });
  };

  const handleBackToInbox = () => {
    setSearchParams({});
  };

  const handleStartConversation = async (friend) => {
    try {
      const conversation = await getOrCreateDirectConversation(friend.userId);
      upsertConversation(conversation);
      const selectedId = conversation?.conversationId;
      if (selectedId) {
        setSearchParams({ conversationId: selectedId });
      }
      refreshConversations().catch(() => null);
    } catch (err) {
      setError(err?.response?.data?.message || "Could not start chat.");
    }
  };

  const handleReplyMessage = useCallback((message) => {
    setReplyingToMessage(message || null);
  }, []);

  const handleToggleReaction = useCallback(
    async (messageId, emoji) => {
      const connection = connectionRef.current;
      if (!connection || connectionStatus !== "connected" || !selectedConversationId) {
        throw new Error("DM connection is not ready yet.");
      }

      setMessages((previous) => applyOptimisticReaction(previous, messageId, emoji));

      try {
        await connection.invoke(
          "ToggleDirectMessageReaction",
          selectedConversationId,
          messageId,
          emoji
        );
      } catch (error) {
        loadMessages(selectedConversationId).catch(() => null);
        throw error;
      }
    },
    [connectionStatus, loadMessages, selectedConversationId]
  );

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
        messageText.trim(),
        replyingToMessage?.id || null
      );

      if (result && typeof result === "object" && result.success === false) {
        throw new Error(result.message || "Could not send message.");
      }

      setMessageText("");
      setReplyingToMessage(null);
      scrollToLatestMessage();
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
  const topLevelError = error || conversationsError;
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

        <div className={selectedConversation ? "hidden sm:block" : ""}>
          <AppTopBar
            eyebrow="Messages"
            title="Direct messages"
            description="Friends first on mobile, then a full chat view once you tap in."
            actions={[]}
          />
        </div>

        {topLevelError ? (
          <div className="mb-4 rounded-[20px] border border-red-900/35 bg-red-950/25 px-4 py-3 text-sm text-red-300/90">
            {topLevelError}
          </div>
        ) : null}

        <div className="grid min-h-0 gap-4 lg:grid-cols-[22rem_minmax(0,1fr)]">
          <section className={`space-y-4 lg:hidden ${selectedConversation ? "hidden" : ""}`}>
            <div className="rounded-[26px] border border-white/10 bg-white/[0.03] p-4">
              <div className="mb-3 flex items-center justify-between gap-3">
                <div>
                  <div className="text-sm font-semibold text-white">Friends</div>
                  <div className="mt-1 text-[12px] text-neutral-400">
                    Tap a friend and the chat opens full screen.
                  </div>
                </div>
                <div className="rounded-full border border-white/10 bg-white/[0.04] px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.14em] text-neutral-300">
                  {filteredFriends.length}
                </div>
              </div>

              <input
                value={friendSearch}
                onChange={(event) => setFriendSearch(event.target.value)}
                placeholder="Search your friends"
                className="mb-3 w-full rounded-[16px] border border-white/10 bg-black/20 px-4 py-3 text-sm text-white outline-none focus:border-blue-400/20"
              />

              <div className="space-y-2.5">
                {isLoading || isLoadingConversations ? (
                  <div className="text-sm text-neutral-500">Loading chats...</div>
                ) : filteredFriends.length === 0 ? (
                  <div className="text-sm text-neutral-500">
                    {acceptedFriends.length === 0
                      ? "Add friends first, then your private chats start here."
                      : "No friends match that search yet."}
                  </div>
                ) : (
                  filteredFriends.map((friend) => (
                    <FriendStarterRow
                      key={friend.userId}
                      friend={friend}
                      onStart={handleStartConversation}
                    />
                  ))
                )}
              </div>
            </div>
          </section>

          <section className="hidden space-y-4 lg:block">
            <div className="rounded-[26px] border border-white/10 bg-[radial-gradient(circle_at_top_left,rgba(59,130,246,0.08),transparent_28%),linear-gradient(180deg,rgba(255,255,255,0.03),rgba(255,255,255,0.012))] p-4">
              <div className="mb-3 flex items-center justify-between gap-3">
                <div>
                  <div className="text-sm font-semibold text-white">Inbox</div>
                  <div className="mt-1 text-[12px] text-neutral-400">
                    {connectionStatus === "connected"
                      ? "Live and synced"
                      : connectionStatus === "connecting"
                      ? "Connecting..."
                      : "Live connection unavailable"}
                  </div>
                </div>
                <div className="rounded-full border border-white/10 bg-white/[0.04] px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.14em] text-neutral-300">
                  {conversations.length}
                </div>
              </div>

              {isLoading || isLoadingConversations ? (
                <div className="text-sm text-neutral-500">Loading conversations...</div>
              ) : conversations.length === 0 ? (
                <div className="rounded-[18px] border border-white/8 bg-black/20 px-4 py-5 text-sm text-neutral-500">
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

            <div className="rounded-[26px] border border-white/10 bg-white/[0.03] p-4">
              <div className="mb-3 flex items-center justify-between gap-3">
                <div className="text-sm font-semibold text-white">Select a user and send a message</div>
                <div className="text-[11px] text-neutral-500">Friends only</div>
              </div>

              <input
                value={friendSearch}
                onChange={(event) => setFriendSearch(event.target.value)}
                placeholder="Search your friends"
                className="mb-3 w-full rounded-[16px] border border-white/10 bg-black/20 px-4 py-3 text-sm text-white outline-none focus:border-blue-400/20"
              />

              <div className="space-y-2.5">
                {filteredFriends.length === 0 ? (
                  <div className="text-sm text-neutral-500">
                    {acceptedFriends.length === 0
                      ? "Add friends first, then they can show up here for DMs."
                      : "No friends match that search yet."}
                  </div>
                ) : (
                  filteredFriends.map((friend) => (
                    <FriendStarterRow
                      key={friend.userId}
                      friend={friend}
                      onStart={handleStartConversation}
                    />
                  ))
                )}
              </div>
            </div>
          </section>

          <section
            className={`min-h-0 overflow-hidden border border-white/10 bg-[radial-gradient(circle_at_top_right,rgba(59,130,246,0.08),transparent_24%),linear-gradient(180deg,rgba(255,255,255,0.03),rgba(255,255,255,0.012))] ${
              !selectedConversation ? "hidden lg:flex" : "flex"
            } ${
              selectedConversation
                ? "fixed inset-x-0 top-0 bottom-0 z-40 rounded-none border-x-0 border-t-0 pb-[var(--bts-mobile-nav-height,5.5rem)] pt-[env(safe-area-inset-top)] sm:inset-auto sm:relative sm:h-[calc(100vh-8.5rem)] sm:rounded-[26px] sm:border sm:pt-0"
                : "h-[42rem] rounded-[30px]"
            } lg:relative lg:inset-auto lg:h-[42rem] lg:rounded-[30px] lg:border lg:px-0 lg:pb-0 lg:pt-0 flex-col`}
          >
            <div className="shrink-0 border-b border-white/8 px-4 py-4 sm:px-5">
              {selectedConversation ? (
                <div className="flex items-center gap-3">
                  <button
                    type="button"
                    onClick={handleBackToInbox}
                    className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-white/10 bg-white/[0.04] text-sm text-white transition hover:bg-white/[0.08] lg:hidden"
                  >
                    <span aria-hidden="true">&larr;</span>
                  </button>

                  <div className="relative flex h-12 w-12 shrink-0 items-center justify-center rounded-full border border-white/10 bg-[radial-gradient(circle_at_top_left,rgba(59,130,246,0.2),transparent_38%),linear-gradient(180deg,rgba(255,255,255,0.08),rgba(255,255,255,0.03))] text-base font-semibold text-white">
                    {(selectedConversation.otherDisplayName ||
                      selectedConversation.otherUsername ||
                      "U").charAt(0).toUpperCase()}
                    <span
                      className={`absolute -bottom-0.5 -right-0.5 h-4 w-4 rounded-full border-2 border-neutral-950 ${
                        selectedConversation.isOnline ? "bg-emerald-400" : "bg-neutral-600"
                      }`}
                    />
                  </div>

                  <div className="min-w-0 flex-1">
                    <div className="truncate text-[18px] font-semibold tracking-[-0.03em] text-white">
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
                <div className="px-1 py-2 text-sm text-neutral-500">
                  Pick a conversation to start chatting.
                </div>
              )}
            </div>

            <div className="min-h-0 flex-1 overflow-hidden">
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
                onReplyMessage={handleReplyMessage}
                onToggleReaction={handleToggleReaction}
              />
            </div>

            <form
              onSubmit={handleSend}
              className="shrink-0 border-t border-white/8 bg-[linear-gradient(180deg,rgba(255,255,255,0.02),rgba(255,255,255,0.012))] px-4 py-3 sm:px-5"
            >
              {sendError ? (
                <div className="mb-2 text-[12px] text-red-300/90">{sendError}</div>
              ) : null}

              <ReplyingToBar
                message={replyingToMessage}
                onCancel={() => setReplyingToMessage(null)}
              />

              <div className="flex items-end gap-2">
                <textarea
                  value={messageText}
                  onChange={(event) => setMessageText(event.target.value)}
                  disabled={!selectedConversation}
                  placeholder={
                    selectedConversation
                      ? "Write a message..."
                      : "Pick a conversation first"
                  }
                  rows={1}
                  className="max-h-36 min-h-[3.2rem] flex-1 resize-y rounded-[20px] border border-white/10 bg-white/[0.03] px-4 py-3 text-sm text-white outline-none focus:border-blue-400/20 disabled:cursor-not-allowed disabled:opacity-60"
                />
                <button
                  type="submit"
                  disabled={!selectedConversation || !messageText.trim()}
                  className="inline-flex h-[3.2rem] w-[3.2rem] items-center justify-center rounded-[20px] bg-blue-600 text-white transition hover:bg-blue-500 disabled:cursor-not-allowed disabled:opacity-60"
                  aria-label="Send message"
                >
                  <svg
                    viewBox="0 0 24 24"
                    fill="none"
                    className="h-5 w-5"
                    aria-hidden="true"
                  >
                    <path
                      d="M4.75 19.25L19.25 12L4.75 4.75L7.25 12L4.75 19.25Z"
                      className="stroke-current"
                      strokeWidth="1.8"
                      strokeLinejoin="round"
                    />
                    <path
                      d="M7.25 12H13.75"
                      className="stroke-current"
                      strokeWidth="1.8"
                      strokeLinecap="round"
                    />
                  </svg>
                </button>
              </div>
            </form>
          </section>
        </div>
      </div>
    </div>
  );
}

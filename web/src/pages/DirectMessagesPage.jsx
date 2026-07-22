import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
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
    const currentReaction = existingReactions.find((reaction) => reaction.reactedByMe);

    let nextReactions;

    if (targetReaction?.reactedByMe && currentReaction?.emoji === emoji) {
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
    } else {
      const reactionsWithoutMine = existingReactions
        .map((reaction) => {
          if (!reaction.reactedByMe) {
            return reaction;
          }

          return {
            ...reaction,
            count: Math.max(0, Number(reaction.count || 0) - 1),
            reactedByMe: false,
          };
        })
        .filter((reaction) => Number(reaction.count || 0) > 0);

      const nextTargetReaction = reactionsWithoutMine.find(
        (reaction) => reaction.emoji === emoji
      );

      if (nextTargetReaction) {
        nextReactions = reactionsWithoutMine.map((reaction) =>
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
          ...reactionsWithoutMine,
          {
            emoji,
            count: 1,
            reactedByMe: true,
          },
        ];
      }
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

function ProfileAvatar({ name, avatarUrl, isOnline, size = "h-11 w-11", textSize = "text-sm" }) {
  return (
    <div className={`relative ${size} shrink-0`}>
      <div
        className={`flex h-full w-full items-center justify-center overflow-hidden rounded-full border border-white/10 bg-[radial-gradient(circle_at_top_left,rgba(59,130,246,0.2),transparent_38%),linear-gradient(180deg,rgba(255,255,255,0.08),rgba(255,255,255,0.03))] font-semibold text-white ${textSize}`}
      >
        {avatarUrl ? (
          <img src={avatarUrl} alt={name} className="h-full w-full object-cover" />
        ) : (
          (name || "U").charAt(0).toUpperCase()
        )}
      </div>
      <span
        className={`absolute -bottom-0.5 -right-0.5 h-3.5 w-3.5 rounded-full border-2 border-neutral-950 ${
          isOnline ? "bg-emerald-400" : "bg-neutral-600"
        }`}
      />
    </div>
  );
}

function SearchInput({ value, onChange, placeholder = "Search", className = "" }) {
  return (
    <label
      className={`flex items-center gap-3 rounded-[18px] border border-white/10 bg-[linear-gradient(180deg,rgba(255,255,255,0.04),rgba(255,255,255,0.02))] px-4 py-3 text-neutral-400 shadow-[0_10px_24px_rgba(0,0,0,0.12)] ${className}`}
    >
      <svg viewBox="0 0 24 24" fill="none" className="h-5 w-5 shrink-0" aria-hidden="true">
        <path
          d="M10.75 5.75C7.85 5.75 5.5 8.1 5.5 11C5.5 13.9 7.85 16.25 10.75 16.25C13.65 16.25 16 13.9 16 11C16 8.1 13.65 5.75 10.75 5.75ZM10.75 4.25C14.48 4.25 17.5 7.27 17.5 11C17.5 12.61 16.94 14.08 16 15.24L19.28 18.53C19.57 18.82 19.57 19.3 19.28 19.59C18.99 19.88 18.51 19.88 18.22 19.59L14.94 16.31C13.78 17.25 12.31 17.81 10.75 17.81C7.02 17.81 4 14.79 4 11.06C4 7.33 7.02 4.25 10.75 4.25Z"
          className="fill-current"
        />
      </svg>

      <input
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        className="min-w-0 flex-1 bg-transparent text-sm text-white outline-none placeholder:text-neutral-500"
      />
    </label>
  );
}

function ConversationRow({ item, active, onClick }) {
  const isSentByMe =
    item.lastMessageSenderUserId && item.lastMessageSenderUserId !== item.otherUserId;

  return (
    <button
      type="button"
      onClick={() => onClick?.(item)}
      className={`w-full rounded-[18px] border px-3.5 py-3 text-left transition ${
        active
          ? "border-blue-300/22 bg-[radial-gradient(circle_at_top_left,rgba(59,130,246,0.18),transparent_34%),linear-gradient(180deg,rgba(37,99,235,0.12),rgba(12,17,27,0.96))] shadow-[0_16px_32px_rgba(37,99,235,0.16)]"
          : "border-white/8 bg-[linear-gradient(180deg,rgba(255,255,255,0.035),rgba(255,255,255,0.015))] hover:border-white/12 hover:bg-white/[0.05]"
      }`}
    >
      <div className="flex items-start gap-3">
        <ProfileAvatar
          name={item.otherDisplayName || item.otherUsername || "U"}
          avatarUrl={item.otherAvatarUrl}
          isOnline={item.isOnline}
        />

        <div className="min-w-0 flex-1">
          <div className="flex items-center justify-between gap-2">
            <div className="min-w-0 flex-1 pr-1">
              <div className="flex min-w-0 items-center gap-2">
                <div className="truncate text-[15px] font-semibold leading-5 text-white">
                  {item.otherDisplayName || item.otherUsername}
                </div>
                {item.otherIsSupporter ? (
                  <span className="shrink-0 text-[9px] font-semibold uppercase tracking-[0.12em] text-amber-200/75">
                    {item.otherSupporterBadgeLabel || "Supporter"}
                  </span>
                ) : null}
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

          <div className="mt-1.5 truncate text-[12px] leading-5 text-neutral-400">
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
  return (
    <button
      type="button"
      onClick={() => onStart?.(friend)}
      className="flex w-full min-w-0 items-center gap-3 overflow-hidden rounded-[18px] border border-white/8 bg-[linear-gradient(180deg,rgba(255,255,255,0.035),rgba(255,255,255,0.015))] px-3.5 py-3 text-left transition hover:border-blue-300/18 hover:bg-blue-500/[0.05]"
    >
      <ProfileAvatar
        name={friend.displayName || friend.username || "U"}
        avatarUrl={friend.avatarUrl || friend.conversation?.otherAvatarUrl}
        isOnline={friend.conversation?.isOnline}
      />

      <div className="min-w-0 flex-1 overflow-hidden">
        <div className="flex items-center justify-between gap-3">
          <div className="min-w-0">
            <div className="truncate text-[15px] font-medium leading-5 text-white">
              {friend.displayName || friend.username}
            </div>
            <div className="mt-1 truncate text-[11px] leading-4 text-neutral-500">
              {friend.statusMessage || `@${friend.username}`}
            </div>
          </div>
          <span className="shrink-0 text-[11px] font-semibold text-blue-200">
            Message &rarr;
          </span>
        </div>
      </div>
    </button>
  );
}

function MessageDirectory({
  search,
  onSearchChange,
  conversations,
  conversationCount,
  selectedConversationId,
  isLoading,
  liveConnectionStatus,
  onOpenConversation,
}) {
  return (
    <div className="overflow-hidden rounded-[26px] border border-white/10 bg-[radial-gradient(circle_at_top_left,rgba(59,130,246,0.08),transparent_28%),linear-gradient(180deg,rgba(18,22,31,0.98),rgba(8,10,16,0.98))] p-4 shadow-[0_18px_40px_rgba(0,0,0,0.18)]">
      <div className="flex items-end justify-between gap-3">
        <div>
          <div className="text-[10px] uppercase tracking-[0.18em] text-blue-200/70">
            Inbox
          </div>
          <h2 className="mt-1 text-[22px] font-semibold tracking-[-0.05em] text-white">
            Your conversations
          </h2>
        </div>
        <div
          className={`mb-1 flex items-center gap-1.5 text-[10px] font-medium ${
            liveConnectionStatus === "connected" ? "text-emerald-300" : "text-neutral-500"
          }`}
        >
          <span
            className={`h-1.5 w-1.5 rounded-full ${
              liveConnectionStatus === "connected" ? "bg-emerald-400" : "bg-neutral-600"
            }`}
          />
          {liveConnectionStatus === "connected"
            ? "Live"
            : liveConnectionStatus === "connecting"
            ? "Connecting"
            : "Unavailable"}
        </div>
      </div>

      <SearchInput
        value={search}
        onChange={onSearchChange}
        placeholder="Search conversations"
        className="mt-4"
      />

      <div className="mt-5 flex items-center justify-between gap-3">
        <div className="text-[11px] font-semibold uppercase tracking-[0.14em] text-neutral-400">
          Recent
        </div>
        <div className="text-[11px] text-neutral-600">{conversations.length}</div>
      </div>

      <div className="mt-2.5 space-y-2">
        {isLoading ? (
          <div className="py-4 text-sm text-neutral-500">Loading conversations...</div>
        ) : conversations.length === 0 ? (
          <div className="rounded-[18px] border border-white/8 bg-black/20 px-4 py-5 text-sm leading-6 text-neutral-500">
            {conversationCount === 0
              ? "No conversations yet. Start a new message to get going."
              : "No conversations match your search."}
          </div>
        ) : (
          conversations.map((conversation) => (
            <ConversationRow
              key={conversation.conversationId}
              item={conversation}
              active={conversation.conversationId === selectedConversationId}
              onClick={onOpenConversation}
            />
          ))
        )}
      </div>

    </div>
  );
}

function NewMessageDirectory({
  search,
  onSearchChange,
  friends,
  friendCount,
  isLoading,
  onBack,
  onStartConversation,
}) {
  const hasSearch = Boolean(search.trim());

  return (
    <div className="flex flex-col overflow-hidden rounded-[26px] border border-white/10 bg-[radial-gradient(circle_at_top_left,rgba(59,130,246,0.1),transparent_30%),linear-gradient(180deg,rgba(18,22,31,0.98),rgba(8,10,16,0.98))] p-4 shadow-[0_18px_40px_rgba(0,0,0,0.18)] lg:h-[42rem] lg:p-5">
      <div className="flex items-start gap-3">
        <button
          type="button"
          onClick={onBack}
          className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-white/10 bg-white/[0.04] text-sm text-white transition hover:bg-white/[0.08]"
          aria-label="Back to inbox"
        >
          <span aria-hidden="true">&larr;</span>
        </button>
        <div>
          <div className="text-[10px] uppercase tracking-[0.18em] text-blue-200/70">
            New message
          </div>
          <h2 className="mt-1 text-[24px] font-semibold tracking-[-0.05em] text-white">
            Choose a friend
          </h2>
          <p className="mt-1 text-[12px] leading-5 text-neutral-500">
            Search your friend list, then open or start a private conversation.
          </p>
        </div>
      </div>

      <SearchInput
        value={search}
        onChange={onSearchChange}
        placeholder="Search friends"
        className="mt-5"
      />

      <div className="mt-5 flex items-center justify-between gap-3">
        <div className="text-[11px] font-semibold uppercase tracking-[0.14em] text-neutral-400">
          Friends
        </div>
        <div className="text-[11px] text-neutral-600">{friends.length}</div>
      </div>

      <div className="mt-2.5 space-y-2 lg:min-h-0 lg:flex-1 lg:overflow-y-auto lg:pr-1">
        {isLoading ? (
          <div className="py-4 text-sm text-neutral-500">Loading friends...</div>
        ) : friends.length === 0 ? (
          <div className="rounded-[18px] border border-white/8 bg-black/20 px-4 py-5 text-sm leading-6 text-neutral-500">
            {friendCount === 0
              ? "Add friends first to start private conversations."
              : hasSearch
              ? "No friends match your search."
              : "No friends are available right now."}
          </div>
        ) : (
          friends.map((friend) => (
            <FriendStarterRow
              key={friend.userId}
              friend={friend}
              onStart={onStartConversation}
            />
          ))
        )}
      </div>
    </div>
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
  const navigate = useNavigate();
  const {
    conversations,
    isLoading: isLoadingConversations,
    error: conversationsError,
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
  const [liveConnectionStatus, setLiveConnectionStatus] = useState("connecting");

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
  const isStartingNewChat = searchParams.get("view") === "new";

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

  const filteredConversations = useMemo(() => {
    const query = friendSearch.trim().toLowerCase();
    if (!query) return conversations;

    return conversations.filter((conversation) => {
      const haystack = [
        conversation.otherDisplayName,
        conversation.otherUsername,
        conversation.lastMessageText,
        conversation.otherStatusMessage,
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();

      return haystack.includes(query);
    });
  }, [conversations, friendSearch]);

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
        const [network] = await Promise.all([
          getMyFriendNetwork(),
          refreshConversations(),
        ]);

        if (!isMounted) return;

        setFriendNetwork(network);

      } catch {
        if (!isMounted) return;
        setError("Failed to load your inbox.");
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
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
    setLiveConnectionStatus("connecting");

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

    connection.on("DirectMessageRead", (payload) => {
      if (isCancelled || !payload?.conversationId || !payload?.readerUserId) return;
      if (payload.conversationId !== selectedConversationId) return;

      setMessages((previous) =>
        previous.map((item) =>
          item.recipientUserId === payload.readerUserId && !item.readAt
            ? {
                ...item,
                readAt: payload.readAt,
              }
            : item
        )
      );
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
        if (!isCancelled) {
          setLiveConnectionStatus("connected");
        }
      } catch {
        if (!isCancelled) {
          setLiveConnectionStatus("error");
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
          } catch {
            // The connection may already be closing during page cleanup.
          }

          try {
            if (connection.state !== "Disconnected") {
              await connection.stop();
            }
          } catch {
            // A disconnected realtime client does not need another stop attempt.
          }
        });
    };
  }, [token, selectedConversationId, refreshConversations, markConversationRead]);

  useEffect(() => {
    const connection = connectionRef.current;
    if (!connection || liveConnectionStatus !== "connected") return;

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
      } catch {
        // The connection status handler surfaces realtime availability to the UI.
      }
    })();
  }, [selectedConversationId, liveConnectionStatus]);

  const handleOpenConversation = (conversation) => {
    if (!conversation?.conversationId) return;
    setFriendSearch("");
    setSearchParams({ conversationId: conversation.conversationId });
  };

  const handleBackToInbox = () => {
    setFriendSearch("");
    setSearchParams({});
  };

  const handleOpenNewMessage = () => {
    setFriendSearch("");
    setSearchParams({ view: "new" });
  };

  const handleOpenProfile = () => {
    if (!selectedConversation?.otherUserId) return;
    navigate(`/profile/${selectedConversation.otherUserId}`);
  };

  const handleStartConversation = async (friend) => {
    try {
      const conversation = await getOrCreateDirectConversation(friend.userId);
      upsertConversation(conversation);
      const selectedId = conversation?.conversationId;
      if (selectedId) {
        setFriendSearch("");
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
      if (!connection || liveConnectionStatus !== "connected" || !selectedConversationId) {
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
    [liveConnectionStatus, loadMessages, selectedConversationId]
  );

  const handleSend = async (event) => {
    event.preventDefault();
    setSendError("");

    if (!selectedConversation || !messageText.trim()) return;

    const connection = connectionRef.current;
    if (!connection || liveConnectionStatus !== "connected") {
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
    () => {
      const latestOwnMessageId = [...messages]
        .reverse()
        .find((message) => message.senderUserId === user?.id)?.id;

      return messages.map((message) => ({
        ...message,
        userId: message.senderUserId,
        username: message.senderUsername,
        displayName: message.senderDisplayName,
        isSupporter: message.senderIsSupporter,
        supporterBadgeLabel: message.senderSupporterBadgeLabel,
        messageType: "user",
        deliveryStatus:
          message.id === latestOwnMessageId
            ? message.readAt
              ? "read"
              : "sent"
            : "",
      }));
    },
    [messages, user?.id]
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
      <div className="mx-auto w-full max-w-[76rem] px-4 py-4 pb-24 sm:px-5 sm:py-7 md:pb-7 lg:px-6 lg:py-9">
        <AppSectionNav hideMobileNav={Boolean(selectedConversation)} />

        <div className="hidden lg:block">
          <AppTopBar
            eyebrow="Messages"
            title={isStartingNewChat ? "New message" : "Your conversations"}
            description={
              isStartingNewChat
                ? "Choose a friend to open or start a private conversation."
                : "Keep up with friends and continue private conversations without leaving the competition."
            }
            actions={[]}
          />
        </div>

        {topLevelError ? (
          <div className="mb-4 rounded-[20px] border border-red-900/35 bg-red-950/25 px-4 py-3 text-sm text-red-300/90">
            {topLevelError}
          </div>
        ) : null}


        <div
          className={`grid min-h-0 gap-4 ${
            isStartingNewChat ? "" : "lg:grid-cols-[22rem_minmax(0,1fr)]"
          }`}
        >
          {isStartingNewChat ? (
            <section className="mx-auto w-full max-w-[42rem]">
              <div className="px-1 pb-4 pt-1 lg:hidden">
                <div className="text-[10px] uppercase tracking-[0.18em] text-blue-200/70">
                  Direct messages
                </div>
                <h1 className="mt-2 text-[29px] font-semibold leading-none tracking-[-0.055em] text-white">
                  New message
                </h1>
              </div>

              <NewMessageDirectory
                search={friendSearch}
                onSearchChange={(event) => setFriendSearch(event.target.value)}
                friends={filteredFriends}
                friendCount={acceptedFriends.length}
                isLoading={isLoading || isLoadingConversations}
                onBack={handleBackToInbox}
                onStartConversation={handleStartConversation}
              />
            </section>
          ) : (
            <>
          <section className={`space-y-4 lg:hidden ${selectedConversation ? "hidden" : ""}`}>
            <div className="px-1 pb-1 pt-1">
              <div className="text-[10px] uppercase tracking-[0.18em] text-blue-200/70">
                Direct messages
              </div>
              <h1 className="mt-2 text-[29px] font-semibold leading-none tracking-[-0.055em] text-white">
                Messages
              </h1>
              <p className="mt-2 text-[13px] leading-6 text-neutral-400">
                Reopen a conversation or start one with a friend.
              </p>
            </div>

            <MessageDirectory
              search={friendSearch}
              onSearchChange={(event) => setFriendSearch(event.target.value)}
              conversations={filteredConversations}
              conversationCount={conversations.length}
              selectedConversationId={selectedConversationId}
              isLoading={isLoading || isLoadingConversations}
              liveConnectionStatus={liveConnectionStatus}
              onOpenConversation={handleOpenConversation}
            />
          </section>

          <section className="hidden lg:block">
            <MessageDirectory
              search={friendSearch}
              onSearchChange={(event) => setFriendSearch(event.target.value)}
              conversations={filteredConversations}
              conversationCount={conversations.length}
              selectedConversationId={selectedConversationId}
              isLoading={isLoading || isLoadingConversations}
              liveConnectionStatus={liveConnectionStatus}
              onOpenConversation={handleOpenConversation}
            />
          </section>

          <section
            className={`min-h-0 overflow-hidden border border-white/10 bg-[radial-gradient(circle_at_top_right,rgba(59,130,246,0.08),transparent_24%),linear-gradient(180deg,rgba(255,255,255,0.03),rgba(255,255,255,0.012))] ${
              !selectedConversation ? "hidden lg:flex" : "flex"
            } ${
              selectedConversation
                ? "fixed inset-x-0 top-0 bottom-0 z-40 rounded-none border-x-0 border-t-0 pb-0 pt-[env(safe-area-inset-top)] lg:inset-auto lg:relative lg:h-[42rem] lg:rounded-[30px] lg:border lg:pt-0"
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

                  <button
                    type="button"
                    onClick={handleOpenProfile}
                    className="flex min-w-0 flex-1 items-center gap-3 rounded-[18px] p-1 text-left transition hover:bg-white/[0.04]"
                  >
                    <ProfileAvatar
                      name={
                        selectedConversation.otherDisplayName ||
                        selectedConversation.otherUsername ||
                        "U"
                      }
                      avatarUrl={selectedConversation.otherAvatarUrl}
                      isOnline={selectedConversation.isOnline}
                      size="h-12 w-12"
                      textSize="text-base"
                    />

                    <div className="min-w-0 flex-1">
                      <div className="break-words text-[18px] font-semibold tracking-[-0.03em] text-white">
                        {selectedConversation.otherDisplayName ||
                          selectedConversation.otherUsername}
                      </div>
                      {selectedConversation.otherIsSupporter ? (
                        <div className="mt-1 inline-flex rounded-full border border-amber-300/18 bg-amber-400/10 px-2 py-0.5 text-[9px] font-semibold uppercase tracking-[0.14em] text-amber-100">
                          {selectedConversation.otherSupporterBadgeLabel || "Supporter"}
                        </div>
                      ) : null}
                      <div
                        className={`mt-1 truncate text-[12px] ${
                          selectedConversation.isOnline ? "text-emerald-300" : "text-neutral-400"
                        }`}
                      >
                        {selectedConversation.otherStatusMessage ||
                          formatPresence(selectedConversation)}
                      </div>
                    </div>

                    <div className="hidden text-[11px] text-neutral-500 sm:block">
                      Open profile
                    </div>
                  </button>
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
              className="shrink-0 border-t border-white/8 bg-[linear-gradient(180deg,rgba(255,255,255,0.02),rgba(255,255,255,0.012))] px-4 pt-3 pb-[max(0.85rem,env(safe-area-inset-bottom))] sm:px-5 sm:py-3"
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
            </>
          )}
        </div>

        {!selectedConversation && !isStartingNewChat ? (
          <button
            type="button"
            onClick={handleOpenNewMessage}
            className="fixed bottom-32 right-4 z-30 inline-flex h-14 w-14 items-center justify-center rounded-full border border-blue-300/20 bg-blue-500 text-white shadow-[0_18px_38px_rgba(37,99,235,0.38)] transition hover:-translate-y-0.5 hover:bg-blue-400 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-200/70 focus-visible:ring-offset-2 focus-visible:ring-offset-neutral-950 md:bottom-7 md:right-7 lg:h-16 lg:w-16"
            aria-label="Start a new chat"
            title="Start a new chat"
          >
            <svg
              viewBox="0 0 24 24"
              fill="none"
              className="h-6 w-6 lg:h-7 lg:w-7"
              aria-hidden="true"
            >
              <path
                d="M7.25 18.5L4.5 20V7.75A3.25 3.25 0 0 1 7.75 4.5h8.5a3.25 3.25 0 0 1 3.25 3.25v5.5a3.25 3.25 0 0 1-3.25 3.25H9.3L7.25 18.5Z"
                className="stroke-current"
                strokeWidth="1.7"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
              <path
                d="M12 8v5M9.5 10.5h5"
                className="stroke-current"
                strokeWidth="1.7"
                strokeLinecap="round"
              />
            </svg>
          </button>
        ) : null}
      </div>
    </div>
  );
}

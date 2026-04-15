import ChatMessage from "./ChatMessage";

export default function ChatStream({
  messages,
  currentUserId,
  error,
  isLoading,
  containerRef,
  onScroll,
  isAdmin = false,
  onDeleteMessage,
  onMuteUser,
}) {
  return (
    <div
      ref={containerRef}
      onScroll={onScroll}
      className="min-h-0 flex-1 overflow-y-auto bg-neutral-950"
    >
      <div className="mx-auto flex w-full max-w-[64rem] flex-col px-3 py-3 sm:px-4 sm:py-4 lg:px-5 lg:py-5">
        {error ? (
          <div className="mb-3 rounded-[20px] border border-red-900/35 bg-red-950/25 px-4 py-3 text-sm text-red-300/90 shadow-[0_8px_24px_rgba(0,0,0,0.16)]">
            {error}
          </div>
        ) : null}

        {isLoading ? (
          <div className="py-8 text-center text-sm text-neutral-500">
            Loading messages...
          </div>
        ) : messages.length === 0 ? (
          <div className="rounded-[22px] border border-white/6 bg-white/[0.02] px-4 py-8 text-center text-sm text-neutral-500">
            No messages yet. Start the conversation.
          </div>
        ) : (
          <>
            <div className="mb-1 flex items-center justify-center">
              <div className="rounded-full border border-white/6 bg-white/[0.02] px-3 py-1 text-[10px] uppercase tracking-[0.18em] text-neutral-500">
                Live chat
              </div>
            </div>

            <div className="space-y-0.5">
              {messages.map((message, index) => (
                <ChatMessage
                  key={message.id}
                  message={message}
                  currentUserId={currentUserId}
                  previousMessage={index > 0 ? messages[index - 1] : null}
                  nextMessage={
                    index < messages.length - 1 ? messages[index + 1] : null
                  }
                  isAdmin={isAdmin}
                  onDeleteMessage={onDeleteMessage}
                  onMuteUser={onMuteUser}
                />
              ))}
            </div>

            <div className="h-3 sm:h-4" />
          </>
        )}
      </div>
    </div>
  );
}
using Bts.Api.Models.Responses;
using Bts.Api.Repositories;

namespace Bts.Api.Services;

public sealed class ChatService
{
    private static readonly HashSet<string> AllowedReactions =
    [
        "👍", "🔥", "😂", "👏", "😮"
    ];

    private readonly IMessageRepository _messageRepository;
    private readonly IUserRepository _userRepository;
    private readonly IRoomRepository _roomRepository;
    private readonly ChatModerationService _chatModerationService;

    public ChatService(
        IMessageRepository messageRepository,
        IUserRepository userRepository,
        IRoomRepository roomRepository,
        ChatModerationService chatModerationService)
    {
        _messageRepository = messageRepository;
        _userRepository = userRepository;
        _roomRepository = roomRepository;
        _chatModerationService = chatModerationService;
    }

    public async Task<IEnumerable<ChatMessageResponse>> GetRecentMessagesAsync(
        Guid roomId,
        Guid currentUserId,
        int take)
    {
        var room = await _roomRepository.GetByIdAsync(roomId);
        if (room is null)
            throw new KeyNotFoundException("Room not found.");

        return await _messageRepository.GetRecentByRoomAsync(roomId, currentUserId, take);
    }

    public async Task<ChatMessageResponse> CreateUserMessageAsync(
        Guid roomId,
        Guid userId,
        string text,
        Guid? replyToMessageId = null)
    {
        var room = await _roomRepository.GetByIdAsync(roomId);
        if (room is null)
            throw new KeyNotFoundException("Room not found.");

        var user = await _userRepository.GetByIdAsync(userId);
        if (user is null)
            throw new KeyNotFoundException("User not found.");

        var trimmed = text.Trim();
        if (string.IsNullOrWhiteSpace(trimmed))
            throw new InvalidOperationException("Message cannot be empty.");

        if (trimmed.Length > 500)
            throw new InvalidOperationException("Message is too long.");

        if (replyToMessageId.HasValue)
        {
            var exists = await _messageRepository.MessageExistsInRoomAsync(roomId, replyToMessageId.Value);
            if (!exists)
                throw new InvalidOperationException("Reply target not found in this room.");
        }

        var moderation = await _chatModerationService.ValidateNormalChatMessageAsync(
            roomId,
            userId,
            trimmed);

        if (!moderation.IsAllowed)
            throw new InvalidOperationException(moderation.ErrorMessage ?? "Message blocked.");

        var id = Guid.NewGuid();

        await _messageRepository.CreateAsync(
            id,
            roomId,
            userId,
            trimmed,
            "user",
            replyToMessageId);

        return await _messageRepository.GetByIdAsync(id, userId)
            ?? throw new InvalidOperationException("Failed to load created message.");
    }

    public async Task<ChatMessageResponse> CreateSystemMessageAsync(Guid roomId, string text)
    {
        var room = await _roomRepository.GetByIdAsync(roomId);
        if (room is null)
            throw new KeyNotFoundException("Room not found.");

        var trimmed = text.Trim();
        var id = Guid.NewGuid();

        await _messageRepository.CreateAsync(id, roomId, null, trimmed, "system", null);

        return await _messageRepository.GetByIdAsync(id, Guid.Empty)
            ?? new ChatMessageResponse
            {
                Id = id,
                RoomId = roomId,
                UserId = null,
                Username = null,
                DisplayName = null,
                IsAdmin = false,
                MessageText = trimmed,
                MessageType = "system",
                SentAt = DateTime.UtcNow
            };
    }

    public async Task<ChatMessageResponse> EditMessageAsync(
        Guid roomId,
        Guid userId,
        Guid messageId,
        string text)
    {
        var trimmed = text.Trim();

        if (string.IsNullOrWhiteSpace(trimmed))
            throw new InvalidOperationException("Message cannot be empty.");

        if (trimmed.Length > 500)
            throw new InvalidOperationException("Message is too long.");

        var existsInRoom = await _messageRepository.MessageExistsInRoomAsync(roomId, messageId);
        if (!existsInRoom)
            throw new InvalidOperationException("Message not found in this room.");

        var ownsMessage = await _messageRepository.UserOwnsMessageAsync(messageId, userId);
        if (!ownsMessage)
            throw new InvalidOperationException("You can only edit your own message.");

        await _messageRepository.UpdateTextAsync(messageId, trimmed, DateTime.UtcNow);

        return await _messageRepository.GetByIdAsync(messageId, userId)
            ?? throw new InvalidOperationException("Failed to load updated message.");
    }

    public async Task<ChatMessageReactionUpdateResponse> ToggleReactionAsync(
        Guid roomId,
        Guid userId,
        Guid messageId,
        string emoji)
    {
        if (string.IsNullOrWhiteSpace(emoji) || !AllowedReactions.Contains(emoji))
            throw new InvalidOperationException("Reaction is not allowed.");

        var existsInRoom = await _messageRepository.MessageExistsInRoomAsync(roomId, messageId);
        if (!existsInRoom)
            throw new InvalidOperationException("Message not found in this room.");

        await _messageRepository.ToggleReactionAsync(messageId, userId, emoji);
        var reactions = await _messageRepository.GetReactionsAsync(messageId, userId);

        return new ChatMessageReactionUpdateResponse
        {
            MessageId = messageId,
            Reactions = reactions
        };
    }

    public async Task<ChatMessageResponse> PinMessageAsync(
        Guid roomId,
        Guid moderatorUserId,
        Guid messageId)
    {
        var existsInRoom = await _messageRepository.MessageExistsInRoomAsync(roomId, messageId);
        if (!existsInRoom)
            throw new InvalidOperationException("Message not found in this room.");

        await _messageRepository.PinMessageAsync(roomId, messageId, moderatorUserId, DateTime.UtcNow);

        return await _messageRepository.GetPinnedByRoomAsync(roomId, moderatorUserId)
            ?? throw new InvalidOperationException("Failed to load pinned message.");
    }

    public async Task UnpinMessageAsync(Guid roomId)
    {
        await _messageRepository.UnpinRoomAsync(roomId);
    }
}
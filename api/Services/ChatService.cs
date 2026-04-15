using Bts.Api.Models.Responses;
using Bts.Api.Repositories;

namespace Bts.Api.Services;

public sealed class ChatService
{
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

    public async Task<IEnumerable<ChatMessageResponse>> GetRecentMessagesAsync(Guid roomId, int take)
    {
        var room = await _roomRepository.GetByIdAsync(roomId);
        if (room is null)
            throw new KeyNotFoundException("Room not found.");

        return await _messageRepository.GetRecentByRoomAsync(roomId, take);
    }

    public async Task<ChatMessageResponse> CreateUserMessageAsync(Guid roomId, Guid userId, string text)
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

        var moderation = await _chatModerationService.ValidateNormalChatMessageAsync(
            roomId,
            userId,
            trimmed);

        if (!moderation.IsAllowed)
            throw new InvalidOperationException(moderation.ErrorMessage ?? "Message blocked.");

        var id = Guid.NewGuid();
        await _messageRepository.CreateAsync(id, roomId, userId, trimmed, "user");

        return new ChatMessageResponse
        {
            Id = id,
            RoomId = roomId,
            UserId = userId,
            Username = user.Username,
            DisplayName = user.DisplayName,
            IsAdmin = user.IsAdmin,
            MessageText = trimmed,
            MessageType = "user",
            SentAt = DateTime.UtcNow
        };
    }

    public async Task<ChatMessageResponse> CreateSystemMessageAsync(Guid roomId, string text)
    {
        var room = await _roomRepository.GetByIdAsync(roomId);
        if (room is null)
            throw new KeyNotFoundException("Room not found.");

        var trimmed = text.Trim();
        var id = Guid.NewGuid();

        await _messageRepository.CreateAsync(id, roomId, null, trimmed, "system");

        return new ChatMessageResponse
        {
            Id = id,
            RoomId = roomId,
            UserId = null,
            Username = null,
            DisplayName = null,
            MessageText = trimmed,
            MessageType = "system",
            SentAt = DateTime.UtcNow
        };
    }
}
using Bts.Api.Models.Domain;
using Bts.Api.Models.Responses;
using Bts.Api.Repositories;

namespace Bts.Api.Services;

public sealed class DirectMessageService
{
    private static readonly HashSet<string> AllowedReactions =
    [
        "👍", "❤️", "😂", "😮", "😢", "🙏", "🔥"
    ];

    private readonly IDirectMessageRepository _directMessageRepository;
    private readonly IUserRepository _userRepository;
    private readonly IFriendRepository _friendRepository;
    private readonly UserPresenceService _userPresenceService;

    public DirectMessageService(
        IDirectMessageRepository directMessageRepository,
        IUserRepository userRepository,
        IFriendRepository friendRepository,
        UserPresenceService userPresenceService)
    {
        _directMessageRepository = directMessageRepository;
        _userRepository = userRepository;
        _friendRepository = friendRepository;
        _userPresenceService = userPresenceService;
    }

    public async Task<IReadOnlyList<DirectConversationResponse>> GetConversationsAsync(Guid userId)
    {
        var conversations = (await _directMessageRepository.GetConversationsAsync(userId)).ToList();
        var otherIds = conversations.Select(item => item.OtherUserId).Distinct().ToArray();
        var lastSeenMap = await _userPresenceService.GetLastSeenManyAsync(otherIds);

        foreach (var conversation in conversations)
        {
            conversation.IsOnline = _userPresenceService.IsOnline(conversation.OtherUserId);
            conversation.LastSeenAt = lastSeenMap.TryGetValue(conversation.OtherUserId, out var lastSeenAt)
                ? lastSeenAt
                : null;
        }

        return conversations;
    }

    public async Task<IReadOnlyList<DirectMessageResponse>> GetMessagesAsync(Guid userId, Guid conversationId, int take = 50)
    {
        var isParticipant = await _directMessageRepository.IsParticipantAsync(conversationId, userId);
        if (!isParticipant)
            throw new UnauthorizedAccessException("You are not part of this conversation.");

        return await _directMessageRepository.GetMessagesAsync(conversationId, userId, take);
    }

    public async Task<DirectConversationResponse> GetOrCreateConversationAsync(Guid userId, Guid otherUserId)
    {
        await EnsureFriendsAsync(userId, otherUserId);

        var conversation = await _directMessageRepository.GetOrCreateConversationAsync(userId, otherUserId);
        var conversations = await GetConversationsAsync(userId);
        return conversations.FirstOrDefault(item => item.ConversationId == conversation.Id)
            ?? new DirectConversationResponse
            {
                ConversationId = conversation.Id,
                OtherUserId = otherUserId
            };
    }

    public async Task<DirectMessageResponse> SendMessageAsync(Guid userId, Guid recipientUserId, string text, Guid? replyToMessageId = null)
    {
        await EnsureFriendsAsync(userId, recipientUserId);

        var sender = await _userRepository.GetByIdAsync(userId)
            ?? throw new KeyNotFoundException("Sender not found.");
        var recipient = await _userRepository.GetByIdAsync(recipientUserId)
            ?? throw new KeyNotFoundException("Recipient not found.");

        var trimmed = text.Trim();
        if (string.IsNullOrWhiteSpace(trimmed))
            throw new InvalidOperationException("Message cannot be empty.");
        if (trimmed.Length > 500)
            throw new InvalidOperationException("Message is too long.");

        var conversation = await _directMessageRepository.GetOrCreateConversationAsync(userId, recipientUserId);
        if (replyToMessageId.HasValue)
        {
            var replyTarget = await _directMessageRepository.GetMessageByIdAsync(replyToMessageId.Value, userId);
            if (replyTarget is null || replyTarget.ConversationId != conversation.Id)
                throw new InvalidOperationException("Reply target not found in this conversation.");
        }

        var message = new DirectMessage
        {
            Id = Guid.NewGuid(),
            ConversationId = conversation.Id,
            SenderUserId = userId,
            RecipientUserId = recipientUserId,
            MessageText = trimmed,
            ReplyToMessageId = replyToMessageId,
            SentAt = DateTime.UtcNow
        };

        await _directMessageRepository.CreateMessageAsync(message);
        return await _directMessageRepository.GetMessageByIdAsync(message.Id, userId)
            ?? new DirectMessageResponse
            {
                Id = message.Id,
                ConversationId = message.ConversationId,
                SenderUserId = sender.Id,
                SenderUsername = sender.Username,
                SenderDisplayName = sender.DisplayName,
                RecipientUserId = recipient.Id,
                MessageText = message.MessageText,
                ReplyToMessageId = message.ReplyToMessageId,
                SentAt = message.SentAt,
                ReadAt = message.ReadAt
            };
    }

    public async Task<DirectMessageReadReceiptResponse?> MarkReadAsync(Guid userId, Guid conversationId)
    {
        var isParticipant = await _directMessageRepository.IsParticipantAsync(conversationId, userId);
        if (!isParticipant)
            throw new UnauthorizedAccessException("You are not part of this conversation.");

        var readAt = DateTime.UtcNow;
        var updatedCount = await _directMessageRepository.MarkConversationReadAsync(conversationId, userId, readAt);

        if (updatedCount <= 0)
            return null;

        return new DirectMessageReadReceiptResponse
        {
            ConversationId = conversationId,
            ReaderUserId = userId,
            ReadAt = readAt
        };
    }

    public async Task<ChatMessageReactionUpdateResponse> ToggleReactionAsync(Guid userId, Guid messageId, string emoji)
    {
        if (string.IsNullOrWhiteSpace(emoji) || !AllowedReactions.Contains(emoji))
            throw new InvalidOperationException("Reaction is not allowed.");

        var message = await _directMessageRepository.GetMessageByIdAsync(messageId, userId)
            ?? throw new KeyNotFoundException("Direct message not found.");

        var isParticipant = await _directMessageRepository.IsParticipantAsync(message.ConversationId, userId);
        if (!isParticipant)
            throw new UnauthorizedAccessException("You are not part of this conversation.");

        await _directMessageRepository.ToggleReactionAsync(messageId, userId, emoji);
        var reactions = await _directMessageRepository.GetReactionsAsync(messageId, userId);

        return new ChatMessageReactionUpdateResponse
        {
            MessageId = messageId,
            Reactions = reactions
        };
    }

    private async Task EnsureFriendsAsync(Guid userId, Guid otherUserId)
    {
        if (userId == otherUserId)
            throw new InvalidOperationException("You cannot message yourself.");

        var relationship = await _friendRepository.GetRelationshipAsync(userId, otherUserId);
        if (relationship is null || !string.Equals(relationship.Status, "accepted", StringComparison.OrdinalIgnoreCase))
            throw new InvalidOperationException("Direct messages are only available between friends.");
    }
}

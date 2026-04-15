using Bts.Api.Repositories;

namespace Bts.Api.Services;

public sealed class ChatModerationService
{
    private readonly IRoomModerationRepository _roomModerationRepository;
    private readonly IChatRateLimitService _chatRateLimitService;
    private readonly IProfanityFilterService _profanityFilterService;

    public ChatModerationService(
        IRoomModerationRepository roomModerationRepository,
        IChatRateLimitService chatRateLimitService,
        IProfanityFilterService profanityFilterService)
    {
        _roomModerationRepository = roomModerationRepository;
        _chatRateLimitService = chatRateLimitService;
        _profanityFilterService = profanityFilterService;
    }

    public async Task<ChatModerationCheckResult> ValidateNormalChatMessageAsync(
        Guid roomId,
        Guid userId,
        string messageText)
    {
        var nowUtc = DateTime.UtcNow;

        var mute = await _roomModerationRepository.GetActiveMuteAsync(roomId, userId, nowUtc);
        if (mute is not null)
        {
            return ChatModerationCheckResult.Deny(
                mute.MutedUntil.HasValue
                    ? $"You are muted in this room until {mute.MutedUntil.Value:u}."
                    : "You are muted in this room.");
        }

        var canSend = await _chatRateLimitService.CanSendAsync(roomId, userId);
        if (!canSend)
            return ChatModerationCheckResult.Deny("You are sending messages too quickly.");

        if (_profanityFilterService.ContainsBlockedContent(messageText))
            return ChatModerationCheckResult.Deny("Your message contains blocked language.");

        return ChatModerationCheckResult.Allow();
    }
}
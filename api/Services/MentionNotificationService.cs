using System.Text.RegularExpressions;
using Bts.Api.Models.Responses;
using Bts.Api.Repositories;

namespace Bts.Api.Services;

public sealed class MentionNotificationService
{
    private static readonly Regex MentionRegex = new(
        @"(?:^|\s)@([a-zA-Z0-9._-]+)",
        RegexOptions.Compiled | RegexOptions.IgnoreCase);

    private readonly IMentionNotificationRepository _mentionNotificationRepository;
    private readonly IUserRepository _userRepository;

    public MentionNotificationService(
        IMentionNotificationRepository mentionNotificationRepository,
        IUserRepository userRepository)
    {
        _mentionNotificationRepository = mentionNotificationRepository;
        _userRepository = userRepository;
    }

    public async Task CreateMentionsForMessageAsync(
        Guid roomId,
        Guid sourceUserId,
        string? sourceDisplayName,
        string? sourceUsername,
        Guid chatMessageId,
        string messageText)
    {
        if (string.IsNullOrWhiteSpace(messageText))
            return;

        var usernames = ExtractMentionUsernames(messageText);
        if (usernames.Count == 0)
            return;

        var previewText = BuildPreviewText(messageText);

        foreach (var username in usernames)
        {
            var user = await _userRepository.GetByUsernameAsync(username);
            if (user is null)
                continue;

            if (user.Id == sourceUserId)
                continue;

            await _mentionNotificationRepository.CreateAsync(
                Guid.NewGuid(),
                user.Id,
                sourceUserId,
                roomId,
                chatMessageId,
                previewText,
                sourceDisplayName,
                sourceUsername);
        }
    }

    public Task<Dictionary<Guid, int>> GetUnreadCountsByRoomAsync(Guid userId)
    {
        return _mentionNotificationRepository.GetUnreadCountsByRoomAsync(userId);
    }

    public Task<IReadOnlyList<MentionNotificationItemResponse>> GetUnreadItemsAsync(
        Guid userId,
        int take)
    {
        return _mentionNotificationRepository.GetUnreadItemsAsync(userId, take);
    }

    public Task MarkRoomMentionsReadAsync(Guid roomId, Guid userId)
    {
        return _mentionNotificationRepository.MarkRoomAsReadAsync(
            roomId,
            userId,
            DateTime.UtcNow);
    }

    public Task MarkMessageMentionReadAsync(Guid chatMessageId, Guid userId)
    {
        return _mentionNotificationRepository.MarkMessageAsReadAsync(
            chatMessageId,
            userId,
            DateTime.UtcNow);
    }

    private static HashSet<string> ExtractMentionUsernames(string messageText)
    {
        var results = new HashSet<string>(StringComparer.OrdinalIgnoreCase);

        foreach (Match match in MentionRegex.Matches(messageText))
        {
            var username = match.Groups[1].Value?.Trim();
            if (string.IsNullOrWhiteSpace(username))
                continue;

            results.Add(username);
        }

        return results;
    }

    private static string BuildPreviewText(string messageText)
    {
        var trimmed = messageText.Trim();

        if (trimmed.Length <= 140)
            return trimmed;

        return $"{trimmed[..137]}...";
    }
}
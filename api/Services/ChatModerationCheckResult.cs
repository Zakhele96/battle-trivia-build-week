namespace Bts.Api.Services;

public sealed class ChatModerationCheckResult
{
    public bool IsAllowed { get; init; }
    public string? ErrorMessage { get; init; }

    public static ChatModerationCheckResult Allow() => new()
    {
        IsAllowed = true
    };

    public static ChatModerationCheckResult Deny(string message) => new()
    {
        IsAllowed = false,
        ErrorMessage = message
    };
}
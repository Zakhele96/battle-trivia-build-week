namespace Bts.Api.Models.Responses;

public sealed class ProfileUserResponse
{
    public Guid UserId { get; set; }
    public string Username { get; set; } = string.Empty;
    public string DisplayName { get; set; } = string.Empty;
    public string? AvatarUrl { get; set; }
    public string? StatusMessage { get; set; }
    public bool IsOnline { get; set; }
    public DateTime? LastSeenAt { get; set; }
    public ProfileStatsResponse Stats { get; set; } = new();
}

namespace Bts.Api.Models.Responses;

public sealed class ProfileMeResponse
{
    public string Username { get; set; } = string.Empty;
    public string DisplayName { get; set; } = string.Empty;
    public string Email { get; set; } = string.Empty;
    public string? PhoneNumber { get; set; }
    public string? AvatarUrl { get; set; }
    public string? StatusMessage { get; set; }
    public bool IsSupporter { get; set; }
    public string? SupporterTier { get; set; }
    public string? SupporterBadgeLabel { get; set; }
    public DateTime? SupporterExpiresAt { get; set; }
    public bool IsAdmin { get; set; }
    public ProfileStatsResponse Stats { get; set; } = new();
    public GrowthSummaryResponse Growth { get; set; } = new();
}

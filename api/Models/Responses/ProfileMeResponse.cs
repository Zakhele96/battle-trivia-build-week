namespace Bts.Api.Models.Responses;

public sealed class ProfileMeResponse
{
    public string Username { get; set; } = string.Empty;
    public string DisplayName { get; set; } = string.Empty;
    public string Email { get; set; } = string.Empty;
    public string? PhoneNumber { get; set; }
    public bool IsAdmin { get; set; }
    public ProfileStatsResponse Stats { get; set; } = new();
    public GrowthSummaryResponse Growth { get; set; } = new();
}

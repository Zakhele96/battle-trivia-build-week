namespace Bts.Api.Models.Dtos;

public sealed class WordScrambleLeaderboardRowDto
{
    public Guid UserId { get; set; }
    public string Username { get; set; } = string.Empty;
    public string DisplayName { get; set; } = string.Empty;
    public string? AvatarUrl { get; set; }
    public bool IsSupporter { get; set; }
    public string? SupporterBadgeLabel { get; set; }
    public int Score { get; set; }
    public int Rank { get; set; }
}

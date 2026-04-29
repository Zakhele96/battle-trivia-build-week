namespace Bts.Api.Models.Responses;

public sealed class ArenaLeaderboardRowResponse
{
    public Guid UserId { get; set; }
    public string Username { get; set; } = string.Empty;
    public string DisplayName { get; set; } = string.Empty;
    public string? AvatarUrl { get; set; }
    public int BattlesWon { get; set; }
    public int VotesReceived { get; set; }
    public int EntriesSubmitted { get; set; }
}

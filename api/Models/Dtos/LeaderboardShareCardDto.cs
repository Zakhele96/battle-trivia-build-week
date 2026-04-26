namespace Bts.Api.Models.Dtos;

public sealed class LeaderboardShareCardDto
{
    public string Mode { get; set; } = string.Empty;
    public string Period { get; set; } = string.Empty;
    public string Label { get; set; } = string.Empty;
    public string SharerName { get; set; } = string.Empty;
    public string SharerUsername { get; set; } = string.Empty;
    public Guid SharerUserId { get; set; }
    public int? Rank { get; set; }
    public int? Score { get; set; }
    public int BattleTriviaScore { get; set; }
    public int WordScrambleScore { get; set; }
    public DateTime? EndedAt { get; set; }
    public bool IsCurrentWeek { get; set; }
    public IReadOnlyList<GameLeaderboardRowDto> Rows { get; set; } = Array.Empty<GameLeaderboardRowDto>();
    public LeaderboardSponsorDto? Sponsor { get; set; }
}

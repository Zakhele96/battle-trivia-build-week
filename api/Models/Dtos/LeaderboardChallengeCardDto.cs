namespace Bts.Api.Models.Dtos;

public sealed class LeaderboardChallengeCardDto
{
    public string Mode { get; set; } = string.Empty;
    public string Period { get; set; } = string.Empty;
    public string Label { get; set; } = string.Empty;
    public bool IsCurrentWeek { get; set; }
    public DateTime? EndedAt { get; set; }

    public Guid ChallengerUserId { get; set; }
    public string ChallengerName { get; set; } = string.Empty;
    public string ChallengerUsername { get; set; } = string.Empty;
    public GameLeaderboardRowDto? ChallengerRow { get; set; }

    public Guid RivalUserId { get; set; }
    public string RivalName { get; set; } = string.Empty;
    public string RivalUsername { get; set; } = string.Empty;
    public GameLeaderboardRowDto? RivalRow { get; set; }

    public IReadOnlyList<GameLeaderboardRowDto> Rows { get; set; } =
        Array.Empty<GameLeaderboardRowDto>();
    public LeaderboardSponsorDto? Sponsor { get; set; }
}

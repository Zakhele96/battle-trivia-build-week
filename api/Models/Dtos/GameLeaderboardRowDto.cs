namespace Bts.Api.Models.Dtos;

public sealed class GameLeaderboardRowDto
{
    public Guid UserId { get; set; }
    public string Username { get; set; } = string.Empty;
    public string DisplayName { get; set; } = string.Empty;
    public string? AvatarUrl { get; set; }
    public bool IsOnline { get; set; }
    public bool IsSupporter { get; set; }
    public string? SupporterBadgeLabel { get; set; }

    public int Rank { get; set; }
    public int Score { get; set; }

    public int BattleTriviaScore { get; set; }
    public int WordScrambleScore { get; set; }
}

public sealed class GameLeaderboardDto
{
    public string Mode { get; set; } = string.Empty;     // battle-trivia | word-scramble | combined
    public string Period { get; set; } = string.Empty;   // current | previous
    public string Label { get; set; } = string.Empty;
    public DateTime? EndedAt { get; set; }

    public IReadOnlyList<GameLeaderboardRowDto> Rows { get; set; } =
        Array.Empty<GameLeaderboardRowDto>();
}

namespace Bts.Api.Models.Dtos;

public sealed class WordScrambleStateDto
{
    public Guid? SessionId { get; set; }
    public Guid? RoundId { get; set; }
    public int? RoundNumber { get; set; }

    public string Phase { get; set; } = "waiting"; // waiting, active, reveal
    public string MaskedWord { get; set; } = string.Empty;
    public string? AnswerWord { get; set; }
    public string? Category { get; set; }
    public string? Hint { get; set; }

    public DateTime? StartsAt { get; set; }
    public DateTime? EndsAt { get; set; }
    public int TimeLeft { get; set; }
    public WordScramblePlayerStatsDto? PlayerStats { get; set; }

    public IReadOnlyList<WordScrambleLeaderboardRowDto> Winners { get; set; } =
        Array.Empty<WordScrambleLeaderboardRowDto>();

    public IReadOnlyList<WordScrambleLeaderboardRowDto> Leaderboard { get; set; } =
        Array.Empty<WordScrambleLeaderboardRowDto>();
}

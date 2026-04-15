namespace Bts.Api.Models.Dtos;

public sealed class BattleTriviaSessionStatusDto
{
    public Guid? SessionId { get; set; }
    public string SessionType { get; set; } = "weekly";
    public string RunMode { get; set; } = "continuous";

    public bool IsLiveNow { get; set; }
    public bool HasActiveRound { get; set; }

    public DateTime? PeriodStart { get; set; }
    public DateTime? PeriodEnd { get; set; }

    public DateTime? CurrentWindowEnd { get; set; }
    public DateTime? NextWindowStart { get; set; }
    public DateTime? CurrentRoundEndsAt { get; set; }

    public string StatusText { get; set; } = string.Empty;
}
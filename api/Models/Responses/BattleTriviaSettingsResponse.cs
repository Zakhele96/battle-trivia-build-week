namespace Bts.Api.Models.Responses;

public sealed class BattleTriviaSettingsResponse
{
    public Guid SessionId { get; set; }
    public string SessionType { get; set; } = "weekly";
    public string RunMode { get; set; } = "continuous";
    public DateTime? PeriodStart { get; set; }
    public DateTime? PeriodEnd { get; set; }
    public List<BattleTriviaWindowResponse> Windows { get; set; } = new();
}

public sealed class BattleTriviaWindowResponse
{
    public int DayOfWeek { get; set; }
    public string StartTime { get; set; } = "18:00";
    public string EndTime { get; set; } = "22:00";
    public bool IsActive { get; set; }
}
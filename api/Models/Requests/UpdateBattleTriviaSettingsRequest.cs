namespace Bts.Api.Models.Requests;

public sealed class UpdateBattleTriviaSettingsRequest
{
    public string RunMode { get; set; } = "continuous";
    public List<BattleTriviaWindowRequest> Windows { get; set; } = new();
}

public sealed class BattleTriviaWindowRequest
{
    public int DayOfWeek { get; set; }
    public string StartTime { get; set; } = "18:00";
    public string EndTime { get; set; } = "22:00";
    public bool IsActive { get; set; } = true;
}
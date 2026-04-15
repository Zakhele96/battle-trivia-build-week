namespace Bts.Api.Models.Domain;

public sealed class TriviaSessionWindow
{
    public Guid Id { get; set; }
    public Guid SessionId { get; set; }
    public int DayOfWeek { get; set; }
    public TimeOnly StartTime { get; set; }
    public TimeOnly EndTime { get; set; }
    public bool IsActive { get; set; }
    public DateTime CreatedAt { get; set; }
}
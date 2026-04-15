namespace Bts.Api.Models.Domain;

public sealed class TriviaGameSession
{
    public Guid Id { get; set; }
    public Guid RoomId { get; set; }
    public string Status { get; set; } = string.Empty;
    public string SessionType { get; set; } = "weekly";
    public string RunMode { get; set; } = "continuous";
    public DateTime StartedAt { get; set; }
    public DateTime? EndedAt { get; set; }
    public DateTime? PeriodStart { get; set; }
    public DateTime? PeriodEnd { get; set; }
    public bool WinnersAnnounced { get; set; }
}
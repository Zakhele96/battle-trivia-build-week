namespace Bts.Api.Models.Domain;

public sealed class WordScrambleSession
{
    public Guid Id { get; set; }
    public Guid RoomId { get; set; }
    public string Status { get; set; } = string.Empty;
    public string RunMode { get; set; } = string.Empty;
    public DateTime? StartedAt { get; set; }
    public DateTime? EndedAt { get; set; }
    public DateTime? PeriodStart { get; set; }
    public DateTime? PeriodEnd { get; set; }
    public DateTime CreatedAt { get; set; }
}
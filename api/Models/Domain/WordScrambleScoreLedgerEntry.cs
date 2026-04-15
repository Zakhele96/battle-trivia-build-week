namespace Bts.Api.Models.Domain;

public sealed class WordScrambleScoreLedgerEntry
{
    public Guid Id { get; set; }
    public Guid RoomId { get; set; }
    public Guid SessionId { get; set; }
    public Guid RoundId { get; set; }
    public Guid UserId { get; set; }
    public int Points { get; set; }
    public string Reason { get; set; } = string.Empty;
    public DateTime CreatedAt { get; set; }
}
namespace Bts.Api.Models.Domain;

public sealed class BattleTriviaPrizePayout
{
    public Guid Id { get; set; }
    public Guid SessionId { get; set; }
    public Guid UserId { get; set; }
    public int Rank { get; set; }
    public decimal Amount { get; set; }
    public string Status { get; set; } = "pending";
    public string? Reference { get; set; }
    public string? Notes { get; set; }
    public DateTime? PaidAt { get; set; }
    public DateTime CreatedAt { get; set; }
    public DateTime UpdatedAt { get; set; }
}

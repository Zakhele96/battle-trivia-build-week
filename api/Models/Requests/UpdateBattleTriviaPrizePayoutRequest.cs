namespace Bts.Api.Models.Requests;

public sealed class UpdateBattleTriviaPrizePayoutRequest
{
    public decimal Amount { get; set; }
    public string Status { get; set; } = "pending";
    public string? Reference { get; set; }
    public string? Notes { get; set; }
    public DateTime? PaidAt { get; set; }
}

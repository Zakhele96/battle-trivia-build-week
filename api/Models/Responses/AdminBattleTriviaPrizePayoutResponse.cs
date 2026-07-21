namespace Bts.Api.Models.Responses;

public sealed class AdminBattleTriviaPrizePayoutResponse
{
    public Guid UserId { get; set; }
    public string Username { get; set; } = string.Empty;
    public string DisplayName { get; set; } = string.Empty;
    public string? AvatarUrl { get; set; }
    public bool IsSupporter { get; set; }
    public string? SupporterBadgeLabel { get; set; }
    public int Rank { get; set; }
    public int Score { get; set; }
    public decimal Amount { get; set; }
    public string Status { get; set; } = "pending";
    public string? Reference { get; set; }
    public string? Notes { get; set; }
    public DateTime? PaidAt { get; set; }
}

public sealed class AdminBattleTriviaPrizeSessionResponse
{
    public Guid SessionId { get; set; }
    public DateTime? EndedAt { get; set; }
    public DateTime? PeriodStart { get; set; }
    public DateTime? PeriodEnd { get; set; }
    public IReadOnlyList<AdminBattleTriviaPrizePayoutResponse> Winners { get; set; } =
        Array.Empty<AdminBattleTriviaPrizePayoutResponse>();
}

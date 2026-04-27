namespace Bts.Api.Models.Domain;

public sealed class SupportCheckoutSession
{
    public Guid Id { get; set; }
    public Guid UserId { get; set; }
    public string Provider { get; set; } = "payfast";
    public string PlanCode { get; set; } = "supporter-monthly";
    public string SupporterTier { get; set; } = "supporter";
    public string MerchantReference { get; set; } = string.Empty;
    public decimal Amount { get; set; }
    public string Currency { get; set; } = "ZAR";
    public int BillingFrequency { get; set; }
    public int BillingCycles { get; set; }
    public string PaymentStatus { get; set; } = "pending";
    public string? PayfastPaymentId { get; set; }
    public string? PayfastSubscriptionId { get; set; }
    public string? LastPayloadJson { get; set; }
    public DateTime? ActivatedAt { get; set; }
    public DateTime CreatedAt { get; set; }
    public DateTime UpdatedAt { get; set; }
}

using Bts.Api.Models.Domain;

namespace Bts.Api.Repositories;

public interface ISupportRepository
{
    Task CreateCheckoutSessionAsync(SupportCheckoutSession session);
    Task<SupportCheckoutSession?> GetCheckoutSessionByMerchantReferenceAsync(string merchantReference);
    Task MarkCheckoutSessionAsync(
        string merchantReference,
        string paymentStatus,
        string? payfastPaymentId,
        string? payfastSubscriptionId,
        string? lastPayloadJson,
        DateTime? activatedAtUtc);
}

using Bts.Api.Data;
using Bts.Api.Models.Domain;
using Dapper;

namespace Bts.Api.Repositories;

public sealed class SupportRepository : ISupportRepository
{
    private readonly DapperContext _context;

    public SupportRepository(DapperContext context)
    {
        _context = context;
    }

    public async Task CreateCheckoutSessionAsync(SupportCheckoutSession session)
    {
        const string sql = """
            INSERT INTO support_checkout_sessions (
                id,
                user_id,
                provider,
                plan_code,
                supporter_tier,
                merchant_reference,
                amount,
                currency,
                billing_frequency,
                billing_cycles,
                payment_status,
                payfast_payment_id,
                payfast_subscription_id,
                last_payload_json,
                activated_at,
                created_at,
                updated_at
            )
            VALUES (
                @Id,
                @UserId,
                @Provider,
                @PlanCode,
                @SupporterTier,
                @MerchantReference,
                @Amount,
                @Currency,
                @BillingFrequency,
                @BillingCycles,
                @PaymentStatus,
                @PayfastPaymentId,
                @PayfastSubscriptionId,
                @LastPayloadJson,
                @ActivatedAt,
                @CreatedAt,
                @UpdatedAt
            );
            """;

        using var connection = _context.CreateConnection();
        await connection.ExecuteAsync(sql, session);
    }

    public async Task<SupportCheckoutSession?> GetCheckoutSessionByMerchantReferenceAsync(string merchantReference)
    {
        const string sql = """
            SELECT
                id,
                user_id AS UserId,
                provider,
                plan_code AS PlanCode,
                supporter_tier AS SupporterTier,
                merchant_reference AS MerchantReference,
                amount,
                currency,
                billing_frequency AS BillingFrequency,
                billing_cycles AS BillingCycles,
                payment_status AS PaymentStatus,
                payfast_payment_id AS PayfastPaymentId,
                payfast_subscription_id AS PayfastSubscriptionId,
                last_payload_json AS LastPayloadJson,
                activated_at AS ActivatedAt,
                created_at AS CreatedAt,
                updated_at AS UpdatedAt
            FROM support_checkout_sessions
            WHERE merchant_reference = @MerchantReference
            LIMIT 1;
            """;

        using var connection = _context.CreateConnection();
        return await connection.QuerySingleOrDefaultAsync<SupportCheckoutSession>(sql, new
        {
            MerchantReference = merchantReference
        });
    }

    public async Task MarkCheckoutSessionAsync(
        string merchantReference,
        string paymentStatus,
        string? payfastPaymentId,
        string? payfastSubscriptionId,
        string? lastPayloadJson,
        DateTime? activatedAtUtc)
    {
        const string sql = """
            UPDATE support_checkout_sessions
            SET payment_status = @PaymentStatus,
                payfast_payment_id = COALESCE(@PayfastPaymentId, payfast_payment_id),
                payfast_subscription_id = COALESCE(@PayfastSubscriptionId, payfast_subscription_id),
                last_payload_json = @LastPayloadJson,
                activated_at = COALESCE(@ActivatedAtUtc, activated_at),
                updated_at = NOW()
            WHERE merchant_reference = @MerchantReference;
            """;

        using var connection = _context.CreateConnection();
        await connection.ExecuteAsync(sql, new
        {
            MerchantReference = merchantReference,
            PaymentStatus = paymentStatus,
            PayfastPaymentId = payfastPaymentId,
            PayfastSubscriptionId = payfastSubscriptionId,
            LastPayloadJson = lastPayloadJson,
            ActivatedAtUtc = activatedAtUtc
        });
    }
}

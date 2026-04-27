using System.Globalization;
using System.Security.Cryptography;
using System.Text;
using System.Text.Json;
using Bts.Api.Models.Domain;
using Bts.Api.Models.Responses;
using Bts.Api.Repositories;

namespace Bts.Api.Services;

public sealed class SupportService
{
    private const string SupporterPlanCode = "supporter-monthly";
    private const string SupporterTier = "supporter";
    private const decimal SupporterAmount = 18m;
    private const int MonthlyFrequency = 3;
    private readonly IUserRepository _userRepository;
    private readonly ISupportRepository _supportRepository;
    private readonly IConfiguration _configuration;

    public SupportService(
        IUserRepository userRepository,
        ISupportRepository supportRepository,
        IConfiguration configuration)
    {
        _userRepository = userRepository;
        _supportRepository = supportRepository;
        _configuration = configuration;
    }

    public async Task<SupportCheckoutResponse> CreatePayFastSupporterCheckoutAsync(Guid userId)
    {
        var user = await _userRepository.GetByIdAsync(userId);
        if (user is null || !user.IsActive)
            throw new InvalidOperationException("User not found.");

        var options = GetOptions();
        ValidateOptions(options);

        var nowUtc = DateTime.UtcNow;
        var merchantReference = $"bts-support-{userId:N}-{nowUtc:yyyyMMddHHmmss}";
        var session = new SupportCheckoutSession
        {
            Id = Guid.NewGuid(),
            UserId = userId,
            Provider = "payfast",
            PlanCode = SupporterPlanCode,
            SupporterTier = SupporterTier,
            MerchantReference = merchantReference,
            Amount = SupporterAmount,
            Currency = "ZAR",
            BillingFrequency = MonthlyFrequency,
            BillingCycles = 0,
            PaymentStatus = "pending",
            CreatedAt = nowUtc,
            UpdatedAt = nowUtc
        };

        await _supportRepository.CreateCheckoutSessionAsync(session);

        var checkoutUrl = options.UseSandbox
            ? "https://sandbox.payfast.co.za/eng/process"
            : "https://www.payfast.co.za/eng/process";

        var fields = new List<KeyValuePair<string, string>>
        {
            new("merchant_id", options.MerchantId),
            new("merchant_key", options.MerchantKey),
            new("return_url", options.ReturnUrl),
            new("cancel_url", options.CancelUrl),
            new("notify_url", options.NotifyUrl),
            new("name_first", GetFirstName(user.DisplayName, user.Username)),
            new("name_last", GetLastName(user.DisplayName)),
            new("email_address", user.Email),
            new("m_payment_id", merchantReference),
            new("amount", FormatAmount(SupporterAmount)),
            new("item_name", "BTS Supporter"),
            new("item_description", "Monthly BTS Supporter subscription"),
            new("custom_str1", userId.ToString()),
            new("custom_str2", SupporterPlanCode),
            new("subscription_type", "1"),
            new("recurring_amount", FormatAmount(SupporterAmount)),
            new("frequency", MonthlyFrequency.ToString(CultureInfo.InvariantCulture)),
            new("cycles", "0"),
        };

        var signature = BuildSignature(fields, options.Passphrase);
        fields.Add(new KeyValuePair<string, string>("signature", signature));

        return new SupportCheckoutResponse
        {
            Provider = "payfast",
            Method = "POST",
            CheckoutUrl = checkoutUrl,
            Fields = fields
                .Select(field => new SupportCheckoutFieldResponse
                {
                    Name = field.Key,
                    Value = field.Value
                })
                .ToList()
        };
    }

    public async Task<bool> HandlePayFastNotifyAsync(IFormCollection form)
    {
        var options = GetOptions();
        ValidateOptions(options);

        var data = form.Keys.ToDictionary(key => key, key => form[key].ToString());

        var merchantId = data.GetValueOrDefault("merchant_id") ?? "";
        var merchantKey = data.GetValueOrDefault("merchant_key") ?? "";
        var merchantReference = data.GetValueOrDefault("m_payment_id") ?? "";
        var paymentStatus = data.GetValueOrDefault("payment_status") ?? "";
        var signature = data.GetValueOrDefault("signature") ?? "";

        if (string.IsNullOrWhiteSpace(merchantReference) ||
            string.IsNullOrWhiteSpace(paymentStatus) ||
            string.IsNullOrWhiteSpace(signature))
        {
            return false;
        }

        if (!string.Equals(merchantId, options.MerchantId, StringComparison.Ordinal) ||
            !string.Equals(merchantKey, options.MerchantKey, StringComparison.Ordinal))
        {
            return false;
        }

        var session = await _supportRepository.GetCheckoutSessionByMerchantReferenceAsync(merchantReference);
        if (session is null)
            return false;

        var expectedSignature = BuildSignature(
            form.Keys
                .Where(key => !string.Equals(key, "signature", StringComparison.OrdinalIgnoreCase))
                .Select(key => new KeyValuePair<string, string>(key, form[key].ToString()))
                .ToList(),
            options.Passphrase);

        if (!string.Equals(expectedSignature, signature, StringComparison.OrdinalIgnoreCase))
            return false;

        var amountText = data.GetValueOrDefault("amount_gross") ?? data.GetValueOrDefault("amount") ?? "0";
        if (!decimal.TryParse(amountText, NumberStyles.Any, CultureInfo.InvariantCulture, out var amountReceived))
            return false;

        if (decimal.Round(amountReceived, 2) != decimal.Round(session.Amount, 2))
            return false;

        var payfastPaymentId = data.GetValueOrDefault("pf_payment_id");
        var payfastSubscriptionId =
            data.GetValueOrDefault("subscr_id")
            ?? data.GetValueOrDefault("subscription_id")
            ?? data.GetValueOrDefault("token");

        DateTime? activatedAtUtc = null;
        if (string.Equals(paymentStatus, "COMPLETE", StringComparison.OrdinalIgnoreCase))
        {
            activatedAtUtc = DateTime.UtcNow;
            var currentUser = await _userRepository.GetByIdAsync(session.UserId);
            var nextExpiry = CalculateNextSupporterExpiry(currentUser?.SupporterExpiresAt);

            await _userRepository.UpdateSupporterStatusAsync(
                session.UserId,
                true,
                session.SupporterTier,
                nextExpiry);
        }

        await _supportRepository.MarkCheckoutSessionAsync(
            merchantReference,
            paymentStatus,
            payfastPaymentId,
            payfastSubscriptionId,
            JsonSerializer.Serialize(data),
            activatedAtUtc);

        return true;
    }

    private static DateTime CalculateNextSupporterExpiry(DateTime? currentExpiry)
    {
        var baseline = currentExpiry.HasValue && currentExpiry.Value > DateTime.UtcNow
            ? currentExpiry.Value
            : DateTime.UtcNow;

        return baseline.AddMonths(1);
    }

    private static string GetFirstName(string? displayName, string username)
    {
        var parts = SplitDisplayName(displayName);
        return parts.firstName ?? username;
    }

    private static string GetLastName(string? displayName)
    {
        var parts = SplitDisplayName(displayName);
        return parts.lastName ?? "Supporter";
    }

    private static (string? firstName, string? lastName) SplitDisplayName(string? displayName)
    {
        if (string.IsNullOrWhiteSpace(displayName))
            return (null, null);

        var parts = displayName.Trim().Split(' ', StringSplitOptions.RemoveEmptyEntries);
        if (parts.Length == 0)
            return (null, null);

        if (parts.Length == 1)
            return (parts[0], null);

        return (parts[0], string.Join(' ', parts.Skip(1)));
    }

    private static string BuildSignature(IReadOnlyList<KeyValuePair<string, string>> fields, string? passphrase)
    {
        var payload = fields
            .Where(field => !string.IsNullOrWhiteSpace(field.Value))
            .Select(field => $"{field.Key}={Uri.EscapeDataString(field.Value.Trim()).Replace("%20", "+")}")
            .ToList();

        if (!string.IsNullOrWhiteSpace(passphrase))
        {
            payload.Add($"passphrase={Uri.EscapeDataString(passphrase.Trim()).Replace("%20", "+")}");
        }

        var data = string.Join("&", payload);
        var bytes = MD5.HashData(Encoding.UTF8.GetBytes(data));
        return Convert.ToHexString(bytes).ToLowerInvariant();
    }

    private static string FormatAmount(decimal value)
    {
        return value.ToString("0.00", CultureInfo.InvariantCulture);
    }

    private PayFastOptions GetOptions()
    {
        return new PayFastOptions
        {
            MerchantId = _configuration["PayFast:MerchantId"] ?? "",
            MerchantKey = _configuration["PayFast:MerchantKey"] ?? "",
            Passphrase = _configuration["PayFast:Passphrase"] ?? "",
            ReturnUrl = _configuration["PayFast:ReturnUrl"] ?? "",
            CancelUrl = _configuration["PayFast:CancelUrl"] ?? "",
            NotifyUrl = _configuration["PayFast:NotifyUrl"] ?? "",
            UseSandbox = bool.TryParse(_configuration["PayFast:UseSandbox"], out var useSandbox) && useSandbox
        };
    }

    private static void ValidateOptions(PayFastOptions options)
    {
        if (string.IsNullOrWhiteSpace(options.MerchantId) ||
            string.IsNullOrWhiteSpace(options.MerchantKey) ||
            string.IsNullOrWhiteSpace(options.Passphrase))
        {
            throw new InvalidOperationException("PayFast merchant credentials are not configured.");
        }

        if (string.IsNullOrWhiteSpace(options.ReturnUrl) ||
            string.IsNullOrWhiteSpace(options.CancelUrl) ||
            string.IsNullOrWhiteSpace(options.NotifyUrl))
        {
            throw new InvalidOperationException("PayFast return, cancel, and notify URLs are not configured.");
        }
    }

    private sealed class PayFastOptions
    {
        public string MerchantId { get; set; } = string.Empty;
        public string MerchantKey { get; set; } = string.Empty;
        public string Passphrase { get; set; } = string.Empty;
        public string ReturnUrl { get; set; } = string.Empty;
        public string CancelUrl { get; set; } = string.Empty;
        public string NotifyUrl { get; set; } = string.Empty;
        public bool UseSandbox { get; set; }
    }
}

namespace Bts.Api.Models.Requests;

public sealed class GoogleLoginRequest
{
    public string IdToken { get; set; } = string.Empty;
    public Guid? ReferredByUserId { get; set; }
    public string? ReferralSource { get; set; }
    public string? ReferralMode { get; set; }
    public string? ReferralPeriod { get; set; }
}

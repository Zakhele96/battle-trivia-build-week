namespace Bts.Api.Models.Requests;

public sealed class FacebookLoginRequest
{
    public string AccessToken { get; set; } = string.Empty;
    public Guid? ReferredByUserId { get; set; }
    public string? ReferralSource { get; set; }
    public string? ReferralMode { get; set; }
    public string? ReferralPeriod { get; set; }
}

namespace Bts.Api.Models.Requests;

public sealed class VerifyLoginCodeRequest
{
    public string EmailOrUsername { get; set; } = string.Empty;
    public string Otp { get; set; } = string.Empty;
}

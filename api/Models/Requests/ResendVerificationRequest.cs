namespace Bts.Api.Models.Requests;

public sealed class ResendVerificationRequest
{
    public string Email { get; set; } = string.Empty;
}

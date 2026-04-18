namespace Bts.Api.Models.Requests;

public sealed class GoogleLoginRequest
{
    public string IdToken { get; set; } = string.Empty;
}
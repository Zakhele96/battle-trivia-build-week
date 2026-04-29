namespace Bts.Api.Auth;

public sealed class WebPushOptions
{
    public const string SectionName = "WebPush";

    public string Subject { get; set; } = string.Empty;
    public string PublicKey { get; set; } = string.Empty;
    public string PrivateKey { get; set; } = string.Empty;
}

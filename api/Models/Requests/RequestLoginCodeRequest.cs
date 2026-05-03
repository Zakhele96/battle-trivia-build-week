namespace Bts.Api.Models.Requests;

public sealed class RequestLoginCodeRequest
{
    public string EmailOrUsername { get; set; } = string.Empty;
}

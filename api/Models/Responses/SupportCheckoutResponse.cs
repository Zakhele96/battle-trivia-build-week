namespace Bts.Api.Models.Responses;

public sealed class SupportCheckoutFieldResponse
{
    public string Name { get; set; } = string.Empty;
    public string Value { get; set; } = string.Empty;
}

public sealed class SupportCheckoutResponse
{
    public string Provider { get; set; } = "payfast";
    public string Method { get; set; } = "POST";
    public string CheckoutUrl { get; set; } = string.Empty;
    public List<SupportCheckoutFieldResponse> Fields { get; set; } = new();
}

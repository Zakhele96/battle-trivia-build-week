namespace Bts.Api.Models.Requests;

public sealed class DeletePushSubscriptionRequest
{
    public string Endpoint { get; set; } = string.Empty;
}

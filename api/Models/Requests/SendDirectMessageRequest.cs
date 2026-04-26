namespace Bts.Api.Models.Requests;

public sealed class SendDirectMessageRequest
{
    public Guid RecipientUserId { get; set; }
    public string MessageText { get; set; } = string.Empty;
}

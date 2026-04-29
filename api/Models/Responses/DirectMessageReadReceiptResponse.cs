namespace Bts.Api.Models.Responses;

public sealed class DirectMessageReadReceiptResponse
{
    public Guid ConversationId { get; set; }
    public Guid ReaderUserId { get; set; }
    public DateTime ReadAt { get; set; }
}

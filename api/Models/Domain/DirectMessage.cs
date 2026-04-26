namespace Bts.Api.Models.Domain;

public sealed class DirectMessage
{
    public Guid Id { get; set; }
    public Guid ConversationId { get; set; }
    public Guid SenderUserId { get; set; }
    public Guid RecipientUserId { get; set; }
    public string MessageText { get; set; } = string.Empty;
    public Guid? ReplyToMessageId { get; set; }
    public DateTime SentAt { get; set; }
    public DateTime? ReadAt { get; set; }
}

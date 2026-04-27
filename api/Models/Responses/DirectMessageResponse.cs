namespace Bts.Api.Models.Responses;

public sealed class DirectMessageResponse
{
    public Guid Id { get; set; }
    public Guid ConversationId { get; set; }
    public Guid SenderUserId { get; set; }
    public string SenderUsername { get; set; } = string.Empty;
    public string SenderDisplayName { get; set; } = string.Empty;
    public bool SenderIsSupporter { get; set; }
    public string? SenderSupporterBadgeLabel { get; set; }
    public Guid RecipientUserId { get; set; }
    public string MessageText { get; set; } = string.Empty;
    public DateTime SentAt { get; set; }
    public DateTime? ReadAt { get; set; }
    public Guid? ReplyToMessageId { get; set; }
    public string? ReplyToUsername { get; set; }
    public string? ReplyToDisplayName { get; set; }
    public string? ReplyToPreviewText { get; set; }
    public List<ChatMessageReactionResponse> Reactions { get; set; } = new();
}

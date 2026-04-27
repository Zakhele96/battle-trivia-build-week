namespace Bts.Api.Models.Responses;

public sealed class ChatMessageResponse
{
    public Guid Id { get; set; }
    public Guid RoomId { get; set; }
    public Guid? UserId { get; set; }
    public string? Username { get; set; }
    public bool IsAdmin { get; set; }
    public bool IsSupporter { get; set; }
    public string? SupporterBadgeLabel { get; set; }
    public string? DisplayName { get; set; }
    public string MessageText { get; set; } = string.Empty;
    public string MessageType { get; set; } = string.Empty;
    public DateTime SentAt { get; set; }

    public Guid? ReplyToMessageId { get; set; }
    public string? ReplyToUsername { get; set; }
    public string? ReplyToDisplayName { get; set; }
    public string? ReplyToPreviewText { get; set; }

    public bool IsEdited { get; set; }
    public DateTime? EditedAt { get; set; }

    public bool IsPinned { get; set; }
    public DateTime? PinnedAt { get; set; }
    public Guid? PinnedByUserId { get; set; }

    public List<ChatMessageReactionResponse> Reactions { get; set; } = new();
}

namespace Bts.Api.Models.Responses;

public sealed class DirectConversationResponse
{
    public Guid ConversationId { get; set; }
    public Guid OtherUserId { get; set; }
    public string OtherUsername { get; set; } = string.Empty;
    public string OtherDisplayName { get; set; } = string.Empty;
    public string? OtherAvatarUrl { get; set; }
    public string? OtherStatusMessage { get; set; }
    public bool OtherIsSupporter { get; set; }
    public string? OtherSupporterBadgeLabel { get; set; }
    public string? LastMessageText { get; set; }
    public DateTime? LastMessageAt { get; set; }
    public Guid? LastMessageSenderUserId { get; set; }
    public int UnreadCount { get; set; }
    public bool IsOnline { get; set; }
    public DateTime? LastSeenAt { get; set; }
}

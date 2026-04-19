namespace Bts.Api.Models.Responses;

public sealed class MentionNotificationItemResponse
{
    public Guid Id { get; set; }
    public Guid RoomId { get; set; }
    public string RoomName { get; set; } = string.Empty;
    public Guid ChatMessageId { get; set; }
    public Guid SourceUserId { get; set; }
    public string? SourceDisplayName { get; set; }
    public string? SourceUsername { get; set; }
    public string PreviewText { get; set; } = string.Empty;
    public DateTime CreatedAt { get; set; }
    public DateTime? ReadAt { get; set; }
}
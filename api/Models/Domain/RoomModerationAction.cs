namespace Bts.Api.Models.Domain;

public sealed class RoomModerationAction
{
    public Guid Id { get; set; }
    public Guid RoomId { get; set; }
    public Guid? TargetUserId { get; set; }
    public string ActionType { get; set; } = "";
    public string? Reason { get; set; }
    public Guid CreatedByUserId { get; set; }
    public DateTime CreatedAt { get; set; }
    public DateTime? ExpiresAt { get; set; }
    public string? MetadataJson { get; set; }
}
namespace Bts.Api.Models.Dtos;

public sealed class RoomModerationActionDto
{
    public Guid Id { get; set; }
    public string ActionType { get; set; } = "";
    public string? Reason { get; set; }
    public DateTime CreatedAt { get; set; }
    public DateTime? ExpiresAt { get; set; }
    public string CreatedByDisplayName { get; set; } = "";
    public string? TargetDisplayName { get; set; }
    public string? MetadataJson { get; set; }
}
namespace Bts.Api.Models.Domain;

public sealed class RoomUserMute
{
    public Guid Id { get; set; }
    public Guid RoomId { get; set; }
    public Guid UserId { get; set; }
    public string? Reason { get; set; }
    public DateTime? MutedUntil { get; set; }
    public Guid CreatedByUserId { get; set; }
    public DateTime CreatedAt { get; set; }
}
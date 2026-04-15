namespace Bts.Api.Models.Dtos;

public sealed class RoomModerationStateDto
{
    public bool IsMuted { get; set; }
    public DateTime? MutedUntil { get; set; }
    public int SlowModeSeconds { get; set; }
}
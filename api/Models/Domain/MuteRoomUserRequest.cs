namespace Bts.Api.Models.Requests;

public sealed class MuteRoomUserRequest
{
    public Guid UserId { get; set; }
    public int? DurationMinutes { get; set; }
    public string? Reason { get; set; }
}
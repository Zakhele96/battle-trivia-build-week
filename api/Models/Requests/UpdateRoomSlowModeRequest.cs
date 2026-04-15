namespace Bts.Api.Models.Requests;

public sealed class UpdateRoomSlowModeRequest
{
    public int SlowModeSeconds { get; set; }
}
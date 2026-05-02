namespace Bts.Api.Models.Requests;

public sealed class CreateAdminRoomRequest
{
    public string Name { get; set; } = string.Empty;
    public string Slug { get; set; } = string.Empty;
    public string? Description { get; set; }
    public string RoomType { get; set; } = string.Empty;
    public bool IsActive { get; set; } = true;
    public int SlowModeSeconds { get; set; }
}

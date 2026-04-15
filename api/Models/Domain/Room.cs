namespace Bts.Api.Models.Domain;

public sealed class Room
{
    public Guid Id { get; set; }
    public string Name { get; set; } = string.Empty;
    public string Slug { get; set; } = string.Empty;
    public string? Description { get; set; }
    public string RoomType { get; set; } = string.Empty;
    public bool IsActive { get; set; }
    public int SlowModeSeconds { get; set; }
    public DateTime CreatedAt { get; set; }
}
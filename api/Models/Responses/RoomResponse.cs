namespace Bts.Api.Models.Responses;

public sealed class RoomResponse
{
    public Guid Id { get; set; }
    public string Name { get; set; } = string.Empty;
    public string Slug { get; set; } = string.Empty;
    public string? Description { get; set; }
    public string RoomType { get; set; } = string.Empty;
    public int SlowModeSeconds { get; set; }
    public int UnreadMentionCount { get; set; }
}
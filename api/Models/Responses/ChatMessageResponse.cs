namespace Bts.Api.Models.Responses;

public sealed class ChatMessageResponse
{
    public Guid Id { get; set; }
    public Guid RoomId { get; set; }
    public Guid? UserId { get; set; }
    public string? Username { get; set; }
    public bool IsAdmin { get; set; }
    public string? DisplayName { get; set; }
    public string MessageText { get; set; } = string.Empty;
    public string MessageType { get; set; } = string.Empty;
    public DateTime SentAt { get; set; }
}
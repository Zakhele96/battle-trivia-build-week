namespace Bts.Api.Models.Domain;

public sealed class ChatMessage
{
    public Guid Id { get; set; }
    public Guid RoomId { get; set; }
    public Guid? UserId { get; set; }
    public string MessageText { get; set; } = string.Empty;
    public string MessageType { get; set; } = "user";
    public DateTime SentAt { get; set; }
}
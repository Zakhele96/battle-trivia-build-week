namespace Bts.Api.Models.Responses;

public sealed class ChatMessageReactionUpdateResponse
{
    public Guid MessageId { get; set; }
    public List<ChatMessageReactionResponse> Reactions { get; set; } = new();
}
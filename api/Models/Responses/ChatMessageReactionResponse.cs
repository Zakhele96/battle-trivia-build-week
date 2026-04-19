namespace Bts.Api.Models.Responses;

public sealed class ChatMessageReactionResponse
{
    public string Emoji { get; set; } = string.Empty;
    public int Count { get; set; }
    public bool ReactedByMe { get; set; }
}
namespace Bts.Api.Models.Requests;

public sealed class SubmitWordScrambleGuessRequest
{
    public Guid RoomId { get; set; }
    public string GuessText { get; set; } = string.Empty;
}
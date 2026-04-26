namespace Bts.Api.Models.Requests;

public sealed class CreateWordScrambleWordRequest
{
    public string AnswerWord { get; set; } = string.Empty;
    public string? Category { get; set; }
    public string? Hint { get; set; }
    public bool IsActive { get; set; } = true;
}

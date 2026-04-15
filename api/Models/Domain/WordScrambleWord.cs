namespace Bts.Api.Models.Domain;

public sealed class WordScrambleWord
{
    public Guid Id { get; set; }
    public string AnswerWord { get; set; } = string.Empty;
    public string NormalizedAnswer { get; set; } = string.Empty;
    public string? Category { get; set; }
    public string? Hint { get; set; }
    public bool IsActive { get; set; }
    public DateTime CreatedAt { get; set; }
}
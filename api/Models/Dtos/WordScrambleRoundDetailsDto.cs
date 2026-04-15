namespace Bts.Api.Models.Dtos;

public sealed class WordScrambleRoundDetailsDto
{
    public Guid SessionId { get; set; }
    public Guid RoundId { get; set; }
    public int RoundNumber { get; set; }
    public string AnswerWord { get; set; } = string.Empty;
    public string NormalizedAnswer { get; set; } = string.Empty;
    public string? Category { get; set; }
    public string? Hint { get; set; }
    public string InitialMask { get; set; } = string.Empty;
    public string MaskAt20s { get; set; } = string.Empty;
    public string MaskAt10s { get; set; } = string.Empty;
    public string CurrentMask { get; set; } = string.Empty;
    public string Status { get; set; } = string.Empty;
    public DateTime StartsAt { get; set; }
    public DateTime EndsAt { get; set; }
    public DateTime? RevealedAt { get; set; }
}
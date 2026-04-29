namespace Bts.Api.Models.Responses;

public sealed class WordScrambleSettingsResponse
{
    public Guid RoomId { get; set; }
    public int RoundDurationSeconds { get; set; } = 30;
    public int RevealDurationSeconds { get; set; } = 5;
}

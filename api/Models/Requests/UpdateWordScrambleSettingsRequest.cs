namespace Bts.Api.Models.Requests;

public sealed class UpdateWordScrambleSettingsRequest
{
    public int RoundDurationSeconds { get; set; } = 30;
    public int RevealDurationSeconds { get; set; } = 5;
}

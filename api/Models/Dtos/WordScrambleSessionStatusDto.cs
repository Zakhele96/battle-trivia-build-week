namespace Bts.Api.Models.Dtos;

public sealed class WordScrambleSessionStatusDto
{
    public Guid RoomId { get; set; }
    public Guid? SessionId { get; set; }

    public bool IsLiveNow { get; set; }
    public bool HasActiveRound { get; set; }

    public string RunMode { get; set; } = "continuous";
    public string StatusText { get; set; } = "Waiting for next round";

    public DateTime? CurrentWindowEnd { get; set; }
    public DateTime? NextWindowStart { get; set; }
}
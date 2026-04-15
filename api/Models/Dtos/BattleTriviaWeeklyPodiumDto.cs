namespace Bts.Api.Models.Dtos;

public sealed class BattleTriviaWeeklyPodiumDto
{
    public bool HasPodium { get; set; }
    public Guid? SessionId { get; set; }
    public DateTime? EndedAt { get; set; }
    public IReadOnlyList<TriviaSessionResultRowDto> Winners { get; set; } =
        Array.Empty<TriviaSessionResultRowDto>();
}
namespace Bts.Api.Models.Dtos;

public sealed class SquadChallengeCardDto
{
    public SquadShareCardDto ChallengerSquad { get; set; } = new();
    public SquadShareCardDto RivalSquad { get; set; } = new();
    public string Mode { get; set; } = string.Empty;
    public string Period { get; set; } = string.Empty;
    public string Label { get; set; } = string.Empty;
}

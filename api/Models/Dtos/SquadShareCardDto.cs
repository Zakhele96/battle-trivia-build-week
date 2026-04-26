namespace Bts.Api.Models.Dtos;

public sealed class SquadShareCardDto
{
    public Guid SquadId { get; set; }
    public string SquadName { get; set; } = string.Empty;
    public string InviteCode { get; set; } = string.Empty;
    public string Mode { get; set; } = string.Empty;
    public string Period { get; set; } = string.Empty;
    public string Label { get; set; } = string.Empty;
    public int MemberCount { get; set; }
    public IReadOnlyList<SquadMemberDto> Members { get; set; } = Array.Empty<SquadMemberDto>();
    public IReadOnlyList<GameLeaderboardRowDto> LeaderboardRows { get; set; } = Array.Empty<GameLeaderboardRowDto>();
}

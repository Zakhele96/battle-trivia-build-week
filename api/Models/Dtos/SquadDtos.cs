namespace Bts.Api.Models.Dtos;

public sealed class SquadMemberDto
{
    public Guid UserId { get; set; }
    public string Username { get; set; } = string.Empty;
    public string DisplayName { get; set; } = string.Empty;
    public DateTime JoinedAt { get; set; }
    public bool IsOwner { get; set; }
}

public sealed class SquadSummaryDto
{
    public Guid Id { get; set; }
    public string Name { get; set; } = string.Empty;
    public string InviteCode { get; set; } = string.Empty;
    public Guid CreatedByUserId { get; set; }
    public int MemberCount { get; set; }
    public DateTime CreatedAt { get; set; }
}

public sealed class SquadDetailDto
{
    public Guid Id { get; set; }
    public string Name { get; set; } = string.Empty;
    public string InviteCode { get; set; } = string.Empty;
    public Guid CreatedByUserId { get; set; }
    public int MemberCount { get; set; }
    public DateTime CreatedAt { get; set; }
    public IReadOnlyList<SquadMemberDto> Members { get; set; } = Array.Empty<SquadMemberDto>();
    public IReadOnlyList<GameLeaderboardRowDto> LeaderboardRows { get; set; } = Array.Empty<GameLeaderboardRowDto>();
    public string LeaderboardMode { get; set; } = string.Empty;
    public string LeaderboardPeriod { get; set; } = string.Empty;
    public string LeaderboardLabel { get; set; } = string.Empty;
    public int OverallRank { get; set; }
    public int OverallScore { get; set; }
    public int PointsBehindLeader { get; set; }
    public int PointsToNextRank { get; set; }
}

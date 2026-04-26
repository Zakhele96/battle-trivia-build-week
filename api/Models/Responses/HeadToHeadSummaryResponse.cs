namespace Bts.Api.Models.Responses;

public sealed class HeadToHeadRecordResponse
{
    public int Matches { get; set; }
    public int Wins { get; set; }
    public int Losses { get; set; }
    public int Ties { get; set; }
}

public sealed class HeadToHeadSummaryResponse
{
    public Guid OpponentUserId { get; set; }
    public string OpponentUsername { get; set; } = string.Empty;
    public string OpponentDisplayName { get; set; } = string.Empty;
    public HeadToHeadRecordResponse Overall { get; set; } = new();
    public HeadToHeadRecordResponse BattleTrivia { get; set; } = new();
    public HeadToHeadRecordResponse WordScramble { get; set; } = new();
    public string CurrentBoardEdge { get; set; } = string.Empty;
    public string PreviousBoardEdge { get; set; } = string.Empty;
}

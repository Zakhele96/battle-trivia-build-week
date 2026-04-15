namespace Bts.Api.Repositories;

public interface IProfileProgressionRepository
{
    Task<ProfileProgressionSnapshot> GetSnapshotAsync(Guid userId);
}

public sealed class ProfileProgressionSnapshot
{
    public int TotalCorrectAnswers { get; set; }
    public int BestStreak { get; set; }
    public int WeeklyWins { get; set; }
    public int? FastestCorrectAnswerMs { get; set; }
    public int SessionsPlayed { get; set; }
    public int? BestRank { get; set; }
}
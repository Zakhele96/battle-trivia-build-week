namespace Bts.Api.Repositories;

public interface IBattleTriviaProfileStatsRepository
{
    Task<int> GetTotalCorrectAnswersAsync(Guid userId);
    Task<int> GetBestStreakAsync(Guid userId);
    Task<int> GetWeeklyWinsAsync(Guid userId);
    Task<int?> GetFastestCorrectAnswerMsAsync(Guid userId);
    Task<int?> GetCurrentWeeklyRankAsync(Guid sessionId, Guid userId);
}
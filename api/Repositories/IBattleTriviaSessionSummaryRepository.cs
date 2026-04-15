namespace Bts.Api.Repositories;

public interface IBattleTriviaSessionSummaryRepository
{
    Task<int> GetCorrectCountAsync(Guid sessionId, Guid userId);
    Task<int> GetBestStreakAsync(Guid sessionId, Guid userId);
    Task<int?> GetFastestCorrectAnswerMsAsync(Guid sessionId, Guid userId);
}
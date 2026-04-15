using Bts.Api.Models.Domain;
using Bts.Api.Models.Responses;

namespace Bts.Api.Repositories;

public interface IAchievementRepository
{
    Task<IReadOnlyList<AchievementDefinition>> GetActiveDefinitionsAsync();
    Task<IReadOnlyList<string>> GetEarnedCodesAsync(Guid userId);
    Task AddUserAchievementAsync(UserAchievement achievement);
    Task<UserProgress?> GetUserProgressAsync(Guid userId);
    Task UpsertUserProgressAsync(UserProgress progress);
    Task<IReadOnlyList<ProfileAchievementResponse>> GetRecentAchievementsAsync(Guid userId, int take = 6);
}
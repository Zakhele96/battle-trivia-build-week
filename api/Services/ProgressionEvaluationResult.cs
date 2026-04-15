using Bts.Api.Models.Responses;

namespace Bts.Api.Services;

public sealed class ProgressionEvaluationResult
{
    public ProfileProgressionResponse Progression { get; set; } = new();
    public IReadOnlyList<ProfileAchievementResponse> NewlyUnlockedAchievements { get; set; } =
        Array.Empty<ProfileAchievementResponse>();
}
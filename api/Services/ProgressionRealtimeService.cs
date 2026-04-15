using Bts.Api.Hubs;
using Microsoft.AspNetCore.SignalR;

namespace Bts.Api.Services;

public sealed class ProgressionRealtimeService
{
    private readonly IHubContext<ChatHub> _hubContext;

    public ProgressionRealtimeService(IHubContext<ChatHub> hubContext)
    {
        _hubContext = hubContext;
    }

    public async Task NotifyAsync(Guid userId, ProgressionEvaluationResult result)
    {
        if (result.NewlyUnlockedAchievements.Count == 0)
            return;

        await _hubContext.Clients.User(userId.ToString())
            .SendAsync("AchievementsUnlocked", new
            {
                progression = result.Progression,
                achievements = result.NewlyUnlockedAchievements
            });
    }
}
using Bts.Api.Models.Responses;
using Bts.Api.Repositories;

namespace Bts.Api.Services;

public sealed class LeaderboardSponsorService
{
    private static readonly HashSet<string> SupportedModes = new(StringComparer.OrdinalIgnoreCase)
    {
        "combined",
        "battle-trivia",
        "word-scramble"
    };

    private readonly ILeaderboardSponsorRepository _leaderboardSponsorRepository;

    public LeaderboardSponsorService(ILeaderboardSponsorRepository leaderboardSponsorRepository)
    {
        _leaderboardSponsorRepository = leaderboardSponsorRepository;
    }

    public async Task<LeaderboardSponsorResponse?> GetActiveAsync(string mode)
    {
        var normalizedMode = NormalizeMode(mode);
        var sponsor = await _leaderboardSponsorRepository.GetActiveAsync(
            normalizedMode,
            DateTime.UtcNow);

        return sponsor?.ToResponse();
    }

    public static string NormalizeMode(string mode)
    {
        var normalizedMode = (mode ?? string.Empty).Trim().ToLowerInvariant();
        if (!SupportedModes.Contains(normalizedMode))
        {
            throw new InvalidOperationException("Unsupported sponsor mode.");
        }

        return normalizedMode;
    }
}

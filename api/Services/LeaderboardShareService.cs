using Bts.Api.Models.Dtos;
using Bts.Api.Repositories;

namespace Bts.Api.Services;

public sealed class LeaderboardShareService
{
    private readonly GameLeaderboardService _gameLeaderboardService;
    private readonly ILeaderboardSponsorRepository _leaderboardSponsorRepository;
    private readonly IUserRepository _userRepository;

    public LeaderboardShareService(
        GameLeaderboardService gameLeaderboardService,
        ILeaderboardSponsorRepository leaderboardSponsorRepository,
        IUserRepository userRepository)
    {
        _gameLeaderboardService = gameLeaderboardService;
        _leaderboardSponsorRepository = leaderboardSponsorRepository;
        _userRepository = userRepository;
    }

    public async Task<LeaderboardShareCardDto> GetAsync(string mode, string period, Guid userId)
    {
        var normalizedMode = LeaderboardSponsorService.NormalizeMode(mode);
        var normalizedPeriod = (period ?? "current").Trim().ToLowerInvariant();
        if (normalizedPeriod is not ("current" or "previous"))
            throw new InvalidOperationException("Unsupported leaderboard period.");

        var leaderboard = await _gameLeaderboardService.GetAsync(normalizedMode, normalizedPeriod, 12);
        var user = await _userRepository.GetByIdAsync(userId)
            ?? throw new KeyNotFoundException("User not found.");

        var row = leaderboard.Rows.FirstOrDefault(x => x.UserId == userId);
        var sponsor = normalizedPeriod == "current"
            ? await _leaderboardSponsorRepository.GetActiveAsync(normalizedMode, DateTime.UtcNow)
            : null;

        return new LeaderboardShareCardDto
        {
            Mode = normalizedMode,
            Period = normalizedPeriod,
            Label = leaderboard.Label,
            SharerName = string.IsNullOrWhiteSpace(user.DisplayName) ? user.Username : user.DisplayName,
            SharerUsername = user.Username,
            SharerUserId = user.Id,
            Rank = row?.Rank,
            Score = row?.Score,
            BattleTriviaScore = row?.BattleTriviaScore ?? 0,
            WordScrambleScore = row?.WordScrambleScore ?? 0,
            EndedAt = leaderboard.EndedAt,
            IsCurrentWeek = normalizedPeriod == "current",
            Rows = leaderboard.Rows.Take(8).ToList(),
            Sponsor = sponsor
        };
    }

    public async Task<LeaderboardChallengeCardDto> GetChallengeAsync(
        string mode,
        string period,
        Guid challengerUserId,
        Guid rivalUserId)
    {
        var normalizedMode = LeaderboardSponsorService.NormalizeMode(mode);
        var normalizedPeriod = (period ?? "current").Trim().ToLowerInvariant();
        if (normalizedPeriod is not ("current" or "previous"))
            throw new InvalidOperationException("Unsupported leaderboard period.");

        var leaderboard = await _gameLeaderboardService.GetAsync(normalizedMode, normalizedPeriod, 30);
        var challenger = await _userRepository.GetByIdAsync(challengerUserId)
            ?? throw new KeyNotFoundException("Challenger not found.");
        var rival = await _userRepository.GetByIdAsync(rivalUserId)
            ?? throw new KeyNotFoundException("Rival not found.");

        var challengerRow = leaderboard.Rows.FirstOrDefault(x => x.UserId == challengerUserId);
        var rivalRow = leaderboard.Rows.FirstOrDefault(x => x.UserId == rivalUserId);
        if (challengerRow is null || rivalRow is null)
            throw new InvalidOperationException("Both players need an active position on this leaderboard.");

        var sponsor = normalizedPeriod == "current"
            ? await _leaderboardSponsorRepository.GetActiveAsync(normalizedMode, DateTime.UtcNow)
            : null;

        var highlightRows = leaderboard.Rows
            .Where(x => x.UserId == challengerUserId || x.UserId == rivalUserId || x.Rank <= 5)
            .DistinctBy(x => x.UserId)
            .OrderBy(x => x.Rank)
            .Take(8)
            .ToList();

        return new LeaderboardChallengeCardDto
        {
            Mode = normalizedMode,
            Period = normalizedPeriod,
            Label = leaderboard.Label,
            IsCurrentWeek = normalizedPeriod == "current",
            EndedAt = leaderboard.EndedAt,
            ChallengerUserId = challenger.Id,
            ChallengerName = string.IsNullOrWhiteSpace(challenger.DisplayName)
                ? challenger.Username
                : challenger.DisplayName,
            ChallengerUsername = challenger.Username,
            ChallengerRow = challengerRow,
            RivalUserId = rival.Id,
            RivalName = string.IsNullOrWhiteSpace(rival.DisplayName)
                ? rival.Username
                : rival.DisplayName,
            RivalUsername = rival.Username,
            RivalRow = rivalRow,
            Rows = highlightRows,
            Sponsor = sponsor
        };
    }
}

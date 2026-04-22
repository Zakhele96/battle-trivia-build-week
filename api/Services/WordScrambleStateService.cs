using Bts.Api.Models.Dtos;
using Bts.Api.Repositories;

namespace Bts.Api.Services;

public sealed class WordScrambleStateService
{
    private readonly IWordScrambleSessionRepository _sessionRepository;
    private readonly IWordScrambleRoundRepository _roundRepository;
    private readonly IWordScrambleAnswerRepository _answerRepository;
    private readonly IWordScrambleLeaderboardRepository _leaderboardRepository;

    public WordScrambleStateService(
        IWordScrambleSessionRepository sessionRepository,
        IWordScrambleRoundRepository roundRepository,
        IWordScrambleAnswerRepository answerRepository,
        IWordScrambleLeaderboardRepository leaderboardRepository)
    {
        _sessionRepository = sessionRepository;
        _roundRepository = roundRepository;
        _answerRepository = answerRepository;
        _leaderboardRepository = leaderboardRepository;
    }

    public async Task<WordScrambleStateDto> GetRoomStateAsync(Guid roomId, Guid? userId = null)
    {
        var session = await _sessionRepository.GetActiveByRoomIdAsync(roomId);
        if (session is null)
        {
            return new WordScrambleStateDto
            {
                Phase = "waiting"
            };
        }

        var latestRound = await _roundRepository.GetLatestBySessionIdAsync(session.Id);
        if (latestRound is null)
        {
            return new WordScrambleStateDto
            {
                SessionId = session.Id,
                Phase = "waiting"
            };
        }

        var nowUtc = DateTime.UtcNow;

        var phase = latestRound.Status switch
        {
            "active" => "active",
            "revealed" => "reveal",
            _ => "waiting"
        };

        var endsAtUtc = latestRound.EndsAt.Kind switch
        {
            DateTimeKind.Utc => latestRound.EndsAt,
            DateTimeKind.Local => latestRound.EndsAt.ToUniversalTime(),
            _ => DateTime.SpecifyKind(latestRound.EndsAt, DateTimeKind.Utc)
        };

        var timeLeft = latestRound.Status == "active"
            ? Math.Max(0, (int)Math.Ceiling((endsAtUtc - nowUtc).TotalSeconds))
            : 0;

        var winners = latestRound.Status is "active" or "revealed"
            ? await _answerRepository.GetRoundWinnersAsync(latestRound.Id, 5)
            : Array.Empty<WordScrambleLeaderboardRowDto>();

        var leaderboard = await _leaderboardRepository.GetSessionLeaderboardAsync(session.Id, 10);
        var playerStats = userId.HasValue
            ? await _answerRepository.GetPlayerStatsAsync(session.Id, userId.Value)
            : null;

        return new WordScrambleStateDto
        {
            SessionId = session.Id,
            RoundId = latestRound.Id,
            RoundNumber = latestRound.RoundNumber,
            Phase = phase,
            MaskedWord = latestRound.Status == "revealed"
                ? latestRound.AnswerWord
                : latestRound.CurrentMask,
            AnswerWord = latestRound.Status == "revealed"
                ? latestRound.AnswerWord
                : null,
            Category = latestRound.Category,
            Hint = latestRound.Hint,
            StartsAt = latestRound.StartsAt,
            EndsAt = latestRound.EndsAt,
            TimeLeft = timeLeft,
            PlayerStats = playerStats,
            Winners = winners,
            Leaderboard = leaderboard
        };
    }
}

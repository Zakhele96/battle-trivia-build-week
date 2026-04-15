using Bts.Api.Models.Dtos;
using Bts.Api.Repositories;

namespace Bts.Api.Services;

public sealed class TriviaLeaderboardService
{
    private readonly ITriviaLeaderboardRepository _triviaLeaderboardRepository;
    private readonly ITriviaSessionRepository _triviaSessionRepository;


    public TriviaLeaderboardService(
        ITriviaLeaderboardRepository triviaLeaderboardRepository,
        ITriviaSessionRepository triviaSessionRepository)
    {
        _triviaLeaderboardRepository = triviaLeaderboardRepository;
        _triviaSessionRepository = triviaSessionRepository;
    }

    public async Task<IReadOnlyList<TriviaLeaderboardEntryDto>> GetSessionLeaderboardAsync(
        Guid sessionId,
        int take = 5)
    {
        var rows = await _triviaLeaderboardRepository.GetSessionLeaderboardAsync(sessionId, take);
        return rows.ToList();
    }

    public async Task<IReadOnlyList<TriviaLeaderboardEntryDto>> GetActiveRoomLeaderboardAsync(
        Guid roomId,
        int take = 5)
    {
        var session = await _triviaSessionRepository.GetActiveByRoomIdAsync(roomId);
        if (session is null)
            return Array.Empty<TriviaLeaderboardEntryDto>();

        var rows = await _triviaLeaderboardRepository.GetSessionLeaderboardAsync(session.Id, take);
        return rows.ToList();
    }

    public async Task<TriviaPlayerRankDto?> GetPlayerRankAsync(Guid sessionId, Guid userId)
    {
        return await _triviaLeaderboardRepository.GetPlayerRankAsync(sessionId, userId);
    }

    public async Task<TriviaPlayerRankDto?> GetActiveRoomPlayerRankAsync(Guid roomId, Guid userId)
    {
        var session = await _triviaSessionRepository.GetActiveByRoomIdAsync(roomId);
        if (session is null)
            return null;

        return await _triviaLeaderboardRepository.GetPlayerRankAsync(session.Id, userId);
    }
}
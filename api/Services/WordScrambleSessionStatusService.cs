using Bts.Api.Models.Dtos;
using Bts.Api.Repositories;

namespace Bts.Api.Services;

public sealed class WordScrambleSessionStatusService
{
    private readonly IWordScrambleSessionRepository _sessionRepository;
    private readonly IWordScrambleRoundRepository _roundRepository;

    public WordScrambleSessionStatusService(
        IWordScrambleSessionRepository sessionRepository,
        IWordScrambleRoundRepository roundRepository)
    {
        _sessionRepository = sessionRepository;
        _roundRepository = roundRepository;
    }

    public async Task<WordScrambleSessionStatusDto> GetRoomStatusAsync(Guid roomId)
    {
        var session = await _sessionRepository.GetActiveByRoomIdAsync(roomId);
        if (session is null)
        {
            return new WordScrambleSessionStatusDto
            {
                RoomId = roomId,
                IsLiveNow = false,
                HasActiveRound = false,
                StatusText = "Waiting for next round",
                RunMode = "continuous"
            };
        }

        var latestRound = await _roundRepository.GetLatestBySessionIdAsync(session.Id);
        var hasActiveRound = latestRound is not null &&
                             string.Equals(latestRound.Status, "active", StringComparison.OrdinalIgnoreCase);

        var statusText = latestRound?.Status switch
        {
            "active" => "Word scramble round is live",
            "revealed" => "Answer revealed",
            _ => "Waiting for next round"
        };

        DateTime? nextWindowStart = latestRound?.Status == "revealed" && latestRound.RevealedAt.HasValue
            ? latestRound.RevealedAt.Value.AddSeconds(5)
            : null;

        return new WordScrambleSessionStatusDto
        {
            RoomId = roomId,
            SessionId = session.Id,
            IsLiveNow = true,
            HasActiveRound = hasActiveRound,
            RunMode = session.RunMode,
            StatusText = statusText,
            CurrentWindowEnd = hasActiveRound ? latestRound?.EndsAt : null,
            NextWindowStart = nextWindowStart
        };
    }
}
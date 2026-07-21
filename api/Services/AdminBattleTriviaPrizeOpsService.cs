using Bts.Api.Models.Domain;
using Bts.Api.Models.Requests;
using Bts.Api.Models.Responses;
using Bts.Api.Repositories;

namespace Bts.Api.Services;

public sealed class AdminBattleTriviaPrizeOpsService
{
    private static readonly HashSet<string> AllowedStatuses = new(StringComparer.OrdinalIgnoreCase)
    {
        "pending",
        "processing",
        "paid",
        "cancelled"
    };

    private readonly IRoomRepository _roomRepository;
    private readonly ITriviaSessionRepository _triviaSessionRepository;
    private readonly ITriviaSessionResultRepository _triviaSessionResultRepository;
    private readonly IBattleTriviaPrizePayoutRepository _prizePayoutRepository;

    public AdminBattleTriviaPrizeOpsService(
        IRoomRepository roomRepository,
        ITriviaSessionRepository triviaSessionRepository,
        ITriviaSessionResultRepository triviaSessionResultRepository,
        IBattleTriviaPrizePayoutRepository prizePayoutRepository)
    {
        _roomRepository = roomRepository;
        _triviaSessionRepository = triviaSessionRepository;
        _triviaSessionResultRepository = triviaSessionResultRepository;
        _prizePayoutRepository = prizePayoutRepository;
    }

    public async Task<IReadOnlyList<AdminBattleTriviaPrizeSessionResponse>> GetRecentAsync(int takeSessions = 6)
    {
        var room = await _roomRepository.GetBySlugAsync("battle-trivia");
        if (room is null)
        {
            return Array.Empty<AdminBattleTriviaPrizeSessionResponse>();
        }

        var sessions = await _triviaSessionRepository.GetRecentEndedByRoomIdAsync(room.Id, takeSessions);
        var payouts = await _prizePayoutRepository.GetBySessionIdsAsync(sessions.Select(session => session.Id));
        var payoutLookup = payouts.ToDictionary(
            item => (item.SessionId, item.UserId),
            item => item);

        var result = new List<AdminBattleTriviaPrizeSessionResponse>();
        foreach (var session in sessions)
        {
            var winners = await _triviaSessionResultRepository.GetBySessionIdAsync(session.Id, 3);
            result.Add(new AdminBattleTriviaPrizeSessionResponse
            {
                SessionId = session.Id,
                EndedAt = session.EndedAt,
                PeriodStart = session.PeriodStart,
                PeriodEnd = session.PeriodEnd,
                Winners = winners.Select(winner =>
                {
                    payoutLookup.TryGetValue((session.Id, winner.UserId), out var payout);
                    return new AdminBattleTriviaPrizePayoutResponse
                    {
                        UserId = winner.UserId,
                        Username = winner.Username,
                        DisplayName = winner.DisplayName,
                        AvatarUrl = winner.AvatarUrl,
                        IsSupporter = winner.IsSupporter,
                        SupporterBadgeLabel = winner.SupporterBadgeLabel,
                        Rank = winner.Rank,
                        Score = winner.Score,
                        Amount = payout?.Amount ?? 0,
                        Status = payout?.Status ?? "pending",
                        Reference = payout?.Reference,
                        Notes = payout?.Notes,
                        PaidAt = payout?.PaidAt
                    };
                }).ToList()
            });
        }

        return result;
    }

    public async Task<AdminBattleTriviaPrizePayoutResponse> UpdateAsync(
        Guid sessionId,
        Guid userId,
        UpdateBattleTriviaPrizePayoutRequest request)
    {
        var winners = await _triviaSessionResultRepository.GetBySessionIdAsync(sessionId, 3);
        var winner = winners.FirstOrDefault(item => item.UserId == userId);
        if (winner is null)
        {
            throw new KeyNotFoundException("Winner not found for that session.");
        }

        var normalizedStatus = NormalizeStatus(request.Status);
        var nowUtc = DateTime.UtcNow;
        var existing = await _prizePayoutRepository.GetBySessionAndUserAsync(sessionId, userId);

        var payout = existing ?? new BattleTriviaPrizePayout
        {
            Id = Guid.NewGuid(),
            SessionId = sessionId,
            UserId = userId,
            CreatedAt = nowUtc
        };

        payout.Rank = winner.Rank;
        payout.Amount = Math.Max(0, request.Amount);
        payout.Status = normalizedStatus;
        payout.Reference = string.IsNullOrWhiteSpace(request.Reference) ? null : request.Reference.Trim();
        payout.Notes = string.IsNullOrWhiteSpace(request.Notes) ? null : request.Notes.Trim();
        payout.PaidAt = normalizedStatus == "paid"
            ? request.PaidAt ?? existing?.PaidAt ?? nowUtc
            : request.PaidAt;
        payout.UpdatedAt = nowUtc;

        await _prizePayoutRepository.UpsertAsync(payout);

        return new AdminBattleTriviaPrizePayoutResponse
        {
            UserId = winner.UserId,
            Username = winner.Username,
            DisplayName = winner.DisplayName,
            AvatarUrl = winner.AvatarUrl,
            IsSupporter = winner.IsSupporter,
            SupporterBadgeLabel = winner.SupporterBadgeLabel,
            Rank = winner.Rank,
            Score = winner.Score,
            Amount = payout.Amount,
            Status = payout.Status,
            Reference = payout.Reference,
            Notes = payout.Notes,
            PaidAt = payout.PaidAt
        };
    }

    private static string NormalizeStatus(string? status)
    {
        var normalized = (status ?? "pending").Trim().ToLowerInvariant();
        if (!AllowedStatuses.Contains(normalized))
        {
            throw new InvalidOperationException("Unsupported payout status.");
        }

        return normalized;
    }
}

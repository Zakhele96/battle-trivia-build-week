using Bts.Api.Models.Domain;
using Bts.Api.Models.Requests;
using Bts.Api.Models.Responses;
using Bts.Api.Repositories;

namespace Bts.Api.Services;

public sealed class ChallengeInviteService
{
    private readonly IChallengeInviteRepository _challengeInviteRepository;
    private readonly IUserRepository _userRepository;

    public ChallengeInviteService(
        IChallengeInviteRepository challengeInviteRepository,
        IUserRepository userRepository)
    {
        _challengeInviteRepository = challengeInviteRepository;
        _userRepository = userRepository;
    }

    public async Task<ChallengeInviteResponse> CreateAsync(Guid challengerUserId, CreateChallengeInviteRequest request)
    {
        if (request.RivalUserId == Guid.Empty)
            throw new InvalidOperationException("Choose a player to challenge.");

        if (request.RivalUserId == challengerUserId)
            throw new InvalidOperationException("You cannot challenge yourself.");

        var challenger = await _userRepository.GetByIdAsync(challengerUserId)
            ?? throw new InvalidOperationException("Challenger account not found.");
        var rival = await _userRepository.GetByIdAsync(request.RivalUserId)
            ?? throw new InvalidOperationException("Rival account not found.");

        var mode = NormalizeMode(request.Mode);
        var period = NormalizePeriod(request.Period);

        var existing = await _challengeInviteRepository.GetPendingAsync(
            challengerUserId,
            request.RivalUserId,
            mode,
            period);

        if (existing is not null)
        {
            return new ChallengeInviteResponse
            {
                Id = existing.Id,
                ChallengerUserId = challenger.Id,
                ChallengerName = string.IsNullOrWhiteSpace(challenger.DisplayName) ? challenger.Username : challenger.DisplayName,
                ChallengerUsername = challenger.Username,
                RivalUserId = existing.RivalUserId,
                Mode = existing.Mode,
                Period = existing.Period,
                Status = existing.Status,
                CreatedAt = existing.CreatedAt,
                RespondedAt = existing.RespondedAt
            };
        }

        var invite = new ChallengeInvite
        {
            Id = Guid.NewGuid(),
            ChallengerUserId = challengerUserId,
            RivalUserId = request.RivalUserId,
            Mode = mode,
            Period = period,
            Status = "pending",
            CreatedAt = DateTime.UtcNow
        };

        await _challengeInviteRepository.CreateAsync(invite);

        return new ChallengeInviteResponse
        {
            Id = invite.Id,
            ChallengerUserId = challenger.Id,
            ChallengerName = string.IsNullOrWhiteSpace(challenger.DisplayName) ? challenger.Username : challenger.DisplayName,
            ChallengerUsername = challenger.Username,
            RivalUserId = rival.Id,
            Mode = invite.Mode,
            Period = invite.Period,
            Status = invite.Status,
            CreatedAt = invite.CreatedAt
        };
    }

    public Task<IReadOnlyList<ChallengeInviteResponse>> GetMineAsync(Guid rivalUserId)
    {
        return _challengeInviteRepository.GetForRivalAsync(rivalUserId);
    }

    public async Task<ChallengeInviteResponse> AcceptAsync(Guid inviteId, Guid rivalUserId)
    {
        var invite = await _challengeInviteRepository.GetByIdAsync(inviteId)
            ?? throw new InvalidOperationException("Challenge invite not found.");

        if (invite.RivalUserId != rivalUserId)
            throw new UnauthorizedAccessException("You cannot accept this challenge.");

        if (!string.Equals(invite.Status, "pending", StringComparison.OrdinalIgnoreCase))
            throw new InvalidOperationException("This challenge has already been handled.");

        var respondedAtUtc = DateTime.UtcNow;
        await _challengeInviteRepository.UpdateStatusAsync(inviteId, "accepted", respondedAtUtc);

        var challenger = await _userRepository.GetByIdAsync(invite.ChallengerUserId)
            ?? throw new InvalidOperationException("Challenger account not found.");

        return new ChallengeInviteResponse
        {
            Id = invite.Id,
            ChallengerUserId = invite.ChallengerUserId,
            ChallengerName = string.IsNullOrWhiteSpace(challenger.DisplayName) ? challenger.Username : challenger.DisplayName,
            ChallengerUsername = challenger.Username,
            RivalUserId = invite.RivalUserId,
            Mode = invite.Mode,
            Period = invite.Period,
            Status = "accepted",
            CreatedAt = invite.CreatedAt,
            RespondedAt = respondedAtUtc
        };
    }

    private static string NormalizeMode(string? mode)
    {
        var normalized = mode?.Trim().ToLowerInvariant();
        return normalized is "combined" or "battle-trivia" or "word-scramble"
            ? normalized
            : "combined";
    }

    private static string NormalizePeriod(string? period)
    {
        var normalized = period?.Trim().ToLowerInvariant();
        return normalized is "current" or "previous" ? normalized : "current";
    }
}

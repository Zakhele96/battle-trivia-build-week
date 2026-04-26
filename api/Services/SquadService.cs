using Bts.Api.Models.Domain;
using Bts.Api.Models.Dtos;
using Bts.Api.Models.Requests;
using Bts.Api.Repositories;

namespace Bts.Api.Services;

public sealed class SquadService
{
    private readonly ISquadRepository _squadRepository;
    private readonly IUserRepository _userRepository;
    private readonly GameLeaderboardService _gameLeaderboardService;

    public SquadService(
        ISquadRepository squadRepository,
        IUserRepository userRepository,
        GameLeaderboardService gameLeaderboardService)
    {
        _squadRepository = squadRepository;
        _userRepository = userRepository;
        _gameLeaderboardService = gameLeaderboardService;
    }

    public async Task<IReadOnlyList<SquadSummaryDto>> GetMineAsync(Guid userId)
    {
        return await _squadRepository.GetForUserAsync(userId);
    }

    public async Task<SquadDetailDto> CreateAsync(Guid userId, CreateSquadRequest request)
    {
        var name = request.Name?.Trim() ?? string.Empty;
        if (string.IsNullOrWhiteSpace(name))
            throw new InvalidOperationException("Squad name is required.");
        if (name.Length > 80)
            throw new InvalidOperationException("Squad name is too long.");

        var user = await _userRepository.GetByIdAsync(userId);
        if (user is null || !user.IsActive)
            throw new InvalidOperationException("User not found.");

        var squad = new Squad
        {
            Id = Guid.NewGuid(),
            Name = name,
            InviteCode = await BuildUniqueInviteCodeAsync(),
            CreatedByUserId = userId,
            IsActive = true,
            CreatedAt = DateTime.UtcNow,
            UpdatedAt = DateTime.UtcNow
        };

        await _squadRepository.CreateAsync(squad);
        await _squadRepository.AddMemberAsync(squad.Id, userId, true);
        return await GetDetailAsync(userId, squad.Id, "combined", "current");
    }

    public async Task<SquadDetailDto> JoinAsync(Guid userId, JoinSquadRequest request)
    {
        var inviteCode = request.InviteCode?.Trim().ToUpperInvariant() ?? string.Empty;
        if (string.IsNullOrWhiteSpace(inviteCode))
            throw new InvalidOperationException("Invite code is required.");

        var squad = await _squadRepository.GetByInviteCodeAsync(inviteCode)
            ?? throw new InvalidOperationException("Squad invite code was not found.");

        await _squadRepository.AddMemberAsync(squad.Id, userId, false);
        return await GetDetailAsync(userId, squad.Id, "combined", "current");
    }

    public async Task<SquadDetailDto> GetDetailAsync(
        Guid userId,
        Guid squadId,
        string mode = "combined",
        string period = "current")
    {
        var squad = await _squadRepository.GetByIdAsync(squadId)
            ?? throw new KeyNotFoundException("Squad not found.");

        var isMember = await _squadRepository.IsMemberAsync(squadId, userId);
        if (!isMember)
            throw new UnauthorizedAccessException("You are not a member of this squad.");

        var members = await _squadRepository.GetMembersAsync(squadId);
        var leaderboard = await _gameLeaderboardService.GetAsync(mode, period, 200);
        var memberIds = members.Select(x => x.UserId).ToHashSet();
        var filteredRows = leaderboard.Rows
            .Where(x => memberIds.Contains(x.UserId))
            .OrderByDescending(x => x.Score)
            .ThenBy(x => x.DisplayName)
            .ThenBy(x => x.Username)
            .ToList();

        for (var i = 0; i < filteredRows.Count; i++)
        {
            filteredRows[i].Rank = i + 1;
        }

        var standings = await BuildSquadStandingsAsync(leaderboard);
        var currentStanding = standings.FirstOrDefault(x => x.SquadId == squadId);
        var leaderScore = standings.FirstOrDefault()?.Score ?? 0;
        var nextHigherScore = standings
            .Where(x => x.Rank < (currentStanding?.Rank ?? int.MaxValue))
            .OrderByDescending(x => x.Rank)
            .Select(x => x.Score)
            .FirstOrDefault();

        return new SquadDetailDto
        {
            Id = squad.Id,
            Name = squad.Name,
            InviteCode = squad.InviteCode,
            CreatedByUserId = squad.CreatedByUserId,
            MemberCount = members.Count,
            CreatedAt = squad.CreatedAt,
            Members = members,
            LeaderboardRows = filteredRows,
            LeaderboardMode = leaderboard.Mode,
            LeaderboardPeriod = leaderboard.Period,
            LeaderboardLabel = leaderboard.Label,
            OverallRank = currentStanding?.Rank ?? 0,
            OverallScore = currentStanding?.Score ?? 0,
            PointsBehindLeader = Math.Max(0, leaderScore - (currentStanding?.Score ?? 0)),
            PointsToNextRank = currentStanding is null || currentStanding.Rank <= 1
                ? 0
                : Math.Max(0, nextHigherScore - currentStanding.Score + 1)
        };
    }

    public async Task<SquadShareCardDto> GetShareCardAsync(
        string inviteCode,
        string mode = "combined",
        string period = "current")
    {
        var normalizedCode = inviteCode?.Trim().ToUpperInvariant() ?? string.Empty;
        if (string.IsNullOrWhiteSpace(normalizedCode))
            throw new InvalidOperationException("Invite code is required.");

        var squad = await _squadRepository.GetByInviteCodeAsync(normalizedCode)
            ?? throw new KeyNotFoundException("Squad not found.");
        return await BuildShareCardAsync(squad, mode, period);
    }

    public async Task<SquadChallengeCardDto> GetChallengeCardAsync(
        string challengerInviteCode,
        string rivalInviteCode,
        string mode = "combined",
        string period = "current")
    {
        var normalizedChallengerCode = challengerInviteCode?.Trim().ToUpperInvariant() ?? string.Empty;
        var normalizedRivalCode = rivalInviteCode?.Trim().ToUpperInvariant() ?? string.Empty;
        if (string.IsNullOrWhiteSpace(normalizedChallengerCode))
            throw new InvalidOperationException("Challenger squad code is required.");
        if (string.IsNullOrWhiteSpace(normalizedRivalCode))
            throw new InvalidOperationException("Rival squad code is required.");
        if (string.Equals(normalizedChallengerCode, normalizedRivalCode, StringComparison.OrdinalIgnoreCase))
            throw new InvalidOperationException("Choose two different squads for a squad challenge.");

        var challengerSquad = await _squadRepository.GetByInviteCodeAsync(normalizedChallengerCode)
            ?? throw new KeyNotFoundException("Challenger squad not found.");
        var rivalSquad = await _squadRepository.GetByInviteCodeAsync(normalizedRivalCode)
            ?? throw new KeyNotFoundException("Rival squad not found.");

        var challenger = await BuildShareCardAsync(challengerSquad, mode, period);
        var rival = await BuildShareCardAsync(rivalSquad, mode, period);

        return new SquadChallengeCardDto
        {
            ChallengerSquad = challenger,
            RivalSquad = rival,
            Mode = challenger.Mode,
            Period = challenger.Period,
            Label = challenger.Label
        };
    }

    private async Task<SquadShareCardDto> BuildShareCardAsync(
        Squad squad,
        string mode,
        string period)
    {
        var leaderboard = await _gameLeaderboardService.GetAsync(mode, period, 200);

        var members = await _squadRepository.GetMembersAsync(squad.Id);
        var memberIds = members.Select(x => x.UserId).ToHashSet();
        var filteredRows = leaderboard.Rows
            .Where(x => memberIds.Contains(x.UserId))
            .OrderByDescending(x => x.Score)
            .ThenBy(x => x.DisplayName)
            .ThenBy(x => x.Username)
            .ToList();

        for (var i = 0; i < filteredRows.Count; i++)
        {
            filteredRows[i].Rank = i + 1;
        }

        return new SquadShareCardDto
        {
            SquadId = squad.Id,
            SquadName = squad.Name,
            InviteCode = squad.InviteCode,
            Mode = leaderboard.Mode,
            Period = leaderboard.Period,
            Label = leaderboard.Label,
            MemberCount = members.Count,
            Members = members.Take(8).ToList(),
            LeaderboardRows = filteredRows.Take(8).ToList()
        };
    }

    private async Task<IReadOnlyList<SquadStanding>> BuildSquadStandingsAsync(GameLeaderboardDto leaderboard)
    {
        var squads = await _squadRepository.GetAllActiveAsync();
        var squadScores = new List<SquadStanding>();

        foreach (var squad in squads)
        {
            var members = await _squadRepository.GetMembersAsync(squad.Id);
            var memberIds = members.Select(x => x.UserId).ToHashSet();
            var score = leaderboard.Rows
                .Where(x => memberIds.Contains(x.UserId))
                .Sum(x => x.Score);

            squadScores.Add(new SquadStanding
            {
                SquadId = squad.Id,
                Score = score,
                CreatedAt = squad.CreatedAt
            });
        }

        var ordered = squadScores
            .OrderByDescending(x => x.Score)
            .ThenBy(x => x.CreatedAt)
            .ToList();

        for (var i = 0; i < ordered.Count; i++)
        {
            ordered[i].Rank = i + 1;
        }

        return ordered;
    }

    private sealed class SquadStanding
    {
        public Guid SquadId { get; set; }
        public int Score { get; set; }
        public int Rank { get; set; }
        public DateTime CreatedAt { get; set; }
    }

    private async Task<string> BuildUniqueInviteCodeAsync()
    {
        const string alphabet = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
        var random = Random.Shared;

        for (var attempt = 0; attempt < 12; attempt++)
        {
            var chars = new char[8];
            for (var i = 0; i < chars.Length; i++)
            {
                chars[i] = alphabet[random.Next(alphabet.Length)];
            }

            var code = new string(chars);
            var existing = await _squadRepository.GetByInviteCodeAsync(code);
            if (existing is null)
                return code;
        }

        throw new InvalidOperationException("Could not generate squad invite code.");
    }
}

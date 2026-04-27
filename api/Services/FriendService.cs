using Bts.Api.Models.Domain;
using Bts.Api.Models.Responses;
using Bts.Api.Repositories;

namespace Bts.Api.Services;

public sealed class FriendService
{
    private readonly IUserRepository _userRepository;
    private readonly IFriendRepository _friendRepository;
    private readonly GameLeaderboardService _gameLeaderboardService;

    public FriendService(
        IUserRepository userRepository,
        IFriendRepository friendRepository,
        GameLeaderboardService gameLeaderboardService)
    {
        _userRepository = userRepository;
        _friendRepository = friendRepository;
        _gameLeaderboardService = gameLeaderboardService;
    }

    public async Task<IReadOnlyList<FriendUserResponse>> SearchAsync(Guid userId, string? query)
    {
        var users = await _userRepository.SearchAsync(query, 12);
        var results = new List<FriendUserResponse>();

        foreach (var user in users)
        {
            if (user.Id == userId || !user.IsActive)
                continue;

            var relationship = await _friendRepository.GetRelationshipAsync(userId, user.Id);

            results.Add(new FriendUserResponse
            {
                UserId = user.Id,
                FriendshipId = relationship?.Id,
                Username = user.Username,
                DisplayName = user.DisplayName,
                AvatarUrl = user.AvatarUrl,
                StatusMessage = user.StatusMessage,
                Status = relationship?.Status ?? "none",
                InitiatedByMe = relationship is not null && relationship.RequesterUserId == userId,
                UpdatedAt = relationship?.UpdatedAt
            });
        }

        return results;
    }

    public async Task<FriendNetworkResponse> GetNetworkAsync(Guid userId)
    {
        var friends = await _friendRepository.GetFriendsAsync(userId);
        var incoming = await _friendRepository.GetIncomingRequestsAsync(userId);
        var outgoing = await _friendRepository.GetOutgoingRequestsAsync(userId);

        return new FriendNetworkResponse
        {
            Friends = friends,
            IncomingRequests = incoming,
            OutgoingRequests = outgoing
        };
    }

    public async Task SendRequestAsync(Guid userId, Guid targetUserId)
    {
        if (userId == targetUserId)
            throw new InvalidOperationException("You cannot add yourself.");

        var target = await _userRepository.GetByIdAsync(targetUserId);
        if (target is null || !target.IsActive)
            throw new KeyNotFoundException("Player not found.");

        var existing = await _friendRepository.GetRelationshipAsync(userId, targetUserId);
        if (existing is not null)
        {
            if (string.Equals(existing.Status, "accepted", StringComparison.OrdinalIgnoreCase))
                throw new InvalidOperationException("You are already friends.");

            if (string.Equals(existing.Status, "pending", StringComparison.OrdinalIgnoreCase))
                throw new InvalidOperationException("There is already a pending friend request.");

            throw new InvalidOperationException("This friendship already exists in a closed state.");
        }

        await _friendRepository.CreateRequestAsync(new Friendship
        {
            Id = Guid.NewGuid(),
            RequesterUserId = userId,
            AddresseeUserId = targetUserId,
            Status = "pending",
            CreatedAt = DateTime.UtcNow,
            UpdatedAt = DateTime.UtcNow
        });
    }

    public async Task AcceptAsync(Guid userId, Guid friendshipId)
    {
        var accepted = await _friendRepository.AcceptAsync(friendshipId, userId);
        if (!accepted)
            throw new InvalidOperationException("Could not accept that friend request.");
    }

    public async Task DeclineAsync(Guid userId, Guid friendshipId)
    {
        var declined = await _friendRepository.DeclineAsync(friendshipId, userId);
        if (!declined)
            throw new InvalidOperationException("Could not decline that friend request.");
    }

    public async Task<Models.Dtos.GameLeaderboardDto> GetFriendsLeaderboardAsync(Guid userId, string mode, string period)
    {
        var leaderboard = await _gameLeaderboardService.GetAsync(mode, period, 1000);
        var friendIds = (await _friendRepository.GetAcceptedFriendIdsAsync(userId)).ToHashSet();
        friendIds.Add(userId);

        var filtered = leaderboard.Rows
            .Where(row => friendIds.Contains(row.UserId))
            .OrderByDescending(row => row.Score)
            .ThenBy(row => row.DisplayName)
            .ThenBy(row => row.Username)
            .ToList();

        for (var i = 0; i < filtered.Count; i++)
        {
            filtered[i].Rank = i + 1;
        }

        leaderboard.Label = $"{leaderboard.Label} - Friends";
        leaderboard.Rows = filtered;
        return leaderboard;
    }

    public async Task<HeadToHeadSummaryResponse> GetHeadToHeadAsync(Guid userId, Guid otherUserId)
    {
        var otherUser = await _userRepository.GetByIdAsync(otherUserId);
        if (otherUser is null || !otherUser.IsActive)
            throw new KeyNotFoundException("Player not found.");

        var relationship = await _friendRepository.GetRelationshipAsync(userId, otherUserId);
        if (relationship is null || !string.Equals(relationship.Status, "accepted", StringComparison.OrdinalIgnoreCase))
            throw new UnauthorizedAccessException("Head-to-head is only available with friends.");

        var trivia = await _friendRepository.GetTriviaHeadToHeadAsync(userId, otherUserId);
        var scramble = await _friendRepository.GetWordScrambleHeadToHeadAsync(userId, otherUserId);

        var currentBoard = await _gameLeaderboardService.GetAsync("combined", "current", 1000);
        var previousBoard = await _gameLeaderboardService.GetAsync("combined", "previous", 1000);
        var currentSelf = currentBoard.Rows.FirstOrDefault(row => row.UserId == userId);
        var currentOther = currentBoard.Rows.FirstOrDefault(row => row.UserId == otherUserId);
        var previousSelf = previousBoard.Rows.FirstOrDefault(row => row.UserId == userId);
        var previousOther = previousBoard.Rows.FirstOrDefault(row => row.UserId == otherUserId);

        var overallWins = trivia.Wins + scramble.Wins;
        var overallLosses = trivia.Losses + scramble.Losses;
        var overallTies = trivia.Ties + scramble.Ties;

        return new HeadToHeadSummaryResponse
        {
            OpponentUserId = otherUser.Id,
            OpponentUsername = otherUser.Username,
            OpponentDisplayName = otherUser.DisplayName,
            Overall = new HeadToHeadRecordResponse
            {
                Matches = trivia.Matches + scramble.Matches,
                Wins = overallWins,
                Losses = overallLosses,
                Ties = overallTies
            },
            BattleTrivia = new HeadToHeadRecordResponse
            {
                Matches = trivia.Matches,
                Wins = trivia.Wins,
                Losses = trivia.Losses,
                Ties = trivia.Ties
            },
            WordScramble = new HeadToHeadRecordResponse
            {
                Matches = scramble.Matches,
                Wins = scramble.Wins,
                Losses = scramble.Losses,
                Ties = scramble.Ties
            },
            CurrentBoardEdge = BuildBoardEdge(currentSelf, currentOther, "current"),
            PreviousBoardEdge = BuildBoardEdge(previousSelf, previousOther, "previous")
        };
    }

    private static string BuildBoardEdge(Models.Dtos.GameLeaderboardRowDto? self, Models.Dtos.GameLeaderboardRowDto? other, string period)
    {
        var label = period == "current" ? "current" : "previous";

        if (self is null && other is null)
            return $"Neither of you landed on the {label} combined board.";
        if (self is not null && other is null)
            return $"You made the {label} combined board and they did not.";
        if (self is null && other is not null)
            return $"They made the {label} combined board and you did not.";
        if (self!.Rank < other!.Rank)
            return $"You lead the {label} combined board matchup at #{self.Rank} vs #{other.Rank}.";
        if (self.Rank > other.Rank)
            return $"They lead the {label} combined board matchup at #{other.Rank} vs #{self.Rank}.";
        return $"You are tied on the {label} combined board at #{self.Rank}.";
    }
}

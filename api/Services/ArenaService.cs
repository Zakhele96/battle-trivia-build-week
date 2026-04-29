using Bts.Api.Hubs;
using Bts.Api.Models.Domain;
using Bts.Api.Models.Requests;
using Bts.Api.Models.Responses;
using Bts.Api.Repositories;
using Microsoft.AspNetCore.SignalR;

namespace Bts.Api.Services;

public sealed class ArenaService
{
    public const string ArenaRoomSlug = "rapnometry-arena";

    private static readonly HashSet<string> AllowedChallengeTypes =
    [
        "Rap Battle",
        "Poetry Battle",
        "Freestyle Prompt",
        "Love Poem",
        "Diss Battle",
        "Storytelling Verse",
        "Gospel/Inspirational",
        "Political/Social Commentary",
        "Comedy Bars",
        "Kasi Slang Challenge",
    ];

    private readonly IRoomRepository _roomRepository;
    private readonly IUserRepository _userRepository;
    private readonly IArenaRepository _arenaRepository;
    private readonly IHubContext<ChatHub> _hubContext;
    private readonly IProfanityFilterService _profanityFilterService;
    private readonly ChatService _chatService;

    public ArenaService(
        IRoomRepository roomRepository,
        IUserRepository userRepository,
        IArenaRepository arenaRepository,
        IHubContext<ChatHub> hubContext,
        IProfanityFilterService profanityFilterService,
        ChatService chatService)
    {
        _roomRepository = roomRepository;
        _userRepository = userRepository;
        _arenaRepository = arenaRepository;
        _hubContext = hubContext;
        _profanityFilterService = profanityFilterService;
        _chatService = chatService;
    }

    public Task<IReadOnlyList<ArenaChallengeResponse>> GetChallengesAsync(Guid roomId, Guid currentUserId, string bucket, int take = 50)
    {
        return _arenaRepository.GetChallengesAsync(roomId, currentUserId, bucket, take);
    }

    public async Task<ArenaChallengeDetailResponse?> GetChallengeDetailAsync(Guid roomId, Guid challengeId, Guid currentUserId)
    {
        await EnsureArenaRoomAsync(roomId);

        var challenge = (await _arenaRepository.GetChallengesAsync(roomId, currentUserId, "all", 100))
            .FirstOrDefault(item => item.Id == challengeId);
        if (challenge is null)
            return null;

        var entries = await _arenaRepository.GetEntriesAsync(challengeId, currentUserId, challenge.WinnerEntryId);
        var comments = await _arenaRepository.GetCommentsAsync(challengeId);
        return new ArenaChallengeDetailResponse
        {
            Challenge = challenge,
            Entries = entries.ToList(),
            Comments = comments.ToList()
        };
    }

    public async Task<ArenaChallengeDetailResponse> CreateChallengeAsync(Guid roomId, Guid userId, CreateArenaChallengeRequest request)
    {
        await EnsureArenaRoomAsync(roomId);
        var user = await _userRepository.GetByIdAsync(userId)
            ?? throw new KeyNotFoundException("User not found.");

        var title = request.Title?.Trim() ?? "";
        var challengeType = request.ChallengeType?.Trim() ?? "";
        var theme = request.Theme?.Trim() ?? "";
        var rules = string.IsNullOrWhiteSpace(request.Rules) ? null : request.Rules.Trim();

        if (string.IsNullOrWhiteSpace(title) || title.Length > 200)
            throw new InvalidOperationException("Challenge title must be between 1 and 200 characters.");

        if (!AllowedChallengeTypes.Contains(challengeType))
            throw new InvalidOperationException("Challenge type is not allowed.");

        if (string.IsNullOrWhiteSpace(theme) || theme.Length > 200)
            throw new InvalidOperationException("Theme must be between 1 and 200 characters.");

        if (rules?.Length > 1000)
            throw new InvalidOperationException("Rules must be 1000 characters or fewer.");

        if (request.MaxEntries is < 2 or > 20)
            throw new InvalidOperationException("Max entries must be between 2 and 20.");

        if (request.SubmissionDurationHours is < 1 or > 72)
            throw new InvalidOperationException("Submission duration must be between 1 and 72 hours.");

        if (request.VotingDurationHours is < 1 or > 72)
            throw new InvalidOperationException("Voting duration must be between 1 and 72 hours.");

        if (_profanityFilterService.ContainsBlockedContent($"{title} {theme} {rules}"))
            throw new InvalidOperationException("Challenge text contains blocked language.");

        var nowUtc = DateTime.UtcNow;
        var challenge = new ArenaChallenge
        {
            Id = Guid.NewGuid(),
            RoomId = roomId,
            CreatedByUserId = userId,
            Title = title,
            ChallengeType = challengeType,
            Theme = theme,
            Rules = rules,
            MaxEntries = request.MaxEntries,
            Status = "open",
            SubmissionEndsAt = nowUtc.AddHours(request.SubmissionDurationHours),
            VotingStartsAt = null,
            VotingEndsAt = nowUtc.AddHours(request.SubmissionDurationHours + request.VotingDurationHours),
            WinnerEntryId = null,
            CreatedAt = nowUtc,
            UpdatedAt = nowUtc
        };

        await _arenaRepository.CreateChallengeAsync(challenge);
        await BroadcastRoomEventAsync(roomId, "ArenaChallengeCreated", new
        {
            challengeId = challenge.Id,
            title = challenge.Title,
            challengeType = challenge.ChallengeType,
            theme = challenge.Theme,
            createdBy = user.DisplayName,
            message = $"New open challenge: {challenge.Title}",
            tone = "info"
        });
        await BroadcastArenaSystemMessageAsync(
            roomId,
            $"New open challenge: {challenge.Title} by {user.DisplayName}. Theme: {challenge.Theme}.");

        return await GetChallengeDetailAsync(roomId, challenge.Id, userId)
            ?? throw new InvalidOperationException("Failed to load created challenge.");
    }

    public async Task<ArenaChallengeDetailResponse> SubmitEntryAsync(Guid roomId, Guid challengeId, Guid userId, CreateArenaEntryRequest request)
    {
        await EnsureArenaRoomAsync(roomId);
        var challenge = await _arenaRepository.GetChallengeByIdAsync(challengeId)
            ?? throw new KeyNotFoundException("Challenge not found.");

        if (challenge.RoomId != roomId)
            throw new KeyNotFoundException("Challenge not found in this room.");

        if (!string.Equals(challenge.Status, "open", StringComparison.OrdinalIgnoreCase))
            throw new InvalidOperationException("Entries are closed for this challenge.");

        if (challenge.SubmissionEndsAt <= DateTime.UtcNow)
            throw new InvalidOperationException("Submission time has ended.");

        var content = request.Content?.Trim() ?? "";
        if (string.IsNullOrWhiteSpace(content))
            throw new InvalidOperationException("Entry cannot be empty.");

        if (content.Length > 4000)
            throw new InvalidOperationException("Entry must be 4000 characters or fewer.");

        if (_profanityFilterService.ContainsBlockedContent(content))
            throw new InvalidOperationException("Entry contains blocked language.");

        if (await _arenaRepository.HasEntryAsync(challengeId, userId))
            throw new InvalidOperationException("You have already submitted an entry for this challenge.");

        var entryCount = await _arenaRepository.GetEntryCountAsync(challengeId);
        if (entryCount >= challenge.MaxEntries)
            throw new InvalidOperationException("This challenge has reached the maximum number of entries.");

        var entry = new ArenaEntry
        {
            Id = Guid.NewGuid(),
            ChallengeId = challengeId,
            UserId = userId,
            Content = content,
            SubmittedAt = DateTime.UtcNow
        };

        await _arenaRepository.CreateEntryAsync(entry);
        var updatedEntryCount = entryCount + 1;

        if (updatedEntryCount >= challenge.MaxEntries)
        {
            await StartVotingAsync(
                challenge,
                DateTime.UtcNow,
                $"Entries are full for {challenge.Title}. Voting is now open.");
        }

        await BroadcastRoomEventAsync(roomId, "ArenaEntrySubmitted", new
        {
            challengeId,
            entryId = entry.Id,
            userId
        });

        return await GetChallengeDetailAsync(roomId, challengeId, userId)
            ?? throw new InvalidOperationException("Failed to load updated challenge.");
    }

    public async Task<ArenaChallengeDetailResponse> CreateCommentAsync(Guid roomId, Guid challengeId, Guid userId, CreateArenaCommentRequest request)
    {
        await EnsureArenaRoomAsync(roomId);
        var challenge = await _arenaRepository.GetChallengeByIdAsync(challengeId)
            ?? throw new KeyNotFoundException("Challenge not found.");

        if (challenge.RoomId != roomId)
            throw new KeyNotFoundException("Challenge not found in this room.");

        var entryCount = await _arenaRepository.GetEntryCountAsync(challengeId);
        var canComment =
            !string.Equals(challenge.Status, "open", StringComparison.OrdinalIgnoreCase) ||
            entryCount >= challenge.MaxEntries;

        if (!canComment)
            throw new InvalidOperationException("Comments open once all entries are in or voting starts.");

        var content = request.Content?.Trim() ?? "";
        if (string.IsNullOrWhiteSpace(content))
            throw new InvalidOperationException("Comment cannot be empty.");

        if (content.Length > 1000)
            throw new InvalidOperationException("Comment must be 1000 characters or fewer.");

        if (_profanityFilterService.ContainsBlockedContent(content))
            throw new InvalidOperationException("Comment contains blocked language.");

        var comment = new ArenaComment
        {
            Id = Guid.NewGuid(),
            ChallengeId = challengeId,
            UserId = userId,
            Content = content,
            CreatedAt = DateTime.UtcNow
        };

        await _arenaRepository.CreateCommentAsync(comment);
        await BroadcastRoomEventAsync(roomId, "ArenaCommentCreated", new
        {
            challengeId,
            commentId = comment.Id,
            userId,
            message = "New battle comment just dropped.",
            tone = "info"
        });

        return await GetChallengeDetailAsync(roomId, challengeId, userId)
            ?? throw new InvalidOperationException("Failed to load updated challenge.");
    }

    public async Task<ArenaChallengeDetailResponse> VoteAsync(Guid roomId, Guid challengeId, Guid userId, VoteArenaEntryRequest request)
    {
        await EnsureArenaRoomAsync(roomId);
        var challenge = await _arenaRepository.GetChallengeByIdAsync(challengeId)
            ?? throw new KeyNotFoundException("Challenge not found.");

        if (challenge.RoomId != roomId)
            throw new KeyNotFoundException("Challenge not found in this room.");

        if (!string.Equals(challenge.Status, "voting", StringComparison.OrdinalIgnoreCase))
            throw new InvalidOperationException("Voting is not open for this challenge.");

        if (challenge.VotingEndsAt <= DateTime.UtcNow)
            throw new InvalidOperationException("Voting has already ended.");

        if (!await _arenaRepository.EntryBelongsToChallengeAsync(challengeId, request.EntryId))
            throw new InvalidOperationException("Selected entry does not belong to this challenge.");

        if (await _arenaRepository.EntryBelongsToUserAsync(request.EntryId, userId))
            throw new InvalidOperationException("You cannot vote for your own entry.");

        if (await _arenaRepository.HasVoteAsync(challengeId, userId))
            throw new InvalidOperationException("You have already voted in this challenge.");

        var vote = new ArenaVote
        {
            Id = Guid.NewGuid(),
            ChallengeId = challengeId,
            EntryId = request.EntryId,
            UserId = userId,
            CreatedAt = DateTime.UtcNow
        };

        await _arenaRepository.CreateVoteAsync(vote);
        await BroadcastRoomEventAsync(roomId, "ArenaVoteSubmitted", new
        {
            challengeId,
            entryId = request.EntryId,
            userId
        });

        return await GetChallengeDetailAsync(roomId, challengeId, userId)
            ?? throw new InvalidOperationException("Failed to load updated challenge.");
    }

    public Task<IReadOnlyList<HallOfBarsItemResponse>> GetHallOfBarsAsync(Guid roomId, int take = 20)
    {
        return _arenaRepository.GetHallOfBarsAsync(roomId, take);
    }

    public Task<IReadOnlyList<ArenaLeaderboardRowResponse>> GetLeaderboardAsync(Guid roomId, int take = 20)
    {
        return _arenaRepository.GetLeaderboardAsync(roomId, take);
    }

    public async Task FinalizeExpiredChallengesAsync(CancellationToken cancellationToken)
    {
        var nowUtc = DateTime.UtcNow;

        var readyForVoting = await _arenaRepository.GetChallengesReadyForVotingAsync(nowUtc);
        foreach (var challenge in readyForVoting)
        {
            await StartVotingAsync(
                challenge,
                nowUtc,
                $"Submissions closed for {challenge.Title}. Voting is now open.",
                cancellationToken);
        }

        var readyToClose = await _arenaRepository.GetChallengesReadyToCloseAsync(nowUtc);
        foreach (var challenge in readyToClose)
        {
            var result = await _arenaRepository.CalculateWinnerAsync(challenge.Id);
            await _arenaRepository.CloseChallengeAsync(challenge.Id, result.WinnerEntryId, nowUtc);
            string winnerNoticeMessage;

            if (result.WinnerEntryId is null)
            {
                winnerNoticeMessage = $"{challenge.Title} ended in a draw.";
                await BroadcastArenaSystemMessageAsync(
                    challenge.RoomId,
                    $"Voting closed for {challenge.Title}. The battle ended in a draw.",
                    cancellationToken);
            }
            else
            {
                var detail = await GetChallengeDetailAsync(challenge.RoomId, challenge.Id, Guid.Empty);
                var winner = detail?.Entries.FirstOrDefault(entry => entry.Id == result.WinnerEntryId);
                var winnerName = winner?.DisplayName ?? winner?.Username ?? "a winner";
                winnerNoticeMessage = $"{winnerName} won {challenge.Title}.";
                await BroadcastArenaSystemMessageAsync(
                    challenge.RoomId,
                    $"{winnerName} won {challenge.Title}. The crowd has decided.",
                    cancellationToken);
            }

            await BroadcastRoomEventAsync(challenge.RoomId, "ArenaWinnerDeclared", new
            {
                challengeId = challenge.Id,
                winnerEntryId = result.WinnerEntryId,
                isDraw = result.IsDraw,
                message = winnerNoticeMessage,
                tone = result.IsDraw ? "info" : "success"
            }, cancellationToken);
        }
    }

    private async Task EnsureArenaRoomAsync(Guid roomId)
    {
        var room = await _roomRepository.GetByIdAsync(roomId);
        if (room is null)
            throw new KeyNotFoundException("Room not found.");

        if (!string.Equals(room.Slug, ArenaRoomSlug, StringComparison.OrdinalIgnoreCase))
            throw new InvalidOperationException("Arena features are only available in the RapNometry Arena room.");
    }

    private Task BroadcastRoomEventAsync(Guid roomId, string eventName, object payload, CancellationToken cancellationToken = default)
    {
        return _hubContext.Clients.Group(roomId.ToString()).SendAsync(eventName, payload, cancellationToken);
    }

    private async Task StartVotingAsync(
        ArenaChallenge challenge,
        DateTime votingStartsAtUtc,
        string systemText,
        CancellationToken cancellationToken = default)
    {
        var votingDuration = challenge.VotingEndsAt - challenge.SubmissionEndsAt;
        if (votingDuration <= TimeSpan.Zero)
        {
            votingDuration = TimeSpan.FromHours(24);
        }

        var votingEndsAtUtc = votingStartsAtUtc.Add(votingDuration);
        var moved = await _arenaRepository.MoveChallengeToVotingAsync(
            challenge.Id,
            votingStartsAtUtc,
            votingEndsAtUtc);

        if (!moved)
            return;

        await BroadcastArenaSystemMessageAsync(challenge.RoomId, systemText, cancellationToken);
        await BroadcastRoomEventAsync(challenge.RoomId, "ArenaChallengeUpdated", new
        {
            challengeId = challenge.Id,
            status = "voting",
            votingStartsAt = votingStartsAtUtc,
            votingEndsAt = votingEndsAtUtc,
            message = $"Voting is live for {challenge.Title}.",
            tone = "success"
        }, cancellationToken);
    }

    private async Task BroadcastArenaSystemMessageAsync(Guid roomId, string text, CancellationToken cancellationToken = default)
    {
        var systemMessage = await _chatService.CreateSystemMessageAsync(roomId, text);
        await _hubContext.Clients.Group(roomId.ToString())
            .SendAsync("ReceiveMessage", systemMessage, cancellationToken);
    }
}

using System.Security.Claims;
using Bts.Api.Models.Domain;
using Bts.Api.Repositories;
using Bts.Api.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.SignalR;
using System.Text.Json;

namespace Bts.Api.Hubs;

[Authorize]
public sealed class ChatHub : Hub
{
    private const string PresenceWatchGroupPrefix = "presence-watch:";
    private readonly ChatService _chatService;
    private readonly TriviaAnswerService _triviaAnswerService;
    private readonly TriviaLeaderboardService _triviaLeaderboardService;
    private readonly ITriviaRoundRepository _triviaRoundRepository;
    private readonly ITriviaAnswerRepository _triviaAnswerRepository;
    private readonly BattleTriviaSessionStatusService _battleTriviaSessionStatusService;
    private readonly WordScrambleAnswerService _wordScrambleAnswerService;
    private readonly WordScrambleStateService _wordScrambleStateService;
    private readonly WordScrambleSessionStatusService _wordScrambleSessionStatusService;
    private readonly IUserRepository _userRepository;
    private readonly IRoomRepository _roomRepository;
    private readonly IBattleItRepository _battleItRepository;
    private readonly UserPresenceService _userPresenceService;
    private readonly IRoomOccupancyTracker _roomOccupancyTracker;
    private readonly DirectMessageService _directMessageService;
    private readonly DirectMessageNotificationQueue _directMessageNotificationQueue;

    public ChatHub(
        ChatService chatService,
        TriviaAnswerService triviaAnswerService,
        TriviaLeaderboardService triviaLeaderboardService,
        ITriviaRoundRepository triviaRoundRepository,
        ITriviaAnswerRepository triviaAnswerRepository,
        BattleTriviaSessionStatusService battleTriviaSessionStatusService,
        WordScrambleAnswerService wordScrambleAnswerService,
        WordScrambleStateService wordScrambleStateService,
        WordScrambleSessionStatusService wordScrambleSessionStatusService,
        IUserRepository userRepository,
        IRoomRepository roomRepository,
        IBattleItRepository battleItRepository,
        UserPresenceService userPresenceService,
        IRoomOccupancyTracker roomOccupancyTracker,
        DirectMessageService directMessageService,
        DirectMessageNotificationQueue directMessageNotificationQueue)
    {
        _chatService = chatService;
        _triviaAnswerService = triviaAnswerService;
        _triviaLeaderboardService = triviaLeaderboardService;
        _triviaRoundRepository = triviaRoundRepository;
        _triviaAnswerRepository = triviaAnswerRepository;
        _battleTriviaSessionStatusService = battleTriviaSessionStatusService;
        _wordScrambleAnswerService = wordScrambleAnswerService;
        _wordScrambleStateService = wordScrambleStateService;
        _wordScrambleSessionStatusService = wordScrambleSessionStatusService;
        _userRepository = userRepository;
        _roomRepository = roomRepository;
        _battleItRepository = battleItRepository;
        _userPresenceService = userPresenceService;
        _roomOccupancyTracker = roomOccupancyTracker;
        _directMessageService = directMessageService;
        _directMessageNotificationQueue = directMessageNotificationQueue;
    }

    private Guid GetCurrentUserId()
    {
        if (!Guid.TryParse(Context.UserIdentifier, out var userId))
            throw new HubException("Unauthorized.");

        return userId;
    }

    private async Task EnsureAdminUserAsync()
    {
        var userId = GetCurrentUserId();
        var user = await _userRepository.GetByIdAsync(userId);

        if (user is null || !user.IsAdmin)
            throw new HubException("Moderator access required.");
    }

    public override async Task OnConnectedAsync()
    {
        if (Guid.TryParse(Context.UserIdentifier, out var userId))
        {
            await _userPresenceService.MarkOnlineAsync(userId);
            await Clients.Group($"{PresenceWatchGroupPrefix}{userId}")
                .SendAsync("DirectPresenceUpdated", new
                {
                    userId,
                    isOnline = true,
                    lastSeenAt = (DateTime?)null
                });
        }

        await base.OnConnectedAsync();
    }

    public override async Task OnDisconnectedAsync(Exception? exception)
    {
        await _roomOccupancyTracker.ClearConnectionAsync(Context.ConnectionId);

        if (Guid.TryParse(Context.UserIdentifier, out var userId))
        {
            var lastSeenAt = await _userPresenceService.MarkOfflineAsync(userId);
            await Clients.Group($"{PresenceWatchGroupPrefix}{userId}")
                .SendAsync("DirectPresenceUpdated", new
                {
                    userId,
                    isOnline = false,
                    lastSeenAt
                });
        }

        await base.OnDisconnectedAsync(exception);
    }

    public async Task WatchPresence(IEnumerable<Guid> userIds)
    {
        foreach (var userId in userIds.Distinct())
        {
            await Groups.AddToGroupAsync(Context.ConnectionId, $"{PresenceWatchGroupPrefix}{userId}");
        }
    }

    public async Task UnwatchPresence(IEnumerable<Guid> userIds)
    {
        foreach (var userId in userIds.Distinct())
        {
            await Groups.RemoveFromGroupAsync(Context.ConnectionId, $"{PresenceWatchGroupPrefix}{userId}");
        }
    }

    public async Task JoinDirectConversation(Guid conversationId)
    {
        var userId = GetCurrentUserId();

        try
        {
            var readReceipt = await _directMessageService.MarkReadAsync(userId, conversationId);
            await Groups.AddToGroupAsync(Context.ConnectionId, $"dm:{conversationId}");

            if (readReceipt is not null)
            {
                await Clients.Group($"dm:{conversationId}")
                    .SendAsync("DirectMessageRead", readReceipt);
            }
        }
        catch (UnauthorizedAccessException ex)
        {
            throw new HubException(ex.Message);
        }
    }

    public async Task LeaveDirectConversation(Guid conversationId)
    {
        await Groups.RemoveFromGroupAsync(Context.ConnectionId, $"dm:{conversationId}");
    }

    public async Task<object> SendDirectMessage(Guid recipientUserId, string messageText, Guid? replyToMessageId = null)
    {
        var userId = GetCurrentUserId();

        try
        {
            var message = await _directMessageService.SendMessageAsync(userId, recipientUserId, messageText, replyToMessageId);
            await Clients.Users(userId.ToString(), recipientUserId.ToString())
                .SendAsync("DirectMessageReceived", message);
            await _directMessageNotificationQueue.QueueAsync(message);
            return new { success = true, message };
        }
        catch (InvalidOperationException ex)
        {
            return new { success = false, message = ex.Message };
        }
        catch (KeyNotFoundException ex)
        {
            return new { success = false, message = ex.Message };
        }
    }

    public async Task ToggleDirectMessageReaction(Guid conversationId, Guid messageId, string emoji)
    {
        var userId = GetCurrentUserId();

        try
        {
            var payload = await _directMessageService.ToggleReactionAsync(userId, messageId, emoji);
            await Clients.Group($"dm:{conversationId}")
                .SendAsync("DirectMessageReactionUpdated", payload);
        }
        catch (InvalidOperationException ex)
        {
            throw new HubException(ex.Message);
        }
        catch (KeyNotFoundException ex)
        {
            throw new HubException(ex.Message);
        }
        catch (UnauthorizedAccessException ex)
        {
            throw new HubException(ex.Message);
        }
    }

    public async Task JoinRoom(Guid roomId)
    {
        await Groups.AddToGroupAsync(Context.ConnectionId, roomId.ToString());
        await _roomOccupancyTracker.MarkJoinedAsync(Context.ConnectionId, roomId);
        var room = await _roomRepository.GetByIdAsync(roomId);

        var displayName = Context.User?.FindFirstValue("displayName") ?? "Someone";

        var systemMessage = await _chatService.CreateSystemMessageAsync(
            roomId,
            $"{displayName} entered the room");

        await Clients.Group(roomId.ToString())
            .SendAsync("ReceiveMessage", systemMessage);

        if (room is null)
            return;

        var isBattleItRoom =
            string.Equals(room.Slug, BattleItService.RoomSlug, StringComparison.OrdinalIgnoreCase);
        BattleItSession? visibleBattleItSession = null;
        if (isBattleItRoom && Guid.TryParse(Context.UserIdentifier, out var battleItUserId))
        {
            visibleBattleItSession = await _battleItRepository.GetVisibleSessionAsync(roomId, battleItUserId);
            if (visibleBattleItSession?.Status is "lobby" or "active")
            {
                await Groups.AddToGroupAsync(
                    Context.ConnectionId,
                    BattleItService.GetSessionGroupName(visibleBattleItSession.Id));
            }
        }

        var isBattleTriviaRoom =
            string.Equals(room.Slug, "battle-trivia", StringComparison.OrdinalIgnoreCase) ||
            string.Equals(room.RoomType, "trivia", StringComparison.OrdinalIgnoreCase) ||
            (isBattleItRoom && visibleBattleItSession?.Status == "active");
        var isWordScrambleRoom =
            string.Equals(room.Slug, "word-scramble", StringComparison.OrdinalIgnoreCase);

        if (isBattleTriviaRoom)
        {
            var activeRoundTask = _triviaRoundRepository.GetActiveRoundDetailsByRoomIdAsync(roomId);
            var leaderboardTask = _triviaLeaderboardService.GetActiveRoomLeaderboardAsync(roomId, 5);
            var sessionStatusTask = _battleTriviaSessionStatusService.GetRoomStatusAsync(roomId);
            var playerRankTask = Guid.TryParse(Context.UserIdentifier, out var currentUserId)
                ? _triviaLeaderboardService.GetActiveRoomPlayerRankAsync(roomId, currentUserId)
                : Task.FromResult<Bts.Api.Models.Dtos.TriviaPlayerRankDto?>(null);

            await Task.WhenAll(activeRoundTask, leaderboardTask, sessionStatusTask, playerRankTask);

            var activeRound = activeRoundTask.Result;
            if (activeRound is not null &&
                string.Equals(activeRound.Status, "active", StringComparison.OrdinalIgnoreCase))
            {
                var battleQuestion = visibleBattleItSession is null
                    ? null
                    : await _battleItRepository.GetQuestionByIdAsync(
                        visibleBattleItSession.Id,
                        activeRound.QuestionId);
                await Clients.Caller.SendAsync("QuestionStarted", new
                {
                    roundId = activeRound.RoundId,
                    questionText = activeRound.QuestionText,
                    questionImageUrl = room.BattleTriviaMediaEnabled ? activeRound.QuestionImageUrl : null,
                    category = activeRound.Category,
                    difficulty = activeRound.Difficulty,
                    roundNumber = activeRound.RoundNumber,
                    totalQuestions = visibleBattleItSession is null
                        ? (int?)null
                        : (await _battleItRepository.GetQuestionsAsync(visibleBattleItSession.Id)).Count,
                    sessionTitle = visibleBattleItSession?.Title,
                    answerMode = visibleBattleItSession?.AnswerMode ?? "text",
                    answerOptions = ReadAnswerOptions(battleQuestion?.AnswerOptionsJson),
                    endsAt = activeRound.EndsAt.ToUniversalTime().ToString("O")
                });
            }

            await Clients.Caller.SendAsync("LeaderboardUpdated", leaderboardTask.Result);
            await Clients.Caller.SendAsync("PlayerRankUpdated", playerRankTask.Result);
            await Clients.Caller.SendAsync("SessionStatusUpdated", sessionStatusTask.Result);
        }

        if (isWordScrambleRoom)
        {
            Guid? currentWordScrambleUserId = null;
            if (Guid.TryParse(Context.UserIdentifier, out var parsedWordScrambleUserId))
            {
                currentWordScrambleUserId = parsedWordScrambleUserId;
            }

            var wordScrambleStateTask = _wordScrambleStateService.GetRoomStateAsync(
                roomId,
                currentWordScrambleUserId);
            var wordScrambleStatusTask = _wordScrambleSessionStatusService.GetRoomStatusAsync(roomId);

            await Task.WhenAll(wordScrambleStateTask, wordScrambleStatusTask);

            await Clients.Caller.SendAsync("WordScrambleStateChanged", wordScrambleStateTask.Result);
            await Clients.Caller.SendAsync("WordScrambleSessionStatusChanged", wordScrambleStatusTask.Result);
        }
    }

    public async Task LeaveRoom(Guid roomId)
    {
        var displayName = Context.User?.FindFirstValue("displayName") ?? "Someone";

        var systemMessage = await _chatService.CreateSystemMessageAsync(
            roomId,
            $"{displayName} left the room");

        await Clients.Group(roomId.ToString())
            .SendAsync("ReceiveMessage", systemMessage);

        await Groups.RemoveFromGroupAsync(Context.ConnectionId, roomId.ToString());
        await _roomOccupancyTracker.MarkLeftAsync(Context.ConnectionId, roomId);
    }

    public async Task JoinBattleItSession(Guid sessionId)
    {
        var userId = GetCurrentUserId();
        var session = await _battleItRepository.GetByIdAsync(sessionId);
        if (session is null || session.Status is not ("lobby" or "active") ||
            !await _battleItRepository.IsMemberAsync(sessionId, userId))
        {
            throw new HubException("Join this Battle It session with its code first.");
        }

        await Groups.AddToGroupAsync(
            Context.ConnectionId,
            BattleItService.GetSessionGroupName(sessionId));

        if (session.Status != "active")
            return;

        var activeRound = await _triviaRoundRepository.GetActiveRoundDetailsByRoomIdAsync(session.RoomId);
        if (activeRound is not null &&
            string.Equals(activeRound.Status, "active", StringComparison.OrdinalIgnoreCase))
        {
            var battleQuestion = await _battleItRepository.GetQuestionByIdAsync(
                session.Id,
                activeRound.QuestionId);
            var questionCount = (await _battleItRepository.GetQuestionsAsync(session.Id)).Count;
            await Clients.Caller.SendAsync("QuestionStarted", new
            {
                roundId = activeRound.RoundId,
                questionText = activeRound.QuestionText,
                questionImageUrl = (string?)null,
                category = activeRound.Category,
                difficulty = activeRound.Difficulty,
                roundNumber = activeRound.RoundNumber,
                totalQuestions = questionCount,
                sessionTitle = session.Title,
                answerMode = session.AnswerMode,
                answerOptions = ReadAnswerOptions(battleQuestion?.AnswerOptionsJson),
                endsAt = activeRound.EndsAt.ToUniversalTime().ToString("O")
            });
        }

        var leaderboard = await _triviaLeaderboardService.GetActiveRoomLeaderboardAsync(session.RoomId, 5);
        await Clients.Caller.SendAsync("LeaderboardUpdated", leaderboard);
    }

    public async Task<object> SendMessage(Guid roomId, string messageText, Guid? replyToMessageId = null)
    {
        var userId = GetCurrentUserId();

        try
        {
            var message = await _chatService.CreateUserMessageAsync(
                roomId,
                userId,
                messageText,
                replyToMessageId);

            await Clients.Group(roomId.ToString())
                .SendAsync("ReceiveMessage", message);

            return new
            {
                success = true
            };
        }
        catch (InvalidOperationException ex)
        {
            return new
            {
                success = false,
                message = ex.Message
            };
        }
        catch (KeyNotFoundException ex)
        {
            return new
            {
                success = false,
                message = ex.Message
            };
        }
    }

    public async Task EditMessage(Guid roomId, Guid messageId, string messageText)
    {
        var userId = GetCurrentUserId();

        try
        {
            var updated = await _chatService.EditMessageAsync(
                roomId,
                userId,
                messageId,
                messageText);

            await Clients.Group(roomId.ToString())
                .SendAsync("MessageUpdated", updated);
        }
        catch (InvalidOperationException ex)
        {
            throw new HubException(ex.Message);
        }
        catch (KeyNotFoundException ex)
        {
            throw new HubException(ex.Message);
        }
    }

    public async Task ToggleMessageReaction(Guid roomId, Guid messageId, string emoji)
    {
        var userId = GetCurrentUserId();

        try
        {
            var payload = await _chatService.ToggleReactionAsync(roomId, userId, messageId, emoji);

            await Clients.Group(roomId.ToString())
                .SendAsync("MessageReactionUpdated", payload);
        }
        catch (InvalidOperationException ex)
        {
            throw new HubException(ex.Message);
        }
        catch (KeyNotFoundException ex)
        {
            throw new HubException(ex.Message);
        }
    }

    public async Task PinMessage(Guid roomId, Guid messageId)
    {
        var userId = GetCurrentUserId();
        await EnsureAdminUserAsync();

        try
        {
            var pinned = await _chatService.PinMessageAsync(roomId, userId, messageId);

            await Clients.Group(roomId.ToString())
                .SendAsync("MessagePinned", pinned);
        }
        catch (InvalidOperationException ex)
        {
            throw new HubException(ex.Message);
        }
        catch (KeyNotFoundException ex)
        {
            throw new HubException(ex.Message);
        }
    }

    public async Task UnpinMessage(Guid roomId)
    {
        await EnsureAdminUserAsync();

        try
        {
            await _chatService.UnpinMessageAsync(roomId);

            await Clients.Group(roomId.ToString())
                .SendAsync("MessageUnpinned", new { roomId });
        }
        catch (InvalidOperationException ex)
        {
            throw new HubException(ex.Message);
        }
        catch (KeyNotFoundException ex)
        {
            throw new HubException(ex.Message);
        }
    }

    public async Task SubmitAnswer(Guid roomId, string answerText)
    {
        if (!Guid.TryParse(Context.UserIdentifier, out var userId))
            throw new HubException("Unauthorized.");

        var room = await _roomRepository.GetByIdAsync(roomId);
        var activeBattleItSession = string.Equals(
            room?.Slug,
            BattleItService.RoomSlug,
            StringComparison.OrdinalIgnoreCase)
            ? await _battleItRepository.GetActiveByRoomIdAsync(roomId)
            : null;

        if (activeBattleItSession is not null &&
            !await _battleItRepository.IsMemberAsync(activeBattleItSession.Id, userId))
        {
            throw new HubException("Join this Battle It session before answering.");
        }

        if (activeBattleItSession?.AnswerMode == "multiple-choice")
        {
            var activeRound = await _triviaRoundRepository.GetActiveRoundDetailsByRoomIdAsync(roomId);
            if (activeRound is not null &&
                await _triviaAnswerRepository.GetLatestSubmissionAtAsync(activeRound.RoundId, userId) is not null)
            {
                throw new HubException("Your multiple-choice answer is final for this round.");
            }

            var battleQuestion = activeRound is null
                ? null
                : await _battleItRepository.GetQuestionByIdAsync(
                    activeBattleItSession.Id,
                    activeRound.QuestionId);
            var options = ReadAnswerOptions(battleQuestion?.AnswerOptionsJson);
            if (options.Count != 4 ||
                !options.Contains(answerText.Trim(), StringComparer.OrdinalIgnoreCase))
            {
                throw new HubException("Choose one of the four available answers.");
            }
        }

        var result = await _triviaAnswerService.SubmitAnswerAsync(roomId, userId, answerText);
        var isMultipleChoice = activeBattleItSession?.AnswerMode == "multiple-choice";

        if (!result.Success)
        {
            await Clients.Caller.SendAsync("AnswerRejected", new
            {
                message = result.Message,
                roundId = result.RoundId,
                wrongAttemptsUsed = isMultipleChoice ? Math.Min(1, result.WrongAttemptsUsed) : result.WrongAttemptsUsed,
                wrongAttemptsLeft = isMultipleChoice ? 0 : result.WrongAttemptsLeft,
                maxWrongAttempts = isMultipleChoice ? 1 : result.MaxWrongAttempts
            });

            return;
        }

        if (!result.IsCorrect)
        {
            await Clients.Caller.SendAsync("AnswerChecked", new
            {
                isCorrect = false,
                message = isMultipleChoice
                    ? "Incorrect. Your answer is locked for this round."
                    : result.Message,
                roundId = result.RoundId,
                submittedAnswer = result.SubmittedAnswer,
                wrongAttemptsUsed = isMultipleChoice ? 1 : result.WrongAttemptsUsed,
                wrongAttemptsLeft = isMultipleChoice ? 0 : result.WrongAttemptsLeft,
                maxWrongAttempts = isMultipleChoice ? 1 : result.MaxWrongAttempts
            });

            return;
        }

        if (result.AlreadyAnsweredCorrectly)
        {
            await Clients.Caller.SendAsync("AnswerChecked", new
            {
                isCorrect = true,
                alreadyAnsweredCorrectly = true,
                message = result.Message,
                roundId = result.RoundId,
                submittedAnswer = result.SubmittedAnswer
            });

            return;
        }

        var liveGroup = activeBattleItSession is null
            ? roomId.ToString()
            : BattleItService.GetSessionGroupName(activeBattleItSession.Id);

        var scoreMessage = await _chatService.CreateSystemMessageAsync(
            roomId,
            $"{result.DisplayName} got {result.PointsAwarded} points!");

        await Clients.Group(liveGroup).SendAsync("ReceiveMessage", scoreMessage);

        await Clients.Group(liveGroup)
            .SendAsync("ScoreAwarded", new
            {
                userId = result.UserId,
                displayName = result.DisplayName,
                pointsAwarded = result.PointsAwarded,
                correctRank = result.CorrectRank,
                roundId = result.RoundId
            });

        await Clients.Caller.SendAsync("AnswerChecked", new
        {
            isCorrect = true,
            alreadyAnsweredCorrectly = false,
            message = result.Message,
            roundId = result.RoundId,
            submittedAnswer = result.SubmittedAnswer,
            pointsAwarded = result.PointsAwarded,
            correctRank = result.CorrectRank
        });

        if (result.SessionId.HasValue)
        {
            var leaderboard = await _triviaLeaderboardService.GetSessionLeaderboardAsync(
                result.SessionId.Value,
                5);

            await Clients.Group(liveGroup)
                .SendAsync("LeaderboardUpdated", leaderboard);

            await Clients.All
                .SendAsync("GlobalLeaderboardChanged", new
                {
                    mode = "battle-trivia",
                    period = "current",
                    roomId
                });

            var playerRank = await _triviaLeaderboardService.GetPlayerRankAsync(
                result.SessionId.Value,
                result.UserId);

            await Clients.Caller.SendAsync("PlayerRankUpdated", playerRank);
        }
    }

    private static IReadOnlyList<string> ReadAnswerOptions(string? json)
    {
        if (string.IsNullOrWhiteSpace(json))
            return [];

        try
        {
            return JsonSerializer.Deserialize<List<string>>(json) ?? [];
        }
        catch
        {
            return [];
        }
    }

    public async Task<object> SubmitWordScrambleGuess(Guid roomId, string guessText)
    {
        if (!Guid.TryParse(Context.UserIdentifier, out var userId))
            throw new HubException("Unauthorized.");

        var result = await _wordScrambleAnswerService.SubmitGuessAsync(roomId, userId, guessText);

        if (!result.Success)
        {
            await Clients.Caller.SendAsync("WordScrambleGuessRejected", new
            {
                success = false,
                isCorrect = false,
                alreadyAnsweredCorrectly = false,
                message = result.Message,
                roundId = result.RoundId,
                submittedAnswer = result.SubmittedAnswer,
                normalizedAnswer = result.NormalizedAnswer,
                playerStats = result.PlayerStats,
                wrongAttemptsUsed = result.WrongAttemptsUsed,
                wrongAttemptsLeft = result.WrongAttemptsLeft,
                maxWrongAttempts = result.MaxWrongAttempts
            });

            return new
            {
                success = false,
                isCorrect = false,
                alreadyAnsweredCorrectly = false,
                message = result.Message,
                roundId = result.RoundId,
                submittedAnswer = result.SubmittedAnswer,
                normalizedAnswer = result.NormalizedAnswer,
                playerStats = result.PlayerStats,
                wrongAttemptsUsed = result.WrongAttemptsUsed,
                wrongAttemptsLeft = result.WrongAttemptsLeft,
                maxWrongAttempts = result.MaxWrongAttempts
            };
        }

        if (!result.IsCorrect)
        {
            await Clients.Caller.SendAsync("WordScrambleGuessChecked", new
            {
                success = true,
                isCorrect = false,
                alreadyAnsweredCorrectly = false,
                message = result.Message,
                roundId = result.RoundId,
                submittedAnswer = result.SubmittedAnswer,
                normalizedAnswer = result.NormalizedAnswer,
                playerStats = result.PlayerStats,
                wrongAttemptsUsed = result.WrongAttemptsUsed,
                wrongAttemptsLeft = result.WrongAttemptsLeft,
                maxWrongAttempts = result.MaxWrongAttempts
            });

            return new
            {
                success = true,
                isCorrect = false,
                alreadyAnsweredCorrectly = false,
                message = result.Message,
                roundId = result.RoundId,
                submittedAnswer = result.SubmittedAnswer,
                normalizedAnswer = result.NormalizedAnswer,
                playerStats = result.PlayerStats,
                wrongAttemptsUsed = result.WrongAttemptsUsed,
                wrongAttemptsLeft = result.WrongAttemptsLeft,
                maxWrongAttempts = result.MaxWrongAttempts
            };
        }

        if (result.AlreadyAnsweredCorrectly)
        {
            await Clients.Caller.SendAsync("WordScrambleGuessChecked", new
            {
                success = true,
                isCorrect = true,
                alreadyAnsweredCorrectly = true,
                message = result.Message,
                roundId = result.RoundId,
                submittedAnswer = result.SubmittedAnswer,
                normalizedAnswer = result.NormalizedAnswer,
                playerStats = result.PlayerStats
            });

            return new
            {
                success = true,
                isCorrect = true,
                alreadyAnsweredCorrectly = true,
                message = result.Message,
                roundId = result.RoundId,
                submittedAnswer = result.SubmittedAnswer,
                normalizedAnswer = result.NormalizedAnswer,
                playerStats = result.PlayerStats
            };
        }

        var scoreMessage = await _chatService.CreateSystemMessageAsync(
            roomId,
            $"{result.DisplayName} solved the word for {result.PointsAwarded} points!");

        await Clients.Group(roomId.ToString())
            .SendAsync("ReceiveMessage", scoreMessage);

        await Clients.Group(roomId.ToString())
            .SendAsync("ScoreAwarded", new
            {
                userId = result.UserId,
                displayName = result.DisplayName,
                pointsAwarded = result.PointsAwarded,
                correctRank = result.CorrectRank,
                roundId = result.RoundId
            });

        await Clients.Caller.SendAsync("WordScrambleGuessChecked", new
        {
            success = true,
            isCorrect = true,
            alreadyAnsweredCorrectly = false,
            message = result.Message,
            roundId = result.RoundId,
            submittedAnswer = result.SubmittedAnswer,
            normalizedAnswer = result.NormalizedAnswer,
            pointsAwarded = result.PointsAwarded,
            correctRank = result.CorrectRank,
            solveSeconds = result.SolveSeconds,
            playerStats = result.PlayerStats
        });

        var updatedState = await _wordScrambleStateService.GetRoomStateAsync(roomId);
        await Clients.OthersInGroup(roomId.ToString())
            .SendAsync("WordScrambleStateChanged", updatedState);

        var callerState = await _wordScrambleStateService.GetRoomStateAsync(roomId, userId);
        await Clients.Caller.SendAsync("WordScrambleStateChanged", callerState);

        var updatedStatus = await _wordScrambleSessionStatusService.GetRoomStatusAsync(roomId);
        await Clients.Group(roomId.ToString())
            .SendAsync("WordScrambleSessionStatusChanged", updatedStatus);

        await Clients.All
            .SendAsync("GlobalLeaderboardChanged", new
            {
                mode = "word-scramble",
                period = "current",
                roomId
            });

        return new
        {
            success = true,
            isCorrect = true,
            alreadyAnsweredCorrectly = false,
            message = result.Message,
            roundId = result.RoundId,
            submittedAnswer = result.SubmittedAnswer,
            normalizedAnswer = result.NormalizedAnswer,
            pointsAwarded = result.PointsAwarded,
            correctRank = result.CorrectRank,
            solveSeconds = result.SolveSeconds,
            playerStats = result.PlayerStats
        };
    }
}

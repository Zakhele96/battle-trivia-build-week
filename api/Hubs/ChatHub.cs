using System.Security.Claims;
using Bts.Api.Repositories;
using Bts.Api.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.SignalR;

namespace Bts.Api.Hubs;

[Authorize]
public sealed class ChatHub : Hub
{
    private readonly ChatService _chatService;
    private readonly TriviaAnswerService _triviaAnswerService;
    private readonly TriviaLeaderboardService _triviaLeaderboardService;
    private readonly ITriviaRoundRepository _triviaRoundRepository;
    private readonly BattleTriviaSessionStatusService _battleTriviaSessionStatusService;
    private readonly WordScrambleAnswerService _wordScrambleAnswerService;
    private readonly WordScrambleStateService _wordScrambleStateService;
    private readonly WordScrambleSessionStatusService _wordScrambleSessionStatusService;
    private readonly IUserRepository _userRepository;

    public ChatHub(
        ChatService chatService,
        TriviaAnswerService triviaAnswerService,
        TriviaLeaderboardService triviaLeaderboardService,
        ITriviaRoundRepository triviaRoundRepository,
        BattleTriviaSessionStatusService battleTriviaSessionStatusService,
        WordScrambleAnswerService wordScrambleAnswerService,
        WordScrambleStateService wordScrambleStateService,
        WordScrambleSessionStatusService wordScrambleSessionStatusService,
        IUserRepository userRepository)
    {
        _chatService = chatService;
        _triviaAnswerService = triviaAnswerService;
        _triviaLeaderboardService = triviaLeaderboardService;
        _triviaRoundRepository = triviaRoundRepository;
        _battleTriviaSessionStatusService = battleTriviaSessionStatusService;
        _wordScrambleAnswerService = wordScrambleAnswerService;
        _wordScrambleStateService = wordScrambleStateService;
        _wordScrambleSessionStatusService = wordScrambleSessionStatusService;
        _userRepository = userRepository;
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

    public async Task JoinRoom(Guid roomId)
    {
        await Groups.AddToGroupAsync(Context.ConnectionId, roomId.ToString());

        var displayName = Context.User?.FindFirstValue("displayName") ?? "Someone";

        var systemMessage = await _chatService.CreateSystemMessageAsync(
            roomId,
            $"{displayName} entered the room");

        await Clients.Group(roomId.ToString())
            .SendAsync("ReceiveMessage", systemMessage);

        var activeRound = await _triviaRoundRepository.GetActiveRoundDetailsByRoomIdAsync(roomId);
        if (activeRound is not null &&
            string.Equals(activeRound.Status, "active", StringComparison.OrdinalIgnoreCase))
        {
            await Clients.Caller.SendAsync("QuestionStarted", new
            {
                roundId = activeRound.RoundId,
                questionText = activeRound.QuestionText,
                category = activeRound.Category,
                difficulty = activeRound.Difficulty,
                roundNumber = activeRound.RoundNumber,
                endsAt = activeRound.EndsAt.ToUniversalTime().ToString("O")
            });
        }

        var leaderboard = await _triviaLeaderboardService.GetActiveRoomLeaderboardAsync(roomId, 5);
        await Clients.Caller.SendAsync("LeaderboardUpdated", leaderboard);

        if (Guid.TryParse(Context.UserIdentifier, out var currentUserId))
        {
            var playerRank = await _triviaLeaderboardService.GetActiveRoomPlayerRankAsync(roomId, currentUserId);
            await Clients.Caller.SendAsync("PlayerRankUpdated", playerRank);
        }

        var sessionStatus = await _battleTriviaSessionStatusService.GetRoomStatusAsync(roomId);
        await Clients.Caller.SendAsync("SessionStatusUpdated", sessionStatus);

        Guid? currentWordScrambleUserId = null;
        if (Guid.TryParse(Context.UserIdentifier, out var parsedWordScrambleUserId))
        {
            currentWordScrambleUserId = parsedWordScrambleUserId;
        }

        var wordScrambleState = await _wordScrambleStateService.GetRoomStateAsync(
            roomId,
            currentWordScrambleUserId);
        await Clients.Caller.SendAsync("WordScrambleStateChanged", wordScrambleState);

        var wordScrambleStatus = await _wordScrambleSessionStatusService.GetRoomStatusAsync(roomId);
        await Clients.Caller.SendAsync("WordScrambleSessionStatusChanged", wordScrambleStatus);
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

        var result = await _triviaAnswerService.SubmitAnswerAsync(roomId, userId, answerText);

        if (!result.Success)
        {
            await Clients.Caller.SendAsync("AnswerRejected", new
            {
                message = result.Message,
                roundId = result.RoundId,
                wrongAttemptsUsed = result.WrongAttemptsUsed,
                wrongAttemptsLeft = result.WrongAttemptsLeft,
                maxWrongAttempts = result.MaxWrongAttempts
            });

            return;
        }

        if (!result.IsCorrect)
        {
            await Clients.Caller.SendAsync("AnswerChecked", new
            {
                isCorrect = false,
                message = result.Message,
                roundId = result.RoundId,
                submittedAnswer = result.SubmittedAnswer,
                wrongAttemptsUsed = result.WrongAttemptsUsed,
                wrongAttemptsLeft = result.WrongAttemptsLeft,
                maxWrongAttempts = result.MaxWrongAttempts
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

        var scoreMessage = await _chatService.CreateSystemMessageAsync(
            roomId,
            $"{result.DisplayName} got {result.PointsAwarded} points!");

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

            await Clients.Group(roomId.ToString())
                .SendAsync("LeaderboardUpdated", leaderboard);

            var playerRank = await _triviaLeaderboardService.GetPlayerRankAsync(
                result.SessionId.Value,
                result.UserId);

            await Clients.Caller.SendAsync("PlayerRankUpdated", playerRank);
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

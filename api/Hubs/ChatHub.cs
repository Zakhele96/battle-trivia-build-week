using System.Security.Claims;
using Bts.Api.Models.Requests;
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

    public ChatHub(
        ChatService chatService,
        TriviaAnswerService triviaAnswerService,
        TriviaLeaderboardService triviaLeaderboardService,
        ITriviaRoundRepository triviaRoundRepository,
        BattleTriviaSessionStatusService battleTriviaSessionStatusService,
        WordScrambleAnswerService wordScrambleAnswerService,
        WordScrambleStateService wordScrambleStateService,
        WordScrambleSessionStatusService wordScrambleSessionStatusService)
    {
        _chatService = chatService;
        _triviaAnswerService = triviaAnswerService;
        _triviaLeaderboardService = triviaLeaderboardService;
        _triviaRoundRepository = triviaRoundRepository;
        _battleTriviaSessionStatusService = battleTriviaSessionStatusService;
        _wordScrambleAnswerService = wordScrambleAnswerService;
        _wordScrambleStateService = wordScrambleStateService;
        _wordScrambleSessionStatusService = wordScrambleSessionStatusService;
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
                roundNumber = activeRound.RoundNumber,
                endsAt = activeRound.EndsAt
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

        var wordScrambleState = await _wordScrambleStateService.GetRoomStateAsync(roomId);
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

    public async Task SendMessage(Guid roomId, string messageText)
    {
        if (!Guid.TryParse(Context.UserIdentifier, out var userId))
            throw new HubException("Unauthorized.");

        try
        {
            var message = await _chatService.CreateUserMessageAsync(roomId, userId, messageText);

            await Clients.Group(roomId.ToString())
                .SendAsync("ReceiveMessage", message);
        }
        catch (InvalidOperationException ex)
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
                normalizedAnswer = result.NormalizedAnswer
            });

            return new
            {
                success = true,
                isCorrect = true,
                alreadyAnsweredCorrectly = true,
                message = result.Message,
                roundId = result.RoundId,
                submittedAnswer = result.SubmittedAnswer,
                normalizedAnswer = result.NormalizedAnswer
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
            correctRank = result.CorrectRank
        });

        var updatedState = await _wordScrambleStateService.GetRoomStateAsync(roomId);
        await Clients.Group(roomId.ToString())
            .SendAsync("WordScrambleStateChanged", updatedState);

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
            correctRank = result.CorrectRank
        };
    }


}
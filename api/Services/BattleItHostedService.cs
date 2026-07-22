using Bts.Api.Hubs;
using Bts.Api.Models.Domain;
using Bts.Api.Repositories;
using Microsoft.AspNetCore.SignalR;
using System.Text.Json;

namespace Bts.Api.Services;

public sealed class BattleItHostedService : BackgroundService
{
    private static readonly TimeSpan PollInterval = TimeSpan.FromSeconds(1);

    private readonly IServiceScopeFactory _scopeFactory;
    private readonly IHubContext<ChatHub> _hubContext;
    private readonly IDistributedJobCoordinator _jobCoordinator;
    private readonly ILogger<BattleItHostedService> _logger;
    private DateTime _nextRoundNotBeforeUtc = DateTime.MinValue;

    public BattleItHostedService(
        IServiceScopeFactory scopeFactory,
        IHubContext<ChatHub> hubContext,
        IDistributedJobCoordinator jobCoordinator,
        ILogger<BattleItHostedService> logger)
    {
        _scopeFactory = scopeFactory;
        _hubContext = hubContext;
        _jobCoordinator = jobCoordinator;
        _logger = logger;
    }

    protected override async Task ExecuteAsync(CancellationToken stoppingToken)
    {
        try
        {
            await Task.Delay(TimeSpan.FromSeconds(3), stoppingToken);
        }
        catch (OperationCanceledException)
        {
            return;
        }

        while (!stoppingToken.IsCancellationRequested)
        {
            try
            {
                await _jobCoordinator.RunIfLeaderAsync(
                    "battle-it-hosted-service",
                    TickAsync,
                    stoppingToken);
            }
            catch (OperationCanceledException) when (stoppingToken.IsCancellationRequested)
            {
                break;
            }
            catch (Exception exception)
            {
                _logger.LogError(exception, "Battle It coordinator loop failed.");
            }

            try
            {
                await Task.Delay(PollInterval, stoppingToken);
            }
            catch (OperationCanceledException)
            {
                break;
            }
        }
    }

    private async Task TickAsync(CancellationToken cancellationToken)
    {
        using var scope = _scopeFactory.CreateScope();
        var roomRepository = scope.ServiceProvider.GetRequiredService<IRoomRepository>();
        var battleRepository = scope.ServiceProvider.GetRequiredService<IBattleItRepository>();
        var roundRepository = scope.ServiceProvider.GetRequiredService<ITriviaRoundRepository>();
        var answerRepository = scope.ServiceProvider.GetRequiredService<ITriviaAnswerRepository>();
        var sessionRepository = scope.ServiceProvider.GetRequiredService<ITriviaSessionRepository>();
        var leaderboardService = scope.ServiceProvider.GetRequiredService<TriviaLeaderboardService>();
        var finalizer = scope.ServiceProvider.GetRequiredService<TriviaSessionFinalizerService>();
        var chatService = scope.ServiceProvider.GetRequiredService<ChatService>();
        var occupancyTracker = scope.ServiceProvider.GetRequiredService<IRoomOccupancyTracker>();
        var battleItService = scope.ServiceProvider.GetRequiredService<BattleItService>();

        var room = await roomRepository.GetBySlugAsync(BattleItService.RoomSlug);
        if (room is null || !room.IsActive)
            return;

        var battle = await battleRepository.GetActiveByRoomIdAsync(room.Id);
        if (battle?.GameSessionId is null)
            return;

        var questions = await battleRepository.GetQuestionsAsync(battle.Id);
        if (questions.Count == 0)
            return;

        var activeRound = await roundRepository.GetActiveRoundDetailsByRoomIdAsync(room.Id);
        var nowUtc = DateTime.UtcNow;

        if (activeRound is not null)
        {
            if (activeRound.EndsAt <= nowUtc)
            {
                await EndRoundAsync(
                    battle,
                    questions.Count,
                    activeRound,
                    room.Id,
                    roundRepository,
                    answerRepository,
                    leaderboardService,
                    battleRepository,
                    chatService,
                    cancellationToken);
            }

            return;
        }

        if (nowUtc < _nextRoundNotBeforeUtc)
            return;

        var nextRoundNumber = await roundRepository.GetLatestRoundNumberAsync(battle.GameSessionId.Value) + 1;
        if (nextRoundNumber > questions.Count)
        {
            await CompleteBattleAsync(
                battle,
                room.Id,
                sessionRepository,
                battleRepository,
                finalizer,
                battleItService,
                chatService,
                cancellationToken);
            return;
        }

        if (!await occupancyTracker.HasOccupantsAsync(room.Id))
            return;

        var question = await battleRepository.GetQuestionAtPositionAsync(battle.Id, nextRoundNumber);
        if (question is null)
        {
            _logger.LogWarning(
                "Battle It session {BattleId} is missing question {Position}.",
                battle.Id,
                nextRoundNumber);
            return;
        }

        var startedAtUtc = DateTime.UtcNow;
        var round = new TriviaRound
        {
            Id = Guid.NewGuid(),
            SessionId = battle.GameSessionId.Value,
            QuestionId = question.QuestionId,
            RoundNumber = nextRoundNumber,
            Status = "active",
            StartedAt = startedAtUtc,
            EndsAt = startedAtUtc.AddSeconds(battle.QuestionDurationSeconds),
            CreatedAt = startedAtUtc
        };

        await roundRepository.CreateAsync(round);
        await _hubContext.Clients.Group(BattleItService.GetSessionGroupName(battle.Id)).SendAsync(
            "QuestionStarted",
            new
            {
                roundId = round.Id,
                questionText = question.QuestionText,
                questionImageUrl = (string?)null,
                category = question.Concept,
                difficulty = question.Difficulty,
                roundNumber = round.RoundNumber,
                totalQuestions = questions.Count,
                sessionTitle = battle.Title,
                answerMode = battle.AnswerMode,
                answerOptions = ReadAnswerOptions(question.AnswerOptionsJson),
                endsAt = round.EndsAt.ToUniversalTime().ToString("O")
            },
            cancellationToken);

        var message = await chatService.CreateSystemMessageAsync(
            room.Id,
            $"Question {round.RoundNumber} of {questions.Count} has started!");
        await _hubContext.Clients.Group(room.Id.ToString())
            .SendAsync("ReceiveMessage", message, cancellationToken);

        _logger.LogInformation(
            "Started Battle It round {RoundId} for session {BattleId}.",
            round.Id,
            battle.Id);
    }

    private static IReadOnlyList<string> ReadAnswerOptions(string json)
    {
        try
        {
            return JsonSerializer.Deserialize<List<string>>(json) ?? [];
        }
        catch
        {
            return [];
        }
    }

    private async Task EndRoundAsync(
        BattleItSession battle,
        int questionCount,
        Models.Dtos.TriviaRoundDetails activeRound,
        Guid roomId,
        ITriviaRoundRepository roundRepository,
        ITriviaAnswerRepository answerRepository,
        TriviaLeaderboardService leaderboardService,
        IBattleItRepository battleRepository,
        ChatService chatService,
        CancellationToken cancellationToken)
    {
        await roundRepository.SetStatusAsync(activeRound.RoundId, "ended");
        var question = await battleRepository.GetQuestionByIdAsync(battle.Id, activeRound.QuestionId);

        await _hubContext.Clients.Group(BattleItService.GetSessionGroupName(battle.Id)).SendAsync(
            "RoundEnded",
            new
            {
                roundId = activeRound.RoundId,
                correctAnswer = activeRound.CorrectAnswer,
                answerImageUrl = (string?)null,
                answerExplanation = activeRound.AnswerExplanation,
                sourceExcerpt = question?.SourceExcerpt,
                concept = question?.Concept,
                roundNumber = activeRound.RoundNumber,
                totalQuestions = questionCount
            },
            cancellationToken);

        var winners = (await answerRepository.GetCorrectResultsByRoundAsync(activeRound.RoundId))
            .OrderBy(result => result.CorrectRank)
            .Take(3)
            .Select(result => new
            {
                userId = result.UserId,
                username = result.Username,
                displayName = result.DisplayName,
                submittedAnswer = result.SubmittedAnswer,
                correctRank = result.CorrectRank,
                pointsAwarded = result.PointsAwarded,
                submittedAt = result.SubmittedAt
            })
            .ToList();

        await _hubContext.Clients.Group(BattleItService.GetSessionGroupName(battle.Id))
            .SendAsync("RoundWinners", winners, cancellationToken);

        var leaderboard = await leaderboardService.GetSessionLeaderboardAsync(battle.GameSessionId!.Value, 10);
        await _hubContext.Clients.Group(BattleItService.GetSessionGroupName(battle.Id))
            .SendAsync("LeaderboardUpdated", leaderboard, cancellationToken);

        var delay = battle.RevealDelaySeconds;
        if (activeRound.RoundNumber == 10 && questionCount > 10)
        {
            delay = Math.Max(delay, 8);
            await _hubContext.Clients.Group(BattleItService.GetSessionGroupName(battle.Id)).SendAsync(
                "BattleItHalftime",
                new { roundNumber = 10, totalQuestions = questionCount, leaderboard },
                cancellationToken);

            var halftimeMessage = await chatService.CreateSystemMessageAsync(
                roomId,
                "Halftime! Ten questions down — check the live standings before the second half.");
            await _hubContext.Clients.Group(roomId.ToString())
                .SendAsync("ReceiveMessage", halftimeMessage, cancellationToken);
        }

        _nextRoundNotBeforeUtc = DateTime.UtcNow.AddSeconds(delay);
    }

    private async Task CompleteBattleAsync(
        BattleItSession battle,
        Guid roomId,
        ITriviaSessionRepository sessionRepository,
        IBattleItRepository battleRepository,
        TriviaSessionFinalizerService finalizer,
        BattleItService battleItService,
        ChatService chatService,
        CancellationToken cancellationToken)
    {
        var completedAtUtc = DateTime.UtcNow;
        var results = await finalizer.FinalizeSessionAsync(battle.GameSessionId!.Value);
        await sessionRepository.EndAsync(battle.GameSessionId.Value, completedAtUtc);
        await battleRepository.CompleteAsync(battle.Id, completedAtUtc);

        var podium = results
            .OrderBy(result => result.Rank)
            .Take(3)
            .Select(result => new
            {
                userId = result.UserId,
                username = result.Username,
                displayName = result.DisplayName,
                score = result.Score,
                rank = result.Rank
            })
            .ToList();

        await _hubContext.Clients.Group(BattleItService.GetSessionGroupName(battle.Id)).SendAsync(
            "BattleItCompleted",
            new { sessionId = battle.Id, title = battle.Title, podium },
            cancellationToken);

        var winner = podium.FirstOrDefault();
        var messageText = winner is null
            ? $"{battle.Title} is complete. No points were scored this time."
            : $"{battle.Title} is complete! Winner: {winner.displayName} with {winner.score} points.";
        var message = await chatService.CreateSystemMessageAsync(roomId, messageText);
        await _hubContext.Clients.Group(roomId.ToString())
            .SendAsync("ReceiveMessage", message, cancellationToken);
        await battleItService.NotifyChangedAsync(roomId);

        _nextRoundNotBeforeUtc = DateTime.MinValue;
        _logger.LogInformation("Completed Battle It session {BattleId}.", battle.Id);
    }
}

using Bts.Api.Hubs;
using Bts.Api.Models.Domain;
using Bts.Api.Repositories;
using Microsoft.AspNetCore.SignalR;
using Microsoft.Extensions.Hosting;

namespace Bts.Api.Services;

public sealed class BattleTriviaHostedService : BackgroundService
{
    private const string BattleTriviaSlug = "battle-trivia";
    private static readonly TimeSpan PollInterval = TimeSpan.FromSeconds(1);

    private readonly IServiceScopeFactory _scopeFactory;
    private readonly IHubContext<ChatHub> _hubContext;
    private readonly IDistributedJobCoordinator _jobCoordinator;
    private readonly ILogger<BattleTriviaHostedService> _logger;
    private static readonly TimeZoneInfo GameTimeZone = GetGameTimeZone();

    private DateTime _nextRoundNotBeforeUtc = DateTime.MinValue;

    public BattleTriviaHostedService(
        IServiceScopeFactory scopeFactory,
        IHubContext<ChatHub> hubContext,
        IDistributedJobCoordinator jobCoordinator,
        ILogger<BattleTriviaHostedService> logger)
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
                    "battle-trivia-hosted-service",
                    TickAsync,
                    stoppingToken);
            }
            catch (OperationCanceledException) when (stoppingToken.IsCancellationRequested)
            {
                break;
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "BattleTriviaHostedService loop failed.");
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

    private async Task TickAsync(CancellationToken stoppingToken)
    {
        using var scope = _scopeFactory.CreateScope();

        var roomRepository = scope.ServiceProvider.GetRequiredService<IRoomRepository>();
        var sessionRepository = scope.ServiceProvider.GetRequiredService<ITriviaSessionRepository>();
        var sessionWindowRepository = scope.ServiceProvider.GetRequiredService<ITriviaSessionWindowRepository>();
        var roundRepository = scope.ServiceProvider.GetRequiredService<ITriviaRoundRepository>();
        var questionRepository = scope.ServiceProvider.GetRequiredService<ITriviaQuestionRepository>();
        var answerRepository = scope.ServiceProvider.GetRequiredService<ITriviaAnswerRepository>();
        var leaderboardService = scope.ServiceProvider.GetRequiredService<TriviaLeaderboardService>();
        var sessionFinalizerService = scope.ServiceProvider.GetRequiredService<TriviaSessionFinalizerService>();
        var chatService = scope.ServiceProvider.GetRequiredService<ChatService>();
        var roomOccupancyTracker = scope.ServiceProvider.GetRequiredService<IRoomOccupancyTracker>();

        var room = await roomRepository.GetBySlugAsync(BattleTriviaSlug);
        if (room is null || !room.IsActive)
            return;

        var questionDuration = TimeSpan.FromSeconds(
            room.BattleTriviaQuestionDurationSeconds is >= 5 and <= 120
                ? room.BattleTriviaQuestionDurationSeconds
                : 20);
        var revealDelay = TimeSpan.FromSeconds(
            room.BattleTriviaRevealDelaySeconds is >= 1 and <= 30
                ? room.BattleTriviaRevealDelaySeconds
                : 5);

        var nowUtc = DateTime.UtcNow;

        var session = await sessionRepository.GetActiveByRoomIdAsync(room.Id);
        if (session is null)
        {
            session = CreateDefaultWeeklySession(room.Id, nowUtc);
            await sessionRepository.CreateAsync(session);

            _nextRoundNotBeforeUtc = nowUtc;

            var startedMessage = await chatService.CreateSystemMessageAsync(
                room.Id,
                "A new Battle Trivia weekly session is now live!");

            await _hubContext.Clients.Group(room.Id.ToString())
                .SendAsync("ReceiveMessage", startedMessage, stoppingToken);

            _logger.LogInformation("Started Battle Trivia session {SessionId}", session.Id);
        }

        var activeRound = await roundRepository.GetActiveRoundDetailsByRoomIdAsync(room.Id);

        var effectivePeriodEnd = GetEffectivePeriodEndUtc(session, nowUtc);

        if (nowUtc >= effectivePeriodEnd)
        {
            if (activeRound is not null)
            {
                await roundRepository.SetStatusAsync(activeRound.RoundId, "ended");

                await _hubContext.Clients.Group(room.Id.ToString())
                    .SendAsync("RoundEnded", new
                    {
                        roundId = activeRound.RoundId,
                        correctAnswer = activeRound.CorrectAnswer,
                        answerImageUrl = room.BattleTriviaMediaEnabled ? activeRound.AnswerImageUrl : null,
                        answerExplanation = room.BattleTriviaMediaEnabled ? activeRound.AnswerExplanation : null
                    }, stoppingToken);
            }

            var finalResults = await sessionFinalizerService.FinalizeSessionAsync(session.Id);
            var top3 = finalResults
                .OrderBy(x => x.Rank)
                .ThenByDescending(x => x.Score)
                .Take(3)
                .ToList();

            if (top3.Count > 0)
            {
                var winnerLines = string.Join(" | ", top3.Select(x =>
                    $"#{x.Rank} {x.DisplayName} ({x.Score})"));

                var winnersMessage = await chatService.CreateSystemMessageAsync(
                    room.Id,
                    $"Weekly winners: {winnerLines}");

                await _hubContext.Clients.Group(room.Id.ToString())
                    .SendAsync("ReceiveMessage", winnersMessage, stoppingToken);

                await _hubContext.Clients.Group(room.Id.ToString())
                    .SendAsync("WeeklyWinnersAnnounced", top3, stoppingToken);
            }
            else
            {
                var noWinnersMessage = await chatService.CreateSystemMessageAsync(
                    room.Id,
                    "Weekly session ended with no winners.");

                await _hubContext.Clients.Group(room.Id.ToString())
                    .SendAsync("ReceiveMessage", noWinnersMessage, stoppingToken);
            }

            await sessionRepository.EndAsync(session.Id, effectivePeriodEnd);

            var nextSession = CreateDefaultWeeklySession(room.Id, effectivePeriodEnd.AddSeconds(1));
            nextSession.RunMode = session.RunMode;
            await sessionRepository.CreateAsync(nextSession);

            _nextRoundNotBeforeUtc = DateTime.UtcNow.Add(revealDelay);

            var newSessionMessage = await chatService.CreateSystemMessageAsync(
                room.Id,
                "A new weekly session has started. Round numbers are back to 1.");

            await _hubContext.Clients.Group(room.Id.ToString())
                .SendAsync("ReceiveMessage", newSessionMessage, stoppingToken);

            _logger.LogInformation(
                "Finalized session {OldSessionId} and created session {NewSessionId}",
                session.Id,
                nextSession.Id);

            return;
        }

        if (activeRound is not null)
        {
            if (activeRound.EndsAt <= nowUtc)
            {
                await roundRepository.SetStatusAsync(activeRound.RoundId, "ended");

                await _hubContext.Clients.Group(room.Id.ToString())
                    .SendAsync("RoundEnded", new
                    {
                        roundId = activeRound.RoundId,
                        correctAnswer = activeRound.CorrectAnswer,
                        answerImageUrl = room.BattleTriviaMediaEnabled ? activeRound.AnswerImageUrl : null,
                        answerExplanation = room.BattleTriviaMediaEnabled ? activeRound.AnswerExplanation : null
                    }, stoppingToken);

                var correctAnswerMessage = await chatService.CreateSystemMessageAsync(
                    room.Id,
                    $"Round {activeRound.RoundNumber} ended. Correct answer: {activeRound.CorrectAnswer}");

                await _hubContext.Clients.Group(room.Id.ToString())
                    .SendAsync("ReceiveMessage", correctAnswerMessage, stoppingToken);

                var winners = (await answerRepository.GetCorrectResultsByRoundAsync(activeRound.RoundId))
                    .OrderBy(x => x.CorrectRank)
                    .Take(3)
                    .Select(x => new
                    {
                        userId = x.UserId,
                        username = x.Username,
                        displayName = x.DisplayName,
                        submittedAnswer = x.SubmittedAnswer,
                        correctRank = x.CorrectRank,
                        pointsAwarded = x.PointsAwarded,
                        submittedAt = x.SubmittedAt
                    })
                    .ToList();

                await _hubContext.Clients.Group(room.Id.ToString())
                    .SendAsync("RoundWinners", winners, stoppingToken);

                var leaderboard = await leaderboardService.GetSessionLeaderboardAsync(session.Id, 5);

                await _hubContext.Clients.Group(room.Id.ToString())
                    .SendAsync("LeaderboardUpdated", leaderboard, stoppingToken);

                _nextRoundNotBeforeUtc = DateTime.UtcNow.Add(revealDelay);

                _logger.LogInformation(
                    "Ended Battle Trivia round {RoundId} for session {SessionId}",
                    activeRound.RoundId,
                    session.Id);
            }

            return;
        }

        if (nowUtc < _nextRoundNotBeforeUtc)
            return;

        var hasOccupants = await roomOccupancyTracker.HasOccupantsAsync(room.Id);
        if (!hasOccupants)
            return;

        var canRunNow = await CanRunRoundsNowAsync(session, sessionWindowRepository, nowUtc);
        if (!canRunNow)
            return;

        var question = await questionRepository.GetRandomActiveAsync();
        if (question is null)
        {
            _logger.LogWarning("No active trivia questions available.");
            return;
        }

        var nextRoundNumber = await roundRepository.GetLatestRoundNumberAsync(session.Id) + 1;
        var startedAtUtc = DateTime.UtcNow;
        var endsAtUtc = startedAtUtc.Add(questionDuration);

        var round = new TriviaRound
        {
            Id = Guid.NewGuid(),
            SessionId = session.Id,
            QuestionId = question.Id,
            RoundNumber = nextRoundNumber,
            Status = "active",
            StartedAt = startedAtUtc,
            EndsAt = endsAtUtc,
            CreatedAt = startedAtUtc
        };

        await roundRepository.CreateAsync(round);

        await _hubContext.Clients.Group(room.Id.ToString())
            .SendAsync("QuestionStarted", new
            {
                roundId = round.Id,
                questionText = question.QuestionText,
                questionImageUrl = room.BattleTriviaMediaEnabled ? question.QuestionImageUrl : null,
                category = question.Category,
                difficulty = question.Difficulty,
                roundNumber = round.RoundNumber,
                endsAt = round.EndsAt.ToUniversalTime().ToString("O")
            }, stoppingToken);

        var roundStartMessage = await chatService.CreateSystemMessageAsync(
            room.Id,
            $"Round {round.RoundNumber} has started!");

        await _hubContext.Clients.Group(room.Id.ToString())
            .SendAsync("ReceiveMessage", roundStartMessage, stoppingToken);

        _logger.LogInformation(
            "Started Battle Trivia round {RoundId} with question {QuestionId}",
            round.Id,
            question.Id);
    }

    private static TriviaGameSession CreateDefaultWeeklySession(Guid roomId, DateTime nowUtc)
    {
        var (weekStart, weekEnd) = GetWeeklyPeriodBoundsUtc(nowUtc);

        return new TriviaGameSession
        {
            Id = Guid.NewGuid(),
            RoomId = roomId,
            Status = "active",
            SessionType = "weekly",
            RunMode = "continuous",
            StartedAt = nowUtc,
            EndedAt = null,
            PeriodStart = weekStart,
            PeriodEnd = weekEnd,
            WinnersAnnounced = false
        };
    }

    private static DateTime GetEffectivePeriodEndUtc(TriviaGameSession session, DateTime nowUtc)
    {
        if (session.PeriodEnd.HasValue)
            return ToUtc(session.PeriodEnd.Value);

        var periodStart = session.PeriodStart.HasValue
            ? ToUtc(session.PeriodStart.Value)
            : nowUtc;

        var (_, weekEnd) = GetWeeklyPeriodBoundsUtc(periodStart);
        return weekEnd;
    }

    private static (DateTime StartUtc, DateTime EndUtc) GetWeeklyPeriodBoundsUtc(DateTime value)
    {
        var utcValue = ToUtc(value);
        var localValue = TimeZoneInfo.ConvertTimeFromUtc(utcValue, GameTimeZone);
        var diff = (7 + (localValue.DayOfWeek - DayOfWeek.Monday)) % 7;
        var weekStartLocal = localValue.Date.AddDays(-diff);
        var nextWeekStartLocal = weekStartLocal.AddDays(7);

        var weekStartUtc = TimeZoneInfo.ConvertTimeToUtc(
            DateTime.SpecifyKind(weekStartLocal, DateTimeKind.Unspecified),
            GameTimeZone);
        var nextWeekStartUtc = TimeZoneInfo.ConvertTimeToUtc(
            DateTime.SpecifyKind(nextWeekStartLocal, DateTimeKind.Unspecified),
            GameTimeZone);

        return (weekStartUtc, nextWeekStartUtc.AddTicks(-1));
    }

    private static TimeZoneInfo GetGameTimeZone()
    {
        try
        {
            return TimeZoneInfo.FindSystemTimeZoneById("Africa/Johannesburg");
        }
        catch
        {
            return TimeZoneInfo.FindSystemTimeZoneById("South Africa Standard Time");
        }
    }

    private static DateTime ToUtc(DateTime value)
    {
        return value.Kind switch
        {
            DateTimeKind.Utc => value,
            DateTimeKind.Local => value.ToUniversalTime(),
            _ => DateTime.SpecifyKind(value, DateTimeKind.Utc)
        };
    }

    private static async Task<bool> CanRunRoundsNowAsync(
        TriviaGameSession session,
        ITriviaSessionWindowRepository sessionWindowRepository,
        DateTime nowUtc)
    {
        if (string.Equals(session.RunMode, "continuous", StringComparison.OrdinalIgnoreCase))
            return true;

        if (!string.Equals(session.RunMode, "scheduled", StringComparison.OrdinalIgnoreCase))
            return false;

        var windows = await sessionWindowRepository.GetActiveBySessionIdAsync(session.Id);
        if (windows.Count == 0)
            return false;

        var zone = GetGameTimeZone();
        var localNow = TimeZoneInfo.ConvertTimeFromUtc(nowUtc, zone);

        var dayOfWeek = (int)localNow.DayOfWeek;
        var localTime = TimeOnly.FromDateTime(localNow);

        return windows.Any(w =>
            w.IsActive &&
            w.DayOfWeek == dayOfWeek &&
            localTime >= w.StartTime &&
            localTime < w.EndTime);
    }
}

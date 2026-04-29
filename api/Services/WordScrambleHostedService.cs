using Bts.Api.Hubs;
using Bts.Api.Models.Domain;
using Bts.Api.Repositories;
using Microsoft.AspNetCore.SignalR;

namespace Bts.Api.Services;

public sealed class WordScrambleHostedService : BackgroundService
{
    private const string WordScrambleRoomSlug = "word-scramble";
    private readonly IServiceScopeFactory _scopeFactory;
    private readonly IHubContext<ChatHub> _hubContext;
    private readonly IDistributedJobCoordinator _jobCoordinator;
    private readonly ILogger<WordScrambleHostedService> _logger;
    private static readonly TimeZoneInfo GameTimeZone = GetGameTimeZone();

    public WordScrambleHostedService(
        IServiceScopeFactory scopeFactory,
        IHubContext<ChatHub> hubContext,
        IDistributedJobCoordinator jobCoordinator,
        ILogger<WordScrambleHostedService> logger)
    {
        _scopeFactory = scopeFactory;
        _hubContext = hubContext;
        _jobCoordinator = jobCoordinator;
        _logger = logger;
    }

    protected override async Task ExecuteAsync(CancellationToken stoppingToken)
    {
        while (!stoppingToken.IsCancellationRequested)
        {
            try
            {
                await _jobCoordinator.RunIfLeaderAsync(
                    "word-scramble-hosted-service",
                    RunTickAsync,
                    stoppingToken);
            }
            catch (OperationCanceledException) when (stoppingToken.IsCancellationRequested)
            {
                break;
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Word scramble hosted service tick failed.");
            }

            await Task.Delay(TimeSpan.FromSeconds(1), stoppingToken);
        }
    }

    private async Task RunTickAsync(CancellationToken cancellationToken)
    {
        using var scope = _scopeFactory.CreateScope();

        var roomRepository = scope.ServiceProvider.GetRequiredService<IRoomRepository>();
        var sessionRepository = scope.ServiceProvider.GetRequiredService<IWordScrambleSessionRepository>();
        var roundRepository = scope.ServiceProvider.GetRequiredService<IWordScrambleRoundRepository>();
        var roundBuilderService = scope.ServiceProvider.GetRequiredService<WordScrambleRoundBuilderService>();
        var stateService = scope.ServiceProvider.GetRequiredService<WordScrambleStateService>();
        var statusService = scope.ServiceProvider.GetRequiredService<WordScrambleSessionStatusService>();
        var finalizerService = scope.ServiceProvider.GetRequiredService<WordScrambleSessionFinalizerService>();
        var chatService = scope.ServiceProvider.GetRequiredService<ChatService>();

        var room = await roomRepository.GetBySlugAsync(WordScrambleRoomSlug);
        if (room is null || !room.IsActive)
            return;

        var roundDurationSeconds = room.WordScrambleRoundDurationSeconds is >= 5 and <= 180
            ? room.WordScrambleRoundDurationSeconds
            : 30;
        var revealDurationSeconds = room.WordScrambleRevealDurationSeconds is >= 1 and <= 30
            ? room.WordScrambleRevealDurationSeconds
            : 5;

        var nowUtc = DateTime.UtcNow;

        var session = await sessionRepository.GetActiveByRoomIdAsync(room.Id);
        if (session is null)
        {
            session = CreateDefaultWeeklySession(room.Id, nowUtc);

            await sessionRepository.CreateAsync(session);

            var startedMessage = await chatService.CreateSystemMessageAsync(
                room.Id,
                "A new Word Scramble weekly session is now live!");

            await _hubContext.Clients.Group(room.Id.ToString())
                .SendAsync("ReceiveMessage", startedMessage, cancellationToken);

            await BroadcastAsync(room.Id, stateService, statusService, cancellationToken);
        }

        var latestRound = await roundRepository.GetLatestBySessionIdAsync(session.Id);
        var effectivePeriodEnd = GetEffectivePeriodEndUtc(session, nowUtc);

        if (nowUtc >= effectivePeriodEnd)
        {
            if (latestRound is not null &&
                !string.Equals(latestRound.Status, "closed", StringComparison.OrdinalIgnoreCase))
            {
                await roundRepository.CloseAsync(latestRound.Id);
            }

            var finalResults = await finalizerService.FinalizeSessionAsync(session.Id);
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
                    $"Word Scramble weekly winners: {winnerLines}");

                await _hubContext.Clients.Group(room.Id.ToString())
                    .SendAsync("ReceiveMessage", winnersMessage, cancellationToken);
            }
            else
            {
                var noWinnersMessage = await chatService.CreateSystemMessageAsync(
                    room.Id,
                    "Word Scramble weekly session ended with no winners.");

                await _hubContext.Clients.Group(room.Id.ToString())
                    .SendAsync("ReceiveMessage", noWinnersMessage, cancellationToken);
            }

            await sessionRepository.EndAsync(session.Id, effectivePeriodEnd);

            var nextSession = CreateDefaultWeeklySession(room.Id, effectivePeriodEnd.AddSeconds(1));
            nextSession.RunMode = session.RunMode;
            await sessionRepository.CreateAsync(nextSession);

            var newSessionMessage = await chatService.CreateSystemMessageAsync(
                room.Id,
                "A new Word Scramble weekly session has started. Round numbers are back to 1.");

            await _hubContext.Clients.Group(room.Id.ToString())
                .SendAsync("ReceiveMessage", newSessionMessage, cancellationToken);

            _logger.LogInformation(
                "Finalized Word Scramble session {OldSessionId} and created session {NewSessionId}",
                session.Id,
                nextSession.Id);

            await BroadcastAsync(room.Id, stateService, statusService, cancellationToken);
            return;
        }

        if (latestRound is null || string.Equals(latestRound.Status, "closed", StringComparison.OrdinalIgnoreCase))
        {
            var round = await roundBuilderService.BuildNextRoundAsync(
                session.Id,
                nowUtc,
                roundDurationSeconds);

            await roundRepository.CreateAsync(round);

            await BroadcastAsync(room.Id, stateService, statusService, cancellationToken);
            return;
        }

        if (string.Equals(latestRound.Status, "active", StringComparison.OrdinalIgnoreCase))
        {
            var endsAtUtc = ToUtc(latestRound.EndsAt);
            var secondsLeft = Math.Max(0, (int)Math.Ceiling((endsAtUtc - nowUtc).TotalSeconds));

            if (secondsLeft <= 0)
            {
                await roundRepository.RevealAsync(
                    latestRound.Id,
                    latestRound.AnswerWord.ToUpperInvariant(),
                    nowUtc);

                await BroadcastAsync(room.Id, stateService, statusService, cancellationToken);
                return;
            }

            if (secondsLeft <= 10 &&
                !string.Equals(latestRound.CurrentMask, latestRound.MaskAt10s, StringComparison.Ordinal))
            {
                await roundRepository.UpdateCurrentMaskAsync(latestRound.Id, latestRound.MaskAt10s);
                await BroadcastAsync(room.Id, stateService, statusService, cancellationToken);
            }
            else if (secondsLeft <= 20 &&
                     !string.Equals(latestRound.CurrentMask, latestRound.MaskAt20s, StringComparison.Ordinal))
            {
                await roundRepository.UpdateCurrentMaskAsync(latestRound.Id, latestRound.MaskAt20s);
                await BroadcastAsync(room.Id, stateService, statusService, cancellationToken);
            }
            return;
        }

        if (string.Equals(latestRound.Status, "revealed", StringComparison.OrdinalIgnoreCase))
        {
            var revealedAtUtc = latestRound.RevealedAt.HasValue
                ? ToUtc(latestRound.RevealedAt.Value)
                : (DateTime?)null;

            if (revealedAtUtc.HasValue &&
                revealedAtUtc.Value.AddSeconds(revealDurationSeconds) <= nowUtc)
            {
                await roundRepository.CloseAsync(latestRound.Id);
                await BroadcastAsync(room.Id, stateService, statusService, cancellationToken);
            }
        }
    }

    private async Task BroadcastAsync(
        Guid roomId,
        WordScrambleStateService stateService,
        WordScrambleSessionStatusService statusService,
        CancellationToken cancellationToken)
    {
        var state = await stateService.GetRoomStateAsync(roomId);
        var status = await statusService.GetRoomStatusAsync(roomId);

        await _hubContext.Clients.Group(roomId.ToString())
            .SendAsync("WordScrambleStateChanged", state, cancellationToken);

        await _hubContext.Clients.Group(roomId.ToString())
            .SendAsync("WordScrambleSessionStatusChanged", status, cancellationToken);
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

    private static WordScrambleSession CreateDefaultWeeklySession(Guid roomId, DateTime nowUtc)
    {
        var (weekStart, weekEnd) = GetWeeklyPeriodBoundsUtc(nowUtc);

        return new WordScrambleSession
        {
            Id = Guid.NewGuid(),
            RoomId = roomId,
            Status = "active",
            RunMode = "continuous",
            StartedAt = nowUtc,
            EndedAt = null,
            PeriodStart = weekStart,
            PeriodEnd = weekEnd,
            CreatedAt = nowUtc
        };
    }

    private static DateTime GetEffectivePeriodEndUtc(WordScrambleSession session, DateTime nowUtc)
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
}

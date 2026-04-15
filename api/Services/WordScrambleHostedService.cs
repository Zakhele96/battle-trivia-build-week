using Bts.Api.Hubs;
using Bts.Api.Models.Domain;
using Bts.Api.Repositories;
using Microsoft.AspNetCore.SignalR;

namespace Bts.Api.Services;

public sealed class WordScrambleHostedService : BackgroundService
{
    private const string WordScrambleRoomSlug = "word-scramble";
    private const int RoundDurationSeconds = 30;
    private const int RevealDurationSeconds = 5;

    private readonly IServiceScopeFactory _scopeFactory;
    private readonly IHubContext<ChatHub> _hubContext;
    private readonly ILogger<WordScrambleHostedService> _logger;

    public WordScrambleHostedService(
        IServiceScopeFactory scopeFactory,
        IHubContext<ChatHub> hubContext,
        ILogger<WordScrambleHostedService> logger)
    {
        _scopeFactory = scopeFactory;
        _hubContext = hubContext;
        _logger = logger;
    }

    protected override async Task ExecuteAsync(CancellationToken stoppingToken)
    {
        while (!stoppingToken.IsCancellationRequested)
        {
            try
            {
                await RunTickAsync(stoppingToken);
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

        var room = await roomRepository.GetBySlugAsync(WordScrambleRoomSlug);
        if (room is null)
            return;

        var nowUtc = DateTime.UtcNow;

        var session = await sessionRepository.GetActiveByRoomIdAsync(room.Id);
        if (session is null)
        {
            session = new WordScrambleSession
            {
                Id = Guid.NewGuid(),
                RoomId = room.Id,
                Status = "active",
                RunMode = "continuous",
                StartedAt = nowUtc,
                EndedAt = null,
                PeriodStart = nowUtc,
                PeriodEnd = null,
                CreatedAt = nowUtc
            };

            await sessionRepository.CreateAsync(session);
        }

        var latestRound = await roundRepository.GetLatestBySessionIdAsync(session.Id);

        if (latestRound is null || string.Equals(latestRound.Status, "closed", StringComparison.OrdinalIgnoreCase))
        {
            var round = await roundBuilderService.BuildNextRoundAsync(
                session.Id,
                nowUtc,
                RoundDurationSeconds);

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
            }
            else if (secondsLeft <= 20 &&
                     !string.Equals(latestRound.CurrentMask, latestRound.MaskAt20s, StringComparison.Ordinal))
            {
                await roundRepository.UpdateCurrentMaskAsync(latestRound.Id, latestRound.MaskAt20s);
            }

            await BroadcastAsync(room.Id, stateService, statusService, cancellationToken);
            return;
        }

        if (string.Equals(latestRound.Status, "revealed", StringComparison.OrdinalIgnoreCase))
        {
            var revealedAtUtc = latestRound.RevealedAt.HasValue
                ? ToUtc(latestRound.RevealedAt.Value)
                : (DateTime?)null;

            if (revealedAtUtc.HasValue &&
                revealedAtUtc.Value.AddSeconds(RevealDurationSeconds) <= nowUtc)
            {
                await roundRepository.CloseAsync(latestRound.Id);
            }

            await BroadcastAsync(room.Id, stateService, statusService, cancellationToken);
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
}
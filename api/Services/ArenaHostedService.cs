using Microsoft.Extensions.Hosting;

namespace Bts.Api.Services;

public sealed class ArenaHostedService : BackgroundService
{
    private static readonly TimeSpan PollInterval = TimeSpan.FromSeconds(5);

    private readonly IServiceScopeFactory _scopeFactory;
    private readonly IDistributedJobCoordinator _jobCoordinator;
    private readonly ILogger<ArenaHostedService> _logger;

    public ArenaHostedService(
        IServiceScopeFactory scopeFactory,
        IDistributedJobCoordinator jobCoordinator,
        ILogger<ArenaHostedService> logger)
    {
        _scopeFactory = scopeFactory;
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
                    "arena-hosted-service",
                    TickAsync,
                    stoppingToken);
            }
            catch (OperationCanceledException) when (stoppingToken.IsCancellationRequested)
            {
                break;
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Arena hosted service tick failed.");
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
        var arenaService = scope.ServiceProvider.GetRequiredService<ArenaService>();
        await arenaService.FinalizeExpiredChallengesAsync(cancellationToken);
    }
}

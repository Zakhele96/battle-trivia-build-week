using Microsoft.Extensions.Hosting;

namespace Bts.Api.Services;

public sealed class DirectMessageNotificationWorker : BackgroundService
{
    private readonly DirectMessageNotificationQueue _queue;
    private readonly IServiceScopeFactory _scopeFactory;
    private readonly ILogger<DirectMessageNotificationWorker> _logger;

    public DirectMessageNotificationWorker(
        DirectMessageNotificationQueue queue,
        IServiceScopeFactory scopeFactory,
        ILogger<DirectMessageNotificationWorker> logger)
    {
        _queue = queue;
        _scopeFactory = scopeFactory;
        _logger = logger;
    }

    protected override async Task ExecuteAsync(CancellationToken stoppingToken)
    {
        await foreach (var message in _queue.ReadAllAsync(stoppingToken))
        {
            try
            {
                using var scope = _scopeFactory.CreateScope();
                var webPushService = scope.ServiceProvider.GetRequiredService<WebPushService>();
                await webPushService.SendDirectMessageNotificationAsync(message);
            }
            catch (OperationCanceledException) when (stoppingToken.IsCancellationRequested)
            {
                break;
            }
            catch (Exception ex)
            {
                _logger.LogWarning(
                    ex,
                    "Failed to process queued direct-message notification for message {MessageId}.",
                    message.Id);
            }
        }
    }
}

using System.Text.Json;
using Bts.Api.Auth;
using Bts.Api.Models.Domain;
using Bts.Api.Models.Requests;
using Bts.Api.Models.Responses;
using Bts.Api.Repositories;
using Microsoft.Extensions.Options;
using WebPush;

namespace Bts.Api.Services;

public sealed class WebPushService
{
    private readonly IUserPushSubscriptionRepository _subscriptionRepository;
    private readonly UserPresenceService _userPresenceService;
    private readonly WebPushOptions _options;
    private readonly ILogger<WebPushService> _logger;

    public WebPushService(
        IUserPushSubscriptionRepository subscriptionRepository,
        UserPresenceService userPresenceService,
        IOptions<WebPushOptions> options,
        ILogger<WebPushService> logger)
    {
        _subscriptionRepository = subscriptionRepository;
        _userPresenceService = userPresenceService;
        _options = options.Value;
        _logger = logger;
    }

    public bool IsConfigured =>
        !string.IsNullOrWhiteSpace(_options.Subject) &&
        !string.IsNullOrWhiteSpace(_options.PublicKey) &&
        !string.IsNullOrWhiteSpace(_options.PrivateKey);

    public string PublicKey => _options.PublicKey;

    public async Task SaveSubscriptionAsync(
        Guid userId,
        SavePushSubscriptionRequest request,
        string? userAgent)
    {
        if (string.IsNullOrWhiteSpace(request.Endpoint) ||
            string.IsNullOrWhiteSpace(request.P256dh) ||
            string.IsNullOrWhiteSpace(request.Auth))
        {
            throw new InvalidOperationException("Push subscription is incomplete.");
        }

        var now = DateTime.UtcNow;
        var subscription = new UserPushSubscription
        {
            Id = Guid.NewGuid(),
            UserId = userId,
            Endpoint = request.Endpoint.Trim(),
            P256dh = request.P256dh.Trim(),
            Auth = request.Auth.Trim(),
            UserAgent = string.IsNullOrWhiteSpace(userAgent) ? null : userAgent.Trim(),
            CreatedAt = now,
            UpdatedAt = now
        };

        await _subscriptionRepository.UpsertAsync(subscription);
    }

    public async Task DeleteSubscriptionAsync(Guid userId, string endpoint)
    {
        if (string.IsNullOrWhiteSpace(endpoint))
            return;

        await _subscriptionRepository.DeleteByEndpointAsync(userId, endpoint.Trim());
    }

    public async Task SendDirectMessageNotificationAsync(DirectMessageResponse message)
    {
        if (!IsConfigured || message.RecipientUserId == Guid.Empty)
            return;

        if (_userPresenceService.IsOnline(message.RecipientUserId))
            return;

        var subscriptions = await _subscriptionRepository.GetByUserIdAsync(message.RecipientUserId);
        if (subscriptions.Count == 0)
            return;

        var payload = JsonSerializer.Serialize(new
        {
            type = "direct-message",
            title = message.SenderDisplayName ?? message.SenderUsername,
            body = message.MessageText,
            conversationId = message.ConversationId,
            senderUserId = message.SenderUserId,
            url = $"/messages?conversationId={message.ConversationId}",
            icon = "/icons/icon-192.svg",
            badge = "/icons/icon-192.svg"
        });

        var client = new WebPushClient();
        var vapidDetails = new VapidDetails(_options.Subject, _options.PublicKey, _options.PrivateKey);

        foreach (var subscription in subscriptions)
        {
            try
            {
                var pushSubscription = new PushSubscription(
                    subscription.Endpoint,
                    subscription.P256dh,
                    subscription.Auth);

                await client.SendNotificationAsync(pushSubscription, payload, vapidDetails);
                await _subscriptionRepository.TouchLastNotifiedAsync(subscription.Id, DateTime.UtcNow);
            }
            catch (WebPushException ex) when (
                ex.StatusCode == System.Net.HttpStatusCode.Gone ||
                ex.StatusCode == System.Net.HttpStatusCode.NotFound)
            {
                await _subscriptionRepository.DeleteByEndpointAsync(subscription.UserId, subscription.Endpoint);
            }
            catch (Exception ex)
            {
                _logger.LogWarning(
                    ex,
                    "Failed to send DM push notification for user {UserId}.",
                    message.RecipientUserId);
            }
        }
    }
}

using Bts.Api.Models.Domain;

namespace Bts.Api.Repositories;

public interface IUserPushSubscriptionRepository
{
    Task UpsertAsync(UserPushSubscription subscription);
    Task<IReadOnlyList<UserPushSubscription>> GetByUserIdAsync(Guid userId);
    Task DeleteByEndpointAsync(Guid userId, string endpoint);
    Task TouchLastNotifiedAsync(Guid subscriptionId, DateTime notifiedAtUtc);
}

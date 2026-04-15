namespace Bts.Api.Services;

public interface IChatRateLimitService
{
    Task<bool> CanSendAsync(Guid roomId, Guid userId);
}
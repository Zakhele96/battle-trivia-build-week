namespace Bts.Api.Repositories;

public interface IUserPresenceRepository
{
    Task<DateTime?> GetLastSeenAtAsync(Guid userId);
    Task<IReadOnlyDictionary<Guid, DateTime?>> GetLastSeenAtManyAsync(IEnumerable<Guid> userIds);
    Task UpsertLastSeenAsync(Guid userId, DateTime lastSeenAtUtc);
}

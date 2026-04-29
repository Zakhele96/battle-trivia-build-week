namespace Bts.Api.Services;

public interface IDistributedJobCoordinator
{
    Task RunIfLeaderAsync(
        string jobName,
        Func<CancellationToken, Task> work,
        CancellationToken cancellationToken);
}

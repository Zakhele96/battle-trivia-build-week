namespace Bts.Api.Services;

public sealed class LocalJobCoordinator : IDistributedJobCoordinator
{
    public Task RunIfLeaderAsync(
        string jobName,
        Func<CancellationToken, Task> work,
        CancellationToken cancellationToken)
    {
        return work(cancellationToken);
    }
}

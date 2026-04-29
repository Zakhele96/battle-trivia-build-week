namespace Bts.Api.Auth;

public sealed class RedisOptions
{
    public const string SectionName = "Redis";

    public bool Enabled { get; set; }
    public string ConnectionString { get; set; } = "";
    public string KeyPrefix { get; set; } = "bts";
    public bool UseSignalRBackplane { get; set; } = true;
    public bool UsePresence { get; set; } = true;
    public bool UseChatRateLimiting { get; set; } = true;
    public bool UseHostedServiceCoordination { get; set; } = true;
    public int PresenceKeyExpiryMinutes { get; set; } = 120;
    public int HostedServiceLockSeconds { get; set; } = 30;
}

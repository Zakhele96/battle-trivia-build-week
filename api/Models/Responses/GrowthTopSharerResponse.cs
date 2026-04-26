namespace Bts.Api.Models.Responses;

public sealed class GrowthTopSharerResponse
{
    public Guid UserId { get; set; }
    public string Username { get; set; } = string.Empty;
    public string DisplayName { get; set; } = string.Empty;
    public int ShareViews { get; set; }
    public int JoinClicks { get; set; }
    public int ReferredSignups { get; set; }
}

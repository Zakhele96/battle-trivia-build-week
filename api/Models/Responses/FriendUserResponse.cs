namespace Bts.Api.Models.Responses;

public sealed class FriendUserResponse
{
    public Guid UserId { get; set; }
    public Guid? FriendshipId { get; set; }
    public string Username { get; set; } = string.Empty;
    public string DisplayName { get; set; } = string.Empty;
    public string Status { get; set; } = "none";
    public bool InitiatedByMe { get; set; }
    public DateTime? UpdatedAt { get; set; }
}

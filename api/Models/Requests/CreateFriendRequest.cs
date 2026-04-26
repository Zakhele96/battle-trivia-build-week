namespace Bts.Api.Models.Requests;

public sealed class CreateFriendRequest
{
    public Guid TargetUserId { get; set; }
}

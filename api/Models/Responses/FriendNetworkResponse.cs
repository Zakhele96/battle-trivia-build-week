namespace Bts.Api.Models.Responses;

public sealed class FriendNetworkResponse
{
    public IReadOnlyList<FriendUserResponse> Friends { get; set; } = Array.Empty<FriendUserResponse>();
    public IReadOnlyList<FriendUserResponse> IncomingRequests { get; set; } = Array.Empty<FriendUserResponse>();
    public IReadOnlyList<FriendUserResponse> OutgoingRequests { get; set; } = Array.Empty<FriendUserResponse>();
}

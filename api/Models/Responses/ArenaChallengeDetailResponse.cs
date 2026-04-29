namespace Bts.Api.Models.Responses;

public sealed class ArenaChallengeDetailResponse
{
    public ArenaChallengeResponse Challenge { get; set; } = new();
    public List<ArenaEntryResponse> Entries { get; set; } = new();
    public List<ArenaCommentResponse> Comments { get; set; } = new();
}

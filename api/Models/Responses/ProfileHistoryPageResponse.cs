namespace Bts.Api.Models.Responses;

public sealed class ProfileHistoryPageResponse
{
    public IReadOnlyList<ProfileHistoryItemResponse> Items { get; set; } =
        Array.Empty<ProfileHistoryItemResponse>();

    public int Page { get; set; }
    public int PageSize { get; set; }
    public int TotalItems { get; set; }
    public int TotalPages { get; set; }
}
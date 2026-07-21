namespace Bts.Api.Models.Responses;

public sealed class TriviaExplanationResponse
{
    public string Explanation { get; init; } = string.Empty;
    public bool Generated { get; init; }
    public string? Model { get; init; }
}

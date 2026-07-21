namespace Bts.Api.Models.Requests;

public sealed class GenerateTriviaQuestionsRequest
{
    public string Topic { get; set; } = string.Empty;
    public string Difficulty { get; set; } = "medium";
    public int Count { get; set; } = 3;
}
